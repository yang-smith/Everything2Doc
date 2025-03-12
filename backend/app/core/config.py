import os
import secrets
from typing import Annotated, Any, List, Optional, Literal
from pathlib import Path

from pydantic import (
    PostgresDsn, 
    BeforeValidator,
    HttpUrl,
    computed_field,
    model_validator
)
from pydantic_core import MultiHostUrl
from pydantic_settings import BaseSettings, SettingsConfigDict


def parse_cors(v: Any) -> list[str] | str:
    if isinstance(v, str) and not v.startswith("["):
        return [i.strip() for i in v.split(",")]
    elif isinstance(v, list | str):
        return v
    raise ValueError(v)


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_ignore_empty=True,
        extra="ignore",
    )
    
    # API 基础配置
    PROJECT_NAME: str = "Everything2Doc API"
    API_V1_STR: str = "/api"
    SECRET_KEY: str = os.getenv("SECRET_KEY")
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 8
    ENVIRONMENT: Literal["development", "production", "testing"] = "development"
    
    # 前端主机设置
    if ENVIRONMENT == "production":
        FRONTEND_HOST: str = "https://everything2doc.pages.dev"
    else:
        FRONTEND_HOST: str = "http://localhost:3000"  # 修改为您的前端地址
    
    # CORS 设置
    BACKEND_CORS_ORIGINS: Annotated[
        List[HttpUrl] | str, BeforeValidator(parse_cors)
    ] = [
        "http://localhost:3000",
        "https://everything2doc.pages.dev"
    ]
    
    @computed_field
    @property
    def all_cors_origins(self) -> List[str]:
        return [str(origin).rstrip("/") for origin in self.BACKEND_CORS_ORIGINS] + [
            self.FRONTEND_HOST
        ]

    
    # 数据库配置
    DATABASE_URL: PostgresDsn = os.getenv("DATABASE_URL")
    
    # AI 服务配置
    OPENAI_API_KEY: Optional[str] = None
    OPENAI_API_BASE: Optional[str] = None
    DEEPSEEK_API_KEY: Optional[str] = None
    DEEPSEEK_API_BASE: Optional[str] = None
    OPENROUTER_API_KEY: Optional[str] = None
    OPENROUTER_API_BASE: Optional[str] = None
    
    # 文件存储
    PROJECT_FOLDER: str = os.getenv("PROJECT_FOLDER", os.path.join(os.getcwd(), "projects"))
    
    MAX_WORKERS: int = 10
    

    
    @model_validator(mode="after")
    def create_project_folder(self) -> "Settings":
        """确保项目文件夹存在"""
        os.makedirs(self.PROJECT_FOLDER, exist_ok=True)
        return self


settings = Settings() 