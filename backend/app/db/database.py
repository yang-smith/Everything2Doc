from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from ..core.config import settings
import logging

logger = logging.getLogger(__name__)

database_url_str = str(settings.DATABASE_URL)

engine = create_engine(
    database_url_str,
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