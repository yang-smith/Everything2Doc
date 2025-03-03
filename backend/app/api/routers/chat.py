from typing import Optional
import logging
from fastapi import APIRouter, Depends, HTTPException, status, Request
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from pydantic import BaseModel

from ...db.database import get_db
from ...models.schemas import ChatRequest, MonthSummaryRequest, DocStreamRequest
from ...services.document_service import DocumentService
from ...utils.stream_handler import ai_stream_endpoint
from ...libs.utils.ai_chat_client import (
    ai_chat_stream, 
    ai_chat_stream_async
)
from ...libs.core.worker import (
    generate_recent_month_summary, 
    generate_doc_async
)

router = APIRouter()
document_service = DocumentService()
logger = logging.getLogger(__name__)

@router.post("/stream")
@router.get("/stream")
async def stream_chat(
    request: Request,
    chat_request: Optional[ChatRequest] = None,
    message: Optional[str] = None,
    model: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """Streaming chat API"""
    try:
        # Handle both GET and POST requests
        if request.method == "GET":
            if not message:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Message is required"
                )
        else:
            if not chat_request:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Request body is required"
                )
            message = chat_request.message
            model = chat_request.model

        if not model:
            model = 'deepseek/deepseek-r1-distill-llama-70b'
        
        return await ai_stream_endpoint(
            request=request,
            stream_generator=ai_chat_stream_async,
            stream_params={
                "message": message,
                "model": model
            },
            model=model
        )

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error in stream chat: {str(e)}"
        )

@router.post("/{project_id}/month_summary_stream")
@router.get("/{project_id}/month_summary_stream")
async def stream_month_summary(
    project_id: str, 
    request: Request,
    summary_request: Optional[MonthSummaryRequest] = None,
    db: Session = Depends(get_db)
):
    """Stream monthly summary document generation"""
    try:
        # Get project chat content
        chat_content = document_service.get_project_chat_content(db, project_id)
        
        return await ai_stream_endpoint(
            request=request,
            stream_generator=generate_recent_month_summary,
            stream_params={
                "chat_content": chat_content,
                "model": "deepseek/deepseek-r1-distill-llama-70b"
            },
            model="deepseek/deepseek-r1-distill-llama-70b"
        )

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
            detail=f"Stream generation failed: {str(e)}"
        )

@router.post("/{project_id}/doc_stream")
@router.get("/{project_id}/doc_stream")
async def stream_doc(
    project_id: str,
    request: Request,
    doc_request: Optional[DocStreamRequest] = None,
    doc_type: Optional[str] = None,
    model: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """流式文档生成"""
    try:
        # 处理请求参数
        if request.method == "GET":
            if not doc_type:
                raise HTTPException(status_code=400, detail="doc_type is required")
        else:
            if not doc_request:
                raise HTTPException(status_code=400, detail="Request body is required")
            doc_type = doc_request.doc_type
            model = doc_request.model
        
        # 使用默认模型
        if not model or model == 'undefined':
            model = 'deepseek/deepseek-r1-distill-llama-70b'
        
        # 获取项目聊天内容
        chat_content = document_service.get_project_chat_content(db, project_id)
        if not chat_content:
            raise ValueError("No chat records found")
        
        logger.info(f"处理项目 {project_id} 的文档生成请求，类型: {doc_type}, 模型: {model}")
        
        # 使用统一流式端点处理函数
        return await ai_stream_endpoint(
            request=request,
            stream_generator=generate_doc_async,  # 异步生成器函数
            stream_params={
                "chat_records": chat_content,
                "doc_type": doc_type,
                "model": model
            },
            model=model
        )
        
    except ValueError as e:
        logger.warning(f"处理流式文档请求参数错误: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.exception(f"处理流式文档请求时出错: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e)) 