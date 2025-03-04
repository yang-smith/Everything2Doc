from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from ..core.config import settings
import logging
import os

logger = logging.getLogger(__name__)

# 优先使用环境变量中的 DATABASE_URL
database_url = os.getenv("DATABASE_URL")
if not database_url:
    database_url = str(settings.DATABASE_URL)
    logger.info("使用配置文件中的数据库连接")
else:
    logger.info("使用环境变量中的数据库连接")

# 修复 Fly.io Postgres URL 格式 (postgres:// -> postgresql://)
if database_url.startswith("postgres://"):
    database_url = database_url.replace("postgres://", "postgresql://", 1)
    logger.info("已修复数据库 URL 格式")

logger.info(f"数据库连接字符串: {database_url.split('@')[0].split('://')[0]}://*****@{database_url.split('@')[1] if '@' in database_url else '***'}")

engine = create_engine(
    database_url,
    pool_pre_ping=True,  # 在连接被使用前先测试连接是否有效
    pool_size=10,        # 连接池大小
    max_overflow=20,     # 超过pool_size的最大连接数
    pool_recycle=3600    # 每小时回收连接
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close() 