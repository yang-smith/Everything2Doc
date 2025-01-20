from app import db, thread_pool
from app.models.model import InputDocument, Outline, OutputDocument, Project, ChatSegment, Card
from app.utils.file_handler import FileHandler
from werkzeug.datastructures import FileStorage
from werkzeug.exceptions import NotFound
from typing import Optional, Dict, List
from everything2doc import (
    gen_structure,
    split_chat_records,
    process_segments_parallel,
    process_chapters_to_document,
    merge_chapter_results,
    read_file
)
import os
from concurrent.futures import Future
from flask import current_app
from everything2doc.core.worker import process_segments_to_cards_parallel
from flask import current_app
import logging

logger = logging.getLogger(__name__)

class CardsService:
    def __init__(self):
        self.file_handler = FileHandler()

        
    def generate_outline(self, project_id: str, user_input: str = None) -> str:
        """生成文档简述"""
        project = Project.query.get_or_404(project_id)
        
        try:
            if not project.input_documents:
                raise ValueError("No input documents found in project")

            if not user_input:
                user_input = project.name

            chat_text = read_file(project.input_documents[0].file_path)
            print("chat_text", project.input_documents[0].file_path)   

            segments = split_chat_records(
                chat_text, 
                max_messages=1300, 
                min_messages=1000, 
                time_gap_minutes=100
            )
            
            if not segments:
                raise ValueError("No chat segments found")
            
            structure_file = os.path.join(
                FileHandler.get_output_dir(project_id),
                'outline.json' 
            )
            # 生成文档结构
            doc_structure, outline = gen_structure(
                user_input, 
                segments[0], 
                model="anthropic/claude-3.5-sonnet:beta",
                structure_file = structure_file
            )

            if project.outline:
                outline_obj = project.outline
            else:
                outline_obj = Outline(project_id=project_id)
                db.session.add(outline_obj)

            outline_path = self.file_handler.save_outline(
                doc_structure, 
                project_id
            )

            # 更新数据库记录
            outline_obj.file_path = outline_path
            outline_obj.content = doc_structure
            outline_obj.status = 'completed'
            project.status = 'outline_generated'
            
            db.session.commit()
            
            return doc_structure
            
        except Exception as e:
            document.status = 'error'
            document.error = str(e)
            db.session.commit()
            raise e



    def start_processing(self, project_id: str) -> dict:
        """开始处理文档"""
        try:
            project = Project.query.get_or_404(project_id)
            
            # 检查必要条件
            if not project.outline:
                raise ValueError("Outline is required before processing")
            
            if not project.input_documents:
                raise ValueError("No input documents found")
                
            # 创建输出文档记录
            output_doc = OutputDocument(
                project_id=project_id,
                status='processing'
            )
            db.session.add(output_doc)
            
            # 更新项目状态
            project.status = 'processing'
            db.session.commit()
            
            # 开始异步处理
            self._process_document_async(project_id, output_doc.id)
            
            return {
                'task_id': output_doc.id,
                'status': 'processing'
            }
            
        except Exception as e:
            db.session.rollback()
            raise e

    def _process_document_async(self, project_id: str, output_doc_id: str):
        """异步处理文档"""
        try:
            project = Project.query.get(project_id)
            output_doc = OutputDocument.query.get(output_doc_id)
            
            # 读取输入文件
            input_doc = project.input_documents[0]
            chat_text = read_file(input_doc.file_path)
            
            # 读取大纲
            outline_content = project.outline.content
            
            # 1. 分割聊天记录
            segments = split_chat_records(
                chat_text,
                max_messages=1300,
                min_messages=1000,
                time_gap_minutes=100
            )
            
            if not segments:
                raise ValueError("No valid chat segments found")

            # 2. 并行处理每个段落
            def update_segment_progress(segment_progress):
                # 将段落处理进度映射到0-99%的总进度范围
                print("segment_progress", segment_progress)
                total_progress = segment_progress * 0.99
                output_doc.progress = total_progress
                db.session.commit()

            results = process_segments_parallel(
                segments,
                outline_content,
                model="openai/gpt-4o-mini-2024-07-18",
                progress_callback=update_segment_progress
            )

            print("results done")

            # 3. 合并章节结果
            merged_content = merge_chapter_results(results)
            print("merged_content done", merged_content)


            merged_path = self.file_handler.save_output_file(
                merged_content,
                'merged.txt',
                project_id
            )

            # 4. 处理章节生成文档
            doc_content = process_chapters_to_document(
                merged_content,
                outline_content,
                model="anthropic/claude-3.5-sonnet:beta"
            )
            
            
            # 保存输出文件
            output_path = self.file_handler.save_output_file(
                doc_content,
                'output.txt',
                project_id
            )
            
            # 更新输出文档状态
            output_doc.file_path = output_path
            output_doc.status = 'completed'
            project.status = 'completed'
            
            db.session.commit()
            
        except Exception as e:
            output_doc.status = 'error'
            output_doc.error = str(e)
            project.status = 'error'
            db.session.commit()
            raise e

    def get_processing_status(self, project_id: str) -> dict:
        """获取处理状态"""
        project = Project.query.get_or_404(project_id)
        # 获取最新的输出文档
        output_doc = OutputDocument.query.filter_by(
            project_id=project_id
        ).order_by(OutputDocument.created_at.desc()).first()
        
        if not output_doc:
            return {
                'status': 'not_started',
                'progress': 0
            }
            
        return {
            'status': output_doc.status,
            'progress': output_doc.progress if hasattr(output_doc, 'progress') else 0,
        }

    def get_output_document(self, project_id: str) -> str:
        """获取输出文档"""
        try:
            # 获取项目的最新输出文档
            output_doc = OutputDocument.query.filter_by(
                project_id=project_id
            ).order_by(OutputDocument.created_at.desc()).first()
            
            if not output_doc:
                raise NotFound("No output document found for this project")
                
            if not output_doc.file_path or not os.path.exists(output_doc.file_path):
                return ''
                
            with open(output_doc.file_path, 'r', encoding='utf-8') as f:
                return f.read()
                
        except NotFound as e:
            raise e
        except Exception as e:
            print(f"Error reading document content: {str(e)}")
            return ''

    def get_project_cards(self, project_id: str, page: int = 1, per_page: int = 10) -> Dict:
        """分页获取项目的cards"""
        project = Project.query.get_or_404(project_id)
        
        # 获取分页数据
        pagination = Card.query.filter_by(project_id=project_id)\
            .order_by(Card.timestamp.desc())\
            .paginate(page=page, per_page=per_page, error_out=False)
            
        return {
            'items': [card.to_dict() for card in pagination.items],
            'total': pagination.total,
            'has_next': pagination.has_next,
            'next_page': pagination.next_num if pagination.has_next else None
        }
    
    def process_segment(self, project_id: str, segment_id: str) -> dict:
        """处理指定分段"""
        try:
            # 验证分段存在且属于正确的项目
            segment = ChatSegment.query.filter_by(
                project_id=project_id,
                id=segment_id
            ).first_or_404()
            
            logger.info(f"Starting to process segment {segment_id} for project {project_id}")
            
            # 获取应用上下文对象
            app = current_app._get_current_object()
            
            # 提交到线程池
            future = thread_pool.submit(
                self._process_segment_wrapper,  # 使用新的包装函数
                app=app,
                segment_id=segment_id
            )
            
            # 添加回调处理执行结果
            def done_callback(fut: Future, seg_id=segment_id):
                with app.app_context():
                    try:
                        fut.result()  # 这会重新抛出任何异常
                        segment = ChatSegment.query.get(seg_id)
                        if segment:
                            segment.is_processed = True
                            db.session.commit()
                            logger.info(f"Segment {seg_id} processing completed")
                    except Exception as e:
                        segment = ChatSegment.query.get(seg_id)
                        if segment:
                            segment.is_processed = False
                            segment.error = str(e)
                            db.session.commit()
                        logger.error(f"Error processing segment {seg_id}: {str(e)}")
            
            future.add_done_callback(lambda f: done_callback(f, segment_id))
            logger.info(f"Submitted segment processing task for segment {segment_id}")
            
            return {
                'message': 'Processing started',
                'segment_id': segment_id
            }
            
        except Exception as e:
            logger.error(f"Error submitting segment processing task: {str(e)}")
            raise

    def _process_segment_wrapper(self, app, segment_id: str):
        """包装函数，确保正确的应用上下文"""
        with app.app_context():
            return self._process_segment_task(segment_id)

    def _process_segment_task(self, segment_id: str):
        """实际的处理任务"""
        try:
            logger.info(f"Starting to process segment {segment_id}")
            
            segment = ChatSegment.query.get(segment_id)
            if not segment:
                raise ValueError(f"Segment {segment_id} not found")
            
            logger.info(f"Processing segment {segment_id} with content length: {len(segment.content)}")
            
            # 生成cards
            cards = process_segments_to_cards_parallel(
                [segment.content],
                model="deepseek-chat",
                max_workers=1
            )
            
            logger.info(f"Generated {len(cards)} cards for segment {segment_id}")
            
            # 保存cards
            for card in cards:
                db_card = Card(
                    project_id=segment.project_id,
                    document_id=segment.document_id,
                    segment_id=segment_id,
                    summary=card.summary,
                    details=card.details,
                    tags=card.tags,
                    timestamp=card.time
                )
                db.session.add(db_card)
                logger.debug(f"Added card: {card.summary[:100]}")
            
            db.session.commit()
            logger.info(f"Successfully saved {len(cards)} cards for segment {segment_id}")
            
            return True
            
        except Exception as e:
            db.session.rollback()
            logger.error(f"Error processing segment {segment_id}: {str(e)}")
            raise

    def get_project_segments(self, project_id: str) -> List[Dict]:
        """获取项目的所有分段信息"""
        project = Project.query.get_or_404(project_id)
        
        segments = ChatSegment.query.filter_by(project_id=project_id)\
            .order_by(ChatSegment.segment_index.asc())\
            .all()
            
        return [segment.to_dict() for segment in segments]