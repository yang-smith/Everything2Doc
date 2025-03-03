from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from ...db.database import get_db
from ...models.schemas import ProjectCreate, ProjectResponse
from ...services.project_service import ProjectService

router = APIRouter()

@router.post("", response_model=ProjectResponse, status_code=status.HTTP_201_CREATED)
def create_project(project: ProjectCreate, db: Session = Depends(get_db)):
    """Create a new project"""
    try:
        project_obj = ProjectService.create_project(db, project.name)
        return project_obj
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error creating project: {str(e)}"
        )

@router.get("", response_model=List[ProjectResponse])
def get_all_projects(db: Session = Depends(get_db)):
    """Get all projects"""
    try:
        return ProjectService.get_all_projects(db)
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