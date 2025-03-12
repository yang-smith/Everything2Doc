from datetime import datetime
from typing import List, Optional, Dict, Any
from sqlmodel import Session, select
import logging

from app.models.project import Project, ProjectStatus

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
