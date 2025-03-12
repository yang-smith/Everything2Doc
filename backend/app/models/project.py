from datetime import datetime
import uuid
from enum import Enum as PyEnum
from typing import List, Optional

from sqlmodel import Field, SQLModel, Relationship

# 状态枚举
class ProjectStatus(str, PyEnum):
    DRAFT = 'draft'
    PROCESSING = 'processing'
    COMPLETED = 'completed'

class DocumentStatus(str, PyEnum):
    UPLOADED = 'uploaded'
    PROCESSING = 'processing'
    COMPLETED = 'completed'
    FAILED = 'failed'
    
class OutputDocumentStatus(str, PyEnum):
    PENDING = 'pending'
    PROCESSING = 'processing'
    COMPLETED = 'completed'
    FAILED = 'failed'

# 项目模型
class Project(SQLModel, table=True):
    __tablename__ = 'projects'
    
    id: str = Field(default_factory=lambda: str(uuid.uuid4()), primary_key=True)
    name: str = Field(max_length=200)
    status: str = Field(default=ProjectStatus.DRAFT, max_length=20)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    user_id: Optional[str] = Field(default=None, foreign_key="users.id")

    # 关系定义
    input_documents: List["InputDocument"] = Relationship(back_populates="project")
    output_document: Optional["OutputDocument"] = Relationship(back_populates="project")
    user: Optional["User"] = Relationship(back_populates="projects")

    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'status': self.status,
            'created_at': self.created_at.isoformat(),
            'updated_at': self.updated_at.isoformat(),
            'user_id': self.user_id
        }

# 输入文档模型
class InputDocument(SQLModel, table=True):
    __tablename__ = 'input_documents'
    
    id: str = Field(default_factory=lambda: str(uuid.uuid4()), primary_key=True)
    project_id: str = Field(foreign_key="projects.id")
    filename: str = Field(max_length=200)  # 原始文件名
    file_path: str = Field(max_length=500)  # 相对于输入目录的路径
    file_size: int
    overview: Optional[str] = Field(default=None)
    status: str = Field(default=DocumentStatus.UPLOADED, max_length=20)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    
    # 关系定义
    project: Project = Relationship(back_populates="input_documents")
    
    def to_dict(self):
        return {
            'id': self.id,
            'project_id': self.project_id,
            'filename': self.filename,
            'file_size': self.file_size,
            'overview': self.overview,
            'status': self.status,
            'created_at': self.created_at.isoformat()
        }

# 输出文档模型
class OutputDocument(SQLModel, table=True):
    __tablename__ = 'output_documents'
    
    id: str = Field(default_factory=lambda: str(uuid.uuid4()), primary_key=True)
    project_id: str = Field(foreign_key="projects.id")
    title: str = Field(max_length=200)
    file_path: Optional[str] = Field(default=None, max_length=500)
    status: str = Field(default=OutputDocumentStatus.PENDING, max_length=20)
    progress: float = Field(default=0.0)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    
    # 关系定义
    project: Project = Relationship(back_populates="output_document")
    
    def get_content(self) -> str:
        """读取文档内容"""
        import os
        if self.file_path and os.path.exists(self.file_path):
            with open(self.file_path, 'r', encoding='utf-8') as f:
                return f.read()
        return ""
    
    def to_dict(self):
        return {
            'id': self.id,
            'project_id': self.project_id,
            'title': self.title,
            'content': self.get_content(),
            'status': self.status,
            'progress': self.progress,
            'created_at': self.created_at.isoformat(),
            'updated_at': self.updated_at.isoformat()
        } 