import os
import sys
from pathlib import Path

# 将项目根目录添加到Python路径
project_root = Path(__file__).parent.parent
sys.path.append(str(project_root))

from sqlmodel import SQLModel, Session, text
from app.core.db import engine
from app.core.config import settings
import logging

# 配置日志
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
)
logger = logging.getLogger(__name__)

def drop_all_tables():
    """完全删除数据库中的所有表结构"""
    try:
        # 创建数据库会话
        with Session(engine) as session:
            # 关闭外键约束检查（PostgreSQL语法）
            session.exec(text("SET session_replication_role = 'replica';"))
            
            # 获取所有表名
            result = session.exec(text(
                "SELECT tablename FROM pg_tables WHERE schemaname = 'public';"
            ))
            tables = result.all()
            
            logger.info(f"找到 {len(tables)} 个表")
            
            # 删除每个表
            for table in tables:
                table_name = table[0]
                if table_name != 'alembic_version':  # 可以选择保留迁移表
                    logger.info(f"删除表: {table_name}")
                    session.exec(text(f'DROP TABLE IF EXISTS "{table_name}" CASCADE;'))
            
            # 恢复外键约束检查
            session.exec(text("SET session_replication_role = 'origin';"))
            
            # 提交事务
            session.commit()
            
            logger.info("所有表结构已完全删除")
    except Exception as e:
        logger.error(f"删除表时出错: {str(e)}")
        raise

if __name__ == "__main__":
    print("警告: 此操作将删除数据库中的所有表结构和数据!")
    print("所有表将被完全删除，包括所有数据和表结构!")
    confirmation = input("请输入 'y'  确认继续: ")
    
    if confirmation == 'y':
        logger.info(f"连接到数据库")
        drop_all_tables()
        logger.info("数据库表结构已完全删除")
    else:
        logger.info("操作已取消") 