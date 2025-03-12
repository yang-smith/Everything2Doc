import logging
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from datetime import datetime
import uvicorn
import os
from sqlmodel import SQLModel

from app.core.config import settings
from app.api.routers import router as api_router
from app.core.db import engine, create_db_and_tables

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    handlers=[
        logging.StreamHandler()
    ]
)

logger = logging.getLogger(__name__)

# Create database tables
create_db_and_tables()

# Create FastAPI app
app = FastAPI(
    title=settings.PROJECT_NAME,
    openapi_url=f"{settings.API_V1_STR}/openapi.json"
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.all_cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Add startup event processor
@app.on_event("startup")
async def startup_db_client():
    try:
        create_db_and_tables()
        logger.info("数据库初始化完成并创建了表结构")
    except Exception as e:
        logger.error(f"数据库初始化失败: {str(e)}")

# Include API routers
app.include_router(api_router, prefix=settings.API_V1_STR)

# Health check endpoint
@app.get("/health")
async def health_check():
    return {
        'status': 'healthy',
        'timestamp': datetime.utcnow().isoformat()
    }

# Exception handler
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    return JSONResponse(
        status_code=500,
        content={"error": f"An unexpected error occurred: {str(exc)}"}
    )

# Run the application with uvicorn when called directly
if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True) 