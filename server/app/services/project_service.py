from app import db
from app.models.model import Project
from datetime import datetime
from typing import List
class ProjectService:
    def create_project(self, name: str) -> Project:
        """创建新项目"""
        try:
            project = Project(
                name=name,
                status='draft',
                created_at=datetime.utcnow()
            )
            db.session.add(project)
            db.session.commit()
            return project
            
        except Exception as e:
            db.session.rollback()
            raise e

    def get_all_projects(self) -> List[Project]:
        """获取所有项目"""
        return Project.query.all()