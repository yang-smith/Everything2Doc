from app import db
from app.models.model import InputDocument, Outline, OutputDocument, Project
from app.utils.file_handler import FileHandler
from werkzeug.datastructures import FileStorage
from werkzeug.exceptions import NotFound
from typing import Optional, Dict
from everything2doc import (
    gen_structure,
    split_chat_records,
    process_segments_parallel,
    process_chapters_to_document,
    merge_chapter_results,
    read_file
)
import os

class DocumentService:
    def __init__(self):
        self.file_handler = FileHandler()
    
    def add_document_to_project(self, project_id: str, file) -> InputDocument:
        """添加文档到项目"""
        try:
            # 检查项目是否存在
            project = Project.query.get(project_id)
            if not project:
                raise NotFound('Project not found')
                
            # 验证文件类型
            if not self.file_handler.allowed_file(file.filename):
                raise ValueError("Invalid file type")
            
            # 保存到输入文件夹
            file_path, file_size = self.file_handler.save_input_file(file, project_id)
            
            # 创建文档记录
            document = InputDocument(
                project_id=project_id,
                filename=file.filename,
                file_path=file_path,
                file_size=file_size,
                status='uploaded'
            )
            
            db.session.add(document)
            db.session.commit()
            
            return document
            
        except Exception as e:
            db.session.rollback()
            # 如果保存文件后发生错误，清理文件
            if 'file_path' in locals():
                os.remove(file_path)
            raise e

            

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
            results = process_segments_parallel(
                segments,
                outline_content,
                model="anthropic/claude-3.5-sonnet:beta"
            )
            
            # 3. 处理章节生成文档
            doc_content = process_chapters_to_document(
                results,
                outline_content,
                model="anthropic/claude-3.5-sonnet:beta"
            )
            
            # 4. 合并章节结果
            final_content = merge_chapter_results(doc_content)
            
            # 保存输出文件
            output_path = self.file_handler.save_output_file(
                final_content,
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
        output_doc = project.output_documents[-1] if project.output_documents else None
        
        if not output_doc:
            return {
                'status': 'not_started',
                'progress': 0
            }
            
        return {
            'status': output_doc.status,
            'progress': output_doc.progress if hasattr(output_doc, 'progress') else 0,
            'error': output_doc.error if output_doc.status == 'error' else None,
            'document_id': output_doc.id if output_doc.status == 'completed' else None
        }

    def get_output_document(self, document_id: str) -> OutputDocument:
        """获取输出文档"""
        document = OutputDocument.query.get_or_404(document_id)
        return document