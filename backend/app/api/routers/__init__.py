from fastapi import APIRouter
from .projects import router as projects_router
from .documents import router as documents_router
from .chat import router as chat_router

router = APIRouter()

router.include_router(projects_router, prefix="/projects", tags=["Projects"])
router.include_router(documents_router, prefix="/documents", tags=["Documents"])
router.include_router(chat_router, prefix="/chat", tags=["Chat"]) 