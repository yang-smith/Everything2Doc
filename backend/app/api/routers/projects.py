from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
import logging

from app.core.db import get_db
from app.models.schemas import ProjectCreate, ProjectResponse
from app.services.project_service import ProjectService
from app.api.deps import CurrentUser, get_current_user
from app.models.user import User

router = APIRouter()

logger = logging.getLogger(__name__)
logger.setLevel(logging.INFO)

@router.post("", response_model=ProjectResponse, status_code=status.HTTP_201_CREATED)
def create_project(project: ProjectCreate, db: Session = Depends(get_db),current_user: User = Depends(get_current_user)):
    """Create a new project"""
    try:
        project_obj = ProjectService.create_project(db, project.name, current_user.id)
        return project_obj
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error creating project: {str(e)}"
        )

@router.get("", response_model=List[ProjectResponse])  
def get_all_projects(db: Session = Depends(get_db), 
                        current_user: User = Depends(get_current_user)):
    try:
        projects = ProjectService.get_all_projects(db, user_id=current_user.id)
        return projects
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error getting projects: {str(e)}"
        )

@router.get("/{project_id}", response_model=ProjectResponse)
def get_project(project_id: str, db: Session = Depends(get_db)):
    """Get project details"""
    project = ProjectService.get_project(db, project_id)
    if not project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Project not found"
        )
    return project 