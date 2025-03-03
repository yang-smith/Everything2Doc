from datetime import datetime
from typing import List
from sqlalchemy.orm import Session
from ..db.models import Project

class ProjectService:
    @staticmethod
    def create_project(db: Session, name: str) -> Project:
        """Create new project"""
        try:
            project = Project(
                name=name,
                status='draft',
                created_at=datetime.utcnow()
            )
            db.add(project)
            db.commit()
            db.refresh(project)
            
            return {
                "id": str(project.id),
                "name": project.name,
                "status": project.status,
                "created_at": project.created_at,
                "updated_at": project.updated_at
            }
            
        except Exception as e:
            db.rollback()
            raise e

    @staticmethod
    def get_all_projects(db: Session) -> List[dict]:
        """Get all projects"""
        projects = db.query(Project).all()
        if projects:
            return [
                {
                    "id": str(project.id),
                    "name": project.name,
                    "status": project.status,
                    "created_at": project.created_at,
                    "updated_at": project.updated_at
                }
                for project in projects
            ]
        return []  # 返回空列表比返回None更符合类型提示List[dict]
    
    @staticmethod
    def get_project(db: Session, project_id: str) -> Project:
        """Get project by ID"""
        result = db.query(Project).filter(Project.id == project_id).first() 
        if result:
            return {
                "id": str(result.id),
                "name": result.name,
                "status": result.status,
                "created_at": result.created_at,
                "updated_at": result.updated_at
            }
        return None
