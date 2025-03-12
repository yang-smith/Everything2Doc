import logging
import os
import re
from datetime import datetime
from typing import Dict, List, Optional
from concurrent.futures import Future, ThreadPoolExecutor
from sqlalchemy.orm import Session
from fastapi import BackgroundTasks, UploadFile, HTTPException

from app.models.project import InputDocument, OutputDocument, Project
from app.utils.file_handler import FileHandler
from app.libs.preprocessing.reader import read_file

logger = logging.getLogger(__name__)

class DocumentService:
    def __init__(self):
        self.file_handler = FileHandler()
    
    async def add_document_to_project(self, db: Session, background_tasks: BackgroundTasks, 
                                project_id: str, file: UploadFile):
        """Add document to project"""
        try:
            logger.info(f"Starting to add document to project {project_id}")
            
            project = db.query(Project).filter(Project.id == project_id).first()
            if not project:
                raise HTTPException(status_code=404, detail="Project not found")
                
            project.status = 'processing'
            db.commit()

            # Save file    
            file_path, file_size = await self.file_handler.save_input_file(file, project_id)
            logger.info(f"Saved file {file.filename} to {file_path}")
            
            # Create document record
            document = InputDocument(
                project_id=project_id,
                filename=file.filename,
                file_path=file_path,
                file_size=file_size,
                status='processing'
            )
            
            db.add(document)
            db.commit()
            db.refresh(document)
            logger.info(f"Created document record with ID: {document.id}")
            
            
            result = {
                "id": str(document.id),
                "project_id": str(document.project_id),
            }
            
            return result
            
        except Exception as e:
            db.rollback()
            if 'file_path' in locals():
                os.remove(file_path)
            logger.error(f"Error adding document: {str(e)}")
            raise


 
    def get_output_document(self, db: Session, project_id: str) -> str:
        """Get output document content"""
        try:
            # Get project's latest output document
            output_doc = db.query(OutputDocument)\
                .filter(OutputDocument.project_id == project_id)\
                .order_by(OutputDocument.created_at.desc())\
                .first()
            
            if not output_doc:
                raise HTTPException(status_code=404, detail="No output document found for this project")
                
            if not output_doc.file_path or not os.path.exists(output_doc.file_path):
                return ''
                
            with open(output_doc.file_path, 'r', encoding='utf-8') as f:
                return f.read()
                
        except HTTPException:
            raise
        except Exception as e:
            logger.error(f"Error reading document content: {str(e)}")
            return ''

    def get_project_overview(self, db: Session, project_id: str) -> Dict:
        """Get project overview with description, message count and total time"""
        document = db.query(InputDocument).filter(InputDocument.project_id == project_id).first()
        if not document:
            raise HTTPException(status_code=404, detail="Project not found")
            
        # Read document content
        with open(document.file_path, 'r', encoding='utf-8') as f:
            content = f.read()
        
        # Count messages (match timestamp-prefixed lines)
        messages = re.findall(r'\d{4}-\d{2}-\d{2}\s+\d{2}:\d{2}:\d{2}.*', content)
        message_count = len(messages)
        
        # Calculate conversation time range
        timestamps = re.findall(r'(\d{4}-\d{2}-\d{2}\s+\d{2}:\d{2}:\d{2})', content)
        if timestamps:
            try:
                earliest = datetime.strptime(timestamps[0], '%Y-%m-%d %H:%M:%S')
                latest = datetime.strptime(timestamps[-1], '%Y-%m-%d %H:%M:%S')
                total_time = f"{earliest.strftime('%Y年%m月%d日')} - {latest.strftime('%Y年%m月%d日')}"
            except Exception as e:
                logger.error(f"Error calculating duration: {str(e)}")
                total_time = "计算错误"
        else:
            total_time = "暂无对话"
    
        return {
            'description': document.overview if document.overview else 'processing',
            'messageCount': message_count,
            'totalTime': total_time
        }

    def get_project_content(self, db: Session, project_id: str) -> str:
        """Get document content"""
        document = db.query(InputDocument).filter(InputDocument.project_id == project_id).first()
        if not document:
            raise HTTPException(status_code=404, detail="No input document found for this project")
        return read_file(document.file_path)

    def get_project_chat_content(self, db: Session, project_id: str) -> str:
        """Get project chat content"""
        project = db.query(Project).filter(Project.id == project_id).first()
        if not project:
            raise HTTPException(status_code=404, detail="Project not found")
        
        # Get latest input document
        input_doc = db.query(InputDocument)\
            .filter(InputDocument.project_id == project_id)\
            .order_by(InputDocument.created_at.desc())\
            .first()
        
        if not input_doc:
            raise HTTPException(status_code=404, detail="Project has no available chat records")
        
        # Read file content
        try:
            with open(input_doc.file_path, 'r', encoding='utf-8') as f:
                return f.read()
        except FileNotFoundError:
            raise HTTPException(status_code=404, detail="Chat record file doesn't exist")
        except Exception as e:
            logger.error(f"Failed to read file: {str(e)}")
            raise HTTPException(status_code=500, detail="Cannot read chat record file")
    