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
    overview = db.Column(db.Text)
    status = db.Column(db.String(20), default=DocumentStatus.UPLOADED)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

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
    progress = db.Column(db.Float, default=0.0)
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
            'progress': self.progress,
            'created_at': self.created_at.isoformat(),
            'updated_at': self.updated_at.isoformat()
        }

class SegmentStatus(str, Enum):
    PENDING = 'pending'
    PROCESSING = 'processing' 
    COMPLETED = 'completed'
    ERROR = 'error'

class ChatSegment(db.Model):
    __tablename__ = 'chat_segments'
    
    id = db.Column(db.String(36), primary_key=True, default=generate_uuid)
    project_id = db.Column(db.String(36), db.ForeignKey('projects.id'), nullable=False)
    document_id = db.Column(db.String(36), db.ForeignKey('input_documents.id'), nullable=False)
    segment_index = db.Column(db.Integer, nullable=False)  # 分段序号
    content = db.Column(db.Text)  # 分段内容
    start_time = db.Column(db.DateTime)  # 分段开始时间
    end_time = db.Column(db.DateTime)    # 分段结束时间
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    status = db.Column(db.String(20), default=SegmentStatus.PENDING)


    def to_dict(self):
        return {
            'id': self.id,
            'project_id': self.project_id,
            'document_id': self.document_id,
            'segment_index': self.segment_index,
            'start_time': self.start_time.isoformat() if self.start_time else None,
            'end_time': self.end_time.isoformat() if self.end_time else None,
            'status': self.status,
        }

class Card(db.Model):
    __tablename__ = 'cards'
    
    id = db.Column(db.String(36), primary_key=True, default=generate_uuid)
    project_id = db.Column(db.String(36), db.ForeignKey('projects.id'), nullable=False)
    document_id = db.Column(db.String(36), db.ForeignKey('input_documents.id'), nullable=False)
    segment_id = db.Column(db.String(36), db.ForeignKey('chat_segments.id'), nullable=False)
    
    # 核心内容字段
    summary = db.Column(db.Text)      # 摘要
    details = db.Column(db.Text)      # 详细内容
    tags = db.Column(db.JSON)         # 标签列表
    timestamp = db.Column(db.DateTime) # 事件发生时间
    
    # 元数据
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    def to_markdown(self) -> str:
        """转换为markdown格式"""
        tags_str = ', '.join(self.tags or [])
        return f"""<card>
time: {self.timestamp.strftime('%Y-%m-%d %H:%M:%S')}
tags: {tags_str}
summary: {self.summary}

details: {self.details}
</card>"""
    
    def to_dict(self):
        return {
            'id': self.id,
            'project_id': self.project_id,
            'document_id': self.document_id,
            'segment_id': self.segment_id,
            'summary': self.summary,
            'details': self.details,
            'tags': self.tags,
            'timestamp': self.timestamp.isoformat() if self.timestamp else None,
            'created_at': self.created_at.isoformat(),
            'updated_at': self.updated_at.isoformat()
        }