from datetime import datetime
from app import db
from enum import Enum
import uuid
import os
import json

def generate_uuid():
    return str(uuid.uuid4())

class ProjectStatus(str, Enum):
    DRAFT = 'draft'
    PROCESSING = 'processing'
    COMPLETED = 'completed'

class Project(db.Model):
    __tablename__ = 'projects'
    
    id = db.Column(db.String(36), primary_key=True, default=generate_uuid)
    name = db.Column(db.String(200))
    status = db.Column(db.String(20), default=ProjectStatus.DRAFT)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # 关联
    input_documents = db.relationship('InputDocument', backref='project', lazy=True)
    outline = db.relationship('Outline', backref='project', uselist=False, lazy=True)
    output_document = db.relationship('OutputDocument', backref='project', uselist=False, lazy=True)

    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'status': self.status,
            'created_at': self.created_at.isoformat(),
            'updated_at': self.updated_at.isoformat()
        }

class DocumentStatus(str, Enum):
    UPLOADED = 'uploaded'
    PROCESSED = 'processed'
    ERROR = 'error'

class InputDocument(db.Model):
    __tablename__ = 'input_documents'
    
    id = db.Column(db.String(36), primary_key=True, default=generate_uuid)
    project_id = db.Column(db.String(36), db.ForeignKey('projects.id'), nullable=False)
    filename = db.Column(db.String(200))  # 原始文件名
    file_path = db.Column(db.String(500))  # 相对于 input 目录的路径
    file_size = db.Column(db.Integer)
    status = db.Column(db.String(20), default=DocumentStatus.UPLOADED)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            'id': self.id,
            'project_id': self.project_id,
            'filename': self.filename,
            'file_size': self.file_size,
            'status': self.status,
            'created_at': self.created_at.isoformat()
        }

class Outline(db.Model):
    __tablename__ = 'outlines'
    
    id = db.Column(db.String(36), primary_key=True, default=generate_uuid)
    project_id = db.Column(db.String(36), db.ForeignKey('projects.id'), nullable=False)
    title = db.Column(db.String(200))
    content = db.Column(db.Text)
    status = db.Column(db.String(20), default='generating')
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    def to_dict(self):
        return {
            'id': self.id,
            'project_id': self.project_id,
            'content': self.content,
            'status': self.status,
            'created_at': self.created_at.isoformat(),
            'updated_at': self.updated_at.isoformat()
        }

class OutputDocument(db.Model):
    __tablename__ = 'output_documents'
    
    id = db.Column(db.String(36), primary_key=True, default=generate_uuid)
    project_id = db.Column(db.String(36), db.ForeignKey('projects.id'), nullable=False)
    title = db.Column(db.String(200))
    file_path = db.Column(db.String(500))  # 相对于 output 目录的路径
    status = db.Column(db.String(20), default='generating')
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    def get_content(self) -> str:
        """读取文档内容"""
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
            'created_at': self.created_at.isoformat(),
            'updated_at': self.updated_at.isoformat()
        }