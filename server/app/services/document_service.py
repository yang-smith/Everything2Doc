from app import thread_pool, db
from app.models.model import InputDocument, Outline, OutputDocument, Project, ChatSegment
from app.utils.file_handler import FileHandler
from app.services.cards_service import CardsService
from werkzeug.datastructures import FileStorage
from werkzeug.exceptions import NotFound
from typing import Optional, Dict
from everything2doc import (
    gen_structure,
    split_chat_records,
    process_segments_parallel,
    process_chapters_to_document,
    merge_chapter_results,
    read_file,
    generate_overview,
    generate_recommendation
)
import os
from flask import current_app
from datetime import datetime
from functools import partial
from concurrent.futures import Future
import logging
import re

logger = logging.getLogger(__name__)

class DocumentService:
    def __init__(self):
        self.file_handler = FileHandler()
    
    def add_document_to_project(self, project_id: str, file) -> InputDocument:
        """添加文档到项目"""
        try:
            logger.info(f"Starting to add document to project {project_id}")
            
            project = Project.query.get(project_id)
            if not project:
                raise NotFound('Project not found')
            project.status = 'processing'
            db.session.commit()

            # 保存文件    
            file_path, file_size = self.file_handler.save_input_file(file, project_id)
            logger.info(f"Saved file {file.filename} to {file_path}")
            
            # 创建文档记录
            document = InputDocument(
                project_id=project_id,
                filename=file.filename,
                file_path=file_path,
                file_size=file_size,
                status='processing'  # 更新初始状态
            )
            
            db.session.add(document)
            db.session.commit()
            logger.info(f"Created document record with ID: {document.id}")
            
            # 获取应用上下文对象
            app = current_app._get_current_object()
            doc_id = document.id  # 保存ID供回调使用
            
            # 使用Future跟踪任务执行
            future = thread_pool.submit(
                self._process_document,  # 使用新的包装函数
                app=app,
                project_id=project_id,
                document_id=doc_id,
                file_path=file_path
            )
            
            # 添加回调处理执行结果
            def done_callback(fut: Future, doc_id=doc_id):  # 通过默认参数传递ID
                with app.app_context():
                    try:
                        fut.result()  # 这会重新抛出任何异常
                        document = InputDocument.query.get(doc_id)
                        if document:
                            document.status = 'completed'
                            db.session.commit()
                            logger.info(f"Document {doc_id} processing completed")
                    except Exception as e:
                        document = InputDocument.query.get(doc_id)
                        if document:
                            document.status = 'error'
                            document.error = str(e)
                            db.session.commit()
                        logger.error(f"Error processing document {doc_id}: {str(e)}")
            
            future.add_done_callback(lambda f: done_callback(f, doc_id))
            logger.info(f"Submitted document processing task for document {doc_id}")
            
            return document
            
        except Exception as e:
            db.session.rollback()
            if 'file_path' in locals():
                os.remove(file_path)
            logger.error(f"Error adding document: {str(e)}")
            raise

    def _process_document(self, app, project_id: str, document_id: str, file_path: str):
        """包装函数，确保正确的应用上下文"""
        with app.app_context():
            return self._create_segments(project_id, document_id, file_path)

    def _create_segments(self, project_id: str, document_id: str, file_path: str):
        """创建文档分段"""
        try:
            logger.info(f"Starting to create segments for document {document_id}")
            
            # 读取文件内容
            chat_text = read_file(file_path)
            logger.info(f"Read file content, length: {len(chat_text)}")
            
            # 分段处理
            segments = split_chat_records(
                chat_text,
                max_messages=1100,
                min_messages=800,
                time_gap_minutes=180
            )
            
            if not segments:
                raise ValueError("No chat segments found")
            
            logger.info(f"Created {len(segments)} segments")
            
            # 保存分段
            saved_segments = []
            for idx, segment_content in enumerate(segments):
                # 调试日志
                logger.debug(f"Processing segment {idx}, first few lines:")
                first_few_lines = segment_content.split('\n')[:3]
                for line in first_few_lines:
                    logger.debug(f"Line: {line}")
                
                # 查找第一个和最后一个有效的时间戳
                start_time = None
                end_time = None
                
                lines = segment_content.split('\n')
                # 查找第一个有效时间戳
                for line in lines:
                    try:
                        # 尝试匹配时间戳格式
                        import re
                        time_match = re.match(r'(\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2})', line)
                        if time_match:
                            start_time = datetime.strptime(time_match.group(1), '%Y-%m-%d %H:%M:%S')
                            break
                    except Exception:
                        continue
                
                # 从后向前查找最后一个有效时间戳
                for line in reversed(lines):
                    try:
                        time_match = re.match(r'(\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2})', line)
                        if time_match:
                            end_time = datetime.strptime(time_match.group(1), '%Y-%m-%d %H:%M:%S')
                            break
                    except Exception:
                        continue
                
                if start_time is None or end_time is None:
                    logger.warning(f"Could not find valid timestamps for segment {idx}")
                    # 使用当前时间作为默认值
                    current_time = datetime.utcnow()
                    start_time = start_time or current_time
                    end_time = end_time or current_time
                
                chat_segment = ChatSegment(
                    project_id=project_id,
                    document_id=document_id,
                    segment_index=idx,
                    content=segment_content,
                    start_time=start_time,
                    end_time=end_time
                )
                db.session.add(chat_segment)
                saved_segments.append(chat_segment)
                logger.info(f"Created segment {idx} with time range: {start_time} to {end_time}")
            
            db.session.commit()
            logger.info(f"Successfully saved {len(saved_segments)} segments")
            
            if saved_segments:
                first_segment = saved_segments[0]
                document = InputDocument.query.get(document_id)
                overview = generate_overview(first_segment.content)
                document.overview = overview
                db.session.commit()
                logger.info(f"Generated overview for document {document_id}")

            # Process cards for all segments

            cards_service = CardsService()
            for segment in reversed(saved_segments):
                try:
                    logger.info(f"Processing cards for segment {segment.id}")
                    cards_service.process_segment(project_id, segment.id)
                except Exception as e:
                    logger.error(f"Error processing cards for segment {segment.id}: {str(e)}")
                    continue
            
        except Exception as e:
            db.session.rollback()
            logger.error(f"Error creating segments: {str(e)}")
            raise

    def generate_outline(self, project_id: str, user_input: str = None) -> str:
        """生成文档大纲"""
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

    def update_outline(self, project_id: str, content: str = None) -> Outline:
        """更新大纲"""
        try:
            project = Project.query.get_or_404(project_id)
            
            # 获取或创建大纲对象
            outline = project.outline
            if not outline:
                outline = Outline(project_id=project_id)
                db.session.add(outline)
            
            # 保存大纲文件
            outline_path = self.file_handler.save_outline(
                content,
                project_id
            )
            
            # 更新数据库记录
            outline.file_path = outline_path
            outline.content = content
            outline.status = 'completed'
            project.status = 'outline_updated'
            
            db.session.commit()
            return outline
            
        except Exception as e:
            db.session.rollback()
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

    def get_project_overview(self, project_id: str) -> dict:
        """获取项目概要，包括描述、消息数量和总时长"""
        document = InputDocument.query.filter_by(project_id=project_id).first()
        
        # 读取文档内容
        with open(document.file_path, 'r', encoding='utf-8') as f:
            content = f.read()
        
        # 计算消息数量 (匹配时间戳开头的行)
        messages = re.findall(r'\d{4}-\d{2}-\d{2}\s+\d{2}:\d{2}:\d{2}.*', content)
        message_count = len(messages)
        

        # 计算对话时间范围
        timestamps = re.findall(r'(\d{4}-\d{2}-\d{2}\s+\d{2}:\d{2}:\d{2})', content)
        if timestamps:
            try:
                earliest = datetime.strptime(timestamps[0], '%Y-%m-%d %H:%M:%S')
                latest = datetime.strptime(timestamps[-1], '%Y-%m-%d %H:%M:%S')
                total_time = f"{earliest.strftime('%Y年%m月%d日')} - {latest.strftime('%Y年%m月%d日')}"
            except Exception as e:
                current_app.logger.error(f"Error calculating duration: {str(e)}")
                total_time = "计算错误"
        else:
            total_time = "暂无对话"
    
        
        return {
            'description': document.overview if document.overview else 'processing',
            'messageCount': message_count,
            'totalTime': total_time
        }

    def get_project_content(self, project_id: str) -> str:
        """获取文档内容"""
        document = InputDocument.query.filter_by(project_id=project_id).first()
        if not document:
            raise NotFound("No input document found for this project")
        return read_file(document.file_path)

    def get_project_chat_content(self, project_id: str) -> str:
        """获取项目的聊天记录内容"""
        project = Project.query.get_or_404(project_id)
        
        # 获取最新的输入文档
        input_doc = InputDocument.query.filter_by(
            project_id=project_id
        ).order_by(InputDocument.created_at.desc()).first()
        
        if not input_doc:
            raise NotFound("项目没有可用的聊天记录")
        
        # 读取文件内容
        try:
            with open(input_doc.file_path, 'r', encoding='utf-8') as f:
                return f.read()
        except FileNotFoundError:
            raise NotFound("聊天记录文件不存在")
        except Exception as e:
            current_app.logger.error(f"读取文件失败: {str(e)}")
            raise RuntimeError("无法读取聊天记录文件")
    
    def gen_recommendation(self, project_id: str):
        document = InputDocument.query.filter_by(project_id=project_id).first()
        if document.overview:
            rec = generate_recommendation(document.overview)
        else:
            chat_segment = ChatSegment.query.filter_by(project_id=project_id)\
                .order_by(ChatSegment.start_time.desc()).first()
            if not chat_segment:
                raise ValueError("No available chat content for recommendation")
            
            rec = generate_recommendation(chat_segment.content)
        return rec