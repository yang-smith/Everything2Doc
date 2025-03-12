from sqlmodel import SQLModel, create_engine, Session
from ..core.config import settings
import logging
import os
from ..models.user import User
from ..models.project import Project, InputDocument, OutputDocument

logger = logging.getLogger(__name__)

# 优先使用环境变量中的 DATABASE_URL
database_url = os.getenv("DATABASE_URL")
if not database_url:
    logger.error("未设置 DATABASE_URL 环境变量")
    raise ValueError("未设置 DATABASE_URL 环境变量")

# 修复 Fly.io Postgres URL 格式 (postgres:// -> postgresql://)
if database_url.startswith("postgres://"):
    database_url = database_url.replace("postgres://", "postgresql://", 1)
    logger.info("已修复数据库 URL 格式")

logger.info(f"数据库连接字符串: {database_url.split('@')[0].split('://')[0]}://*****@{database_url.split('@')[1] if '@' in database_url else '***'}")

if settings.ENVIRONMENT == "development":
    echo = True
else:
    echo = False

engine = create_engine(
    database_url,
    echo=echo,  
    pool_pre_ping=True
)

def get_db():
    with Session(engine) as session:
        yield session

def create_db_and_tables():
    tables = [
        User.__table__,
        Project.__table__,
        InputDocument.__table__,
        OutputDocument.__table__
    ]
    SQLModel.metadata.create_all(engine, tables=tables) 