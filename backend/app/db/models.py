from datetime import datetime
import uuid
import os
import json
from enum import Enum as PyEnum
from typing import List, Optional

from sqlalchemy import Column, String, Integer, DateTime, Text, Float, ForeignKey, JSON
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import relationship
from sqlalchemy.dialects.postgresql import UUID, JSONB

Base = declarative_base()

def generate_uuid():
    return str(uuid.uuid4())

class ProjectStatus(str, PyEnum):
    DRAFT = 'draft'
    PROCESSING = 'processing'
    COMPLETED = 'completed'

class DocumentStatus(str, PyEnum):
    UPLOADED = 'uploaded'
    PROCESSED = 'processed'
    ERROR = 'error'

class SegmentStatus(str, PyEnum):
    PENDING = 'pending'
    PROCESSING = 'processing' 
    COMPLETED = 'completed'
    ERROR = 'error'

class Project(Base):
    __tablename__ = 'projects'
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=generate_uuid)
    name = Column(String(200))
    status = Column(String(20), default=ProjectStatus.DRAFT)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    input_documents = relationship('InputDocument', back_populates='project')
    output_document = relationship('OutputDocument', back_populates='project', uselist=False)

    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'status': self.status,
            'created_at': self.created_at.isoformat(),
            'updated_at': self.updated_at.isoformat()
        }

class InputDocument(Base):
    __tablename__ = 'input_documents'
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=generate_uuid)
    project_id = Column(UUID(as_uuid=True), ForeignKey('projects.id'), nullable=False)
    filename = Column(String(200))  # Original filename
    file_path = Column(String(500))  # Path relative to input directory
    file_size = Column(Integer)
    overview = Column(Text)
    status = Column(String(20), default=DocumentStatus.UPLOADED)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    project = relationship('Project', back_populates='input_documents')

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

class OutputDocument(Base):
    __tablename__ = 'output_documents'
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=generate_uuid)
    project_id = Column(UUID(as_uuid=True), ForeignKey('projects.id'), nullable=False)
    title = Column(String(200))
    file_path = Column(String(500))  # Path relative to output directory
    status = Column(String(20), default='generating')
    progress = Column(Float, default=0.0)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    project = relationship('Project', back_populates='output_document')

    def get_content(self) -> str:
        """Read document content"""
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
