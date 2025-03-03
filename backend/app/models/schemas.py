from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field
from datetime import datetime
from enum import Enum

# Project schemas
class ProjectStatus(str, Enum):
    DRAFT = 'draft'
    PROCESSING = 'processing'
    COMPLETED = 'completed'

class ProjectBase(BaseModel):
    name: str = "New Project"

class ProjectCreate(ProjectBase):
    pass

class ProjectResponse(ProjectBase):
    id: str
    status: str
    created_at: datetime
    updated_at: datetime
    model_config = {"from_attributes": True}

# Document schemas
class DocumentStatus(str, Enum):
    UPLOADED = 'uploaded'
    PROCESSED = 'processed'
    ERROR = 'error'

class DocumentBase(BaseModel):
    filename: str
    file_size: int
    overview: Optional[str] = None
    status: str = DocumentStatus.UPLOADED

class DocumentCreate(DocumentBase):
    project_id: str

class DocumentResponse(BaseModel):
    id: str
    project_id: str

    class Config:
        orm_mode = True



# Output document schemas
class OutputDocBase(BaseModel):
    title: Optional[str] = None
    status: str = 'generating'
    progress: float = 0.0

class OutputDocCreate(OutputDocBase):
    project_id: str

class OutputDocResponse(OutputDocBase):
    id: str
    project_id: str
    content: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        orm_mode = True

# Chat segment schemas
class SegmentStatus(str, Enum):
    PENDING = 'pending'
    PROCESSING = 'processing' 
    COMPLETED = 'completed'
    ERROR = 'error'

class ChatSegmentBase(BaseModel):
    segment_index: int
    content: Optional[str] = None
    start_time: Optional[datetime] = None
    end_time: Optional[datetime] = None
    status: str = SegmentStatus.PENDING

class ChatSegmentCreate(ChatSegmentBase):
    project_id: str
    document_id: str

class ChatSegmentResponse(ChatSegmentBase):
    id: str
    project_id: str
    document_id: str
    created_at: datetime

    class Config:
        orm_mode = True

# API response schemas
class SuccessResponse(BaseModel):
    message: str

class ErrorResponse(BaseModel):
    error: str

class ProcessingStatusResponse(BaseModel):
    status: str
    progress: float = 0.0

class StartProcessingResponse(BaseModel):
    task_id: str
    status: str

class ProjectOverviewResponse(BaseModel):
    description: str
    messageCount: int
    totalTime: str


class ProjectContentResponse(BaseModel):
    content: str


class ChatRequest(BaseModel):
    message: str
    model: Optional[str] = None

class MonthSummaryRequest(BaseModel):
    start_date: Optional[str] = None
    end_date: Optional[str] = None

class DocStreamRequest(BaseModel):
    doc_type: str
    model: Optional[str] = None 