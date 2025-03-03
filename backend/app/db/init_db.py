import logging
import psycopg2
from ..core.config import settings

logger = logging.getLogger(__name__)

def init_db():
    """
    初始化数据库：检查数据库是否存在，如果不存在则创建
    """
    # 连接到默认的postgres数据库
    try:
        logger.info(f"检查数据库 '{settings.POSTGRES_DB}' 是否存在...")
        conn = psycopg2.connect(
            host=settings.POSTGRES_SERVER,
            port=settings.POSTGRES_PORT,
            user=settings.POSTGRES_USER,
            password=settings.POSTGRES_PASSWORD,
            dbname="postgres"  # 连接到默认数据库
        )
        conn.autocommit = True  # 启用自动提交，这对创建数据库是必需的
        
        with conn.cursor() as cursor:
            # 检查数据库是否存在
            cursor.execute(f"SELECT 1 FROM pg_database WHERE datname = '{settings.POSTGRES_DB}'")
            exists = cursor.fetchone()
            
            if not exists:
                logger.info(f"正在创建数据库 '{settings.POSTGRES_DB}'...")
                # 创建数据库
                cursor.execute(f"CREATE DATABASE {settings.POSTGRES_DB} ENCODING 'UTF8'")
                logger.info(f"数据库 '{settings.POSTGRES_DB}' 创建成功！")
            else:
                logger.info(f"数据库 '{settings.POSTGRES_DB}' 已存在。")
                
    except Exception as e:
        logger.error(f"数据库初始化错误: {str(e)}")
        raise
    finally:
        if 'conn' in locals():
            conn.close() 