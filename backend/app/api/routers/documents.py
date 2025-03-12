from typing import List
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, Form, BackgroundTasks
from sqlalchemy.orm import Session

from app.core.db import get_db
from app.models.schemas import (
    DocumentResponse,
    ProjectOverviewResponse,
    ProjectContentResponse,
)
from app.services.document_service import DocumentService

router = APIRouter()
document_service = DocumentService()

@router.post("", response_model=DocumentResponse, status_code=status.HTTP_201_CREATED)
async def upload_document(
    background_tasks: BackgroundTasks,
    file: UploadFile,
    project_id: str = Form(...),
    db: Session = Depends(get_db)
):
    """Upload a single document"""
    try:
        if not file.filename:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST, 
                detail="No selected file"
            )
            
        document = await document_service.add_document_to_project(
            db=db,
            background_tasks=background_tasks,
            project_id=project_id,
            file=file
        )
        
        return document
        
    except HTTPException:
        raise
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error uploading file: {str(e)}"
        )



@router.get("/{project_id}/overview", response_model=ProjectOverviewResponse)
def get_project_overview(project_id: str, db: Session = Depends(get_db)):
    """Get document overview"""
    try:
        overview = document_service.get_project_overview(db, project_id)
        return overview
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error getting overview: {str(e)}"
        )

@router.get("/{project_id}/recommendation")
def get_project_recommendation(project_id: str, db: Session = Depends(get_db)):
    """Get recommendations"""
    try:
        recommendation = document_service.gen_recommendation(db, project_id)
        return recommendation
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error getting recommendations: {str(e)}"
        )

@router.get("/{project_id}/content", response_model=ProjectContentResponse)
def get_project_content(project_id: str, db: Session = Depends(get_db)):
    """Get document content"""
    try:
        content = document_service.get_project_content(db, project_id)
        return {'content': content}
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error getting content: {str(e)}"
        ) 