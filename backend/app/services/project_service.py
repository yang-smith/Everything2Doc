from datetime import datetime
from typing import List, Optional, Dict, Any
from sqlmodel import Session, select
import logging
from sqlalchemy import text
import os
import shutil

from app.models.project import Project, ProjectStatus, InputDocument, OutputDocument
from app.utils.file_handler import FileHandler

logger = logging.getLogger(__name__)

class ProjectService:
    @staticmethod
    def create_project(db: Session, name: str, user_id: Optional[str] = None) -> Dict[str, Any]:
        """Create new project with user association"""
        try:
            project = Project(
                name=name,
                status=ProjectStatus.DRAFT,
                created_at=datetime.utcnow(),
                user_id=user_id
            )
            db.add(project)
            db.commit()
            db.refresh(project)
            
            return project.to_dict()
        except Exception as e:
            db.rollback()
            raise e
    
    @staticmethod
    def get_all_projects(db: Session, user_id: Optional[str] = None) -> List[Dict[str, Any]]:
        """Get all projects or filter by user_id"""
        try:
            query = select(Project)
            
            if user_id:
                query = query.where(Project.user_id == user_id)
                
                projects = db.exec(query).all()
                return [project.to_dict() for project in projects] if projects else []
            else:
                return []
        except Exception as e:
            logger.error("Error getting projects: %s", str(e))
            raise e
            

    @staticmethod
    def get_project(db: Session, project_id: str) -> Optional[Dict[str, Any]]:
        """Get project by ID"""
        project = db.exec(select(Project).where(Project.id == project_id)).first()
        return project.to_dict() if project else None
    
    @staticmethod
    def update_project(db: Session, project_id: str, data: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """Update project"""
        project = db.exec(select(Project).where(Project.id == project_id)).first()
        if not project:
            return None
        
        for key, value in data.items():
            if hasattr(project, key):
                setattr(project, key, value)
        
        project.updated_at = datetime.utcnow()
        db.add(project)
        db.commit()
        db.refresh(project)
        
        return project.to_dict()

    @staticmethod
    def rename_project(db: Session, project_id: str, new_name: str):
        """
        重命名项目
        """
        try:
            project = db.exec(select(Project).where(Project.id == project_id)).first()
            
            try:
                sql = text("UPDATE projects SET name = :new_name, updated_at = :updated_at WHERE id = :project_id")
                db.execute(
                    sql,
                    {
                        "new_name": new_name, 
                        "project_id": project_id,
                        "updated_at": datetime.utcnow()
                    }
                )
                
                db.commit()
                
                updated_project = db.exec(select(Project).where(Project.id == project_id)).first()
                
                return updated_project.to_dict()
                
            except Exception as inner_e:
                logger.error(f"执行SQL时出错: {str(inner_e)}", exc_info=True)
                db.rollback()
                raise inner_e
            
        except Exception as e:
            logger.error(f"重命名项目失败: {str(e)}", exc_info=True)
            db.rollback()
            raise

    @staticmethod
    def delete_project(db: Session, project_id: str) -> bool:
        """
        删除项目及关联的文件夹和数据库记录
        """
        try:
            input_docs = db.exec(select(InputDocument).where(InputDocument.project_id == project_id)).all()
            output_docs = db.exec(select(OutputDocument).where(OutputDocument.project_id == project_id)).all()
            
            project_dir = FileHandler.delete_project_files(project_id)
    
            for doc in input_docs:
                db.delete(doc)
            
            for doc in output_docs:
                db.delete(doc)
            
            project = db.exec(select(Project).where(Project.id == project_id)).first()
            if not project:
                return False
            
            db.delete(project)
            db.commit()
            
            return True
        except Exception as e:
            logger.error(f"删除项目失败: {str(e)}", exc_info=True)
            db.rollback()
            raise
