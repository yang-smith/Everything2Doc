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
    SECRET_KEY: str = secrets.token_urlsafe(32)
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
    
    # 数据库设置
    POSTGRES_SERVER: str = os.getenv("POSTGRES_SERVER", "localhost")
    POSTGRES_USER: str = os.getenv("POSTGRES_USER", "postgres")
    POSTGRES_PASSWORD: str = os.getenv("POSTGRES_PASSWORD", "postgres")
    POSTGRES_DB: str = os.getenv("POSTGRES_DB", "everything2doc")
    POSTGRES_PORT: int = int(os.getenv("POSTGRES_PORT", "5432"))
    
    @computed_field  # type: ignore[prop-decorator]
    @property
    def SQLALCHEMY_DATABASE_URI(self) -> PostgresDsn:
        return MultiHostUrl.build(
            scheme="postgresql+psycopg",
            username=self.POSTGRES_USER,
            password=self.POSTGRES_PASSWORD,
            host=self.POSTGRES_SERVER,
            port=self.POSTGRES_PORT,
            path=self.POSTGRES_DB,
        )
    
    # AI 服务配置
    OPENAI_API_KEY: Optional[str] = None
    OPENAI_API_BASE: Optional[str] = None
    DEEPSEEK_API_KEY: Optional[str] = None
    DEEPSEEK_API_BASE: Optional[str] = None
    OPENROUTER_API_KEY: Optional[str] = None
    OPENROUTER_API_BASE: Optional[str] = None
    
    # 文件存储
    PROJECT_FOLDER: str = os.getenv("PROJECT_FOLDER", os.path.join(os.getcwd(), "projects"))
    
    # 线程池设置
    MAX_WORKERS: int = 10
    
    @computed_field
    @property
    def DATABASE_URL(self) -> PostgresDsn:
        """构建PostgreSQL连接URL（使用Pydantic的MultiHostUrl）"""
        return MultiHostUrl.build(
            scheme="postgresql+psycopg",
            username=self.POSTGRES_USER,
            password=self.POSTGRES_PASSWORD,
            host=self.POSTGRES_SERVER,
            port=self.POSTGRES_PORT,
            path=self.POSTGRES_DB,
        )
    
    @model_validator(mode="after")
    def create_project_folder(self) -> "Settings":
        """确保项目文件夹存在"""
        os.makedirs(self.PROJECT_FOLDER, exist_ok=True)
        return self


settings = Settings() 