from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field
from datetime import datetime
from enum import Enum
from sqlmodel import SQLModel

# Project schemas
class ProjectStatus(str, Enum):
    DRAFT = 'draft'
    PROCESSING = 'processing'
    COMPLETED = 'completed'

class ProjectBase(SQLModel):
    name: str

class ProjectCreate(ProjectBase):
    pass

class ProjectUpdate(SQLModel):
    name: Optional[str] = None
    status: Optional[str] = None

class ProjectResponse(ProjectBase):
    id: str
    status: str
    created_at: datetime
    updated_at: datetime
    user_id: Optional[str] = None
    model_config = {"from_attributes": True}

class ProjectOverviewResponse(SQLModel):
    description: str
    messageCount: int
    totalTime: str
    model_config = {"from_attributes": True}

class ProjectContentResponse(SQLModel):
    content: str
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
class OutputDocumentBase(SQLModel):
    title: str

class OutputDocumentCreate(OutputDocumentBase):
    project_id: str

class OutputDocumentUpdate(SQLModel):
    title: Optional[str] = None
    status: Optional[str] = None
    progress: Optional[float] = None

class OutputDocumentResponse(OutputDocumentBase):
    id: str
    project_id: str
    status: str
    progress: float
    created_at: datetime
    updated_at: datetime
    content: Optional[str] = None

# API response schemas
class SuccessResponse(BaseModel):
    message: str

class ErrorResponse(BaseModel):
    error: str

class MonthSummaryRequest(BaseModel):
    month: str
    year: str

class ChatRequest(BaseModel):
    message: str
    model: Optional[str] = None

class DocStreamRequest(BaseModel):
    doc_type: str
    model: Optional[str] = None 

class Document2HTMLRequest(BaseModel):
    document: str
    model: Optional[str] = None