from flask import Flask
from flask_sqlalchemy import SQLAlchemy
from flask_cors import CORS
from config import Config
import os
from concurrent.futures import ThreadPoolExecutor

db = SQLAlchemy()
# 创建全局线程池
thread_pool = ThreadPoolExecutor(max_workers=3)  # 可以根据需要调整worker数量

def create_app(config_class=Config):
    app = Flask(__name__)
    app.config.from_object(config_class)
    
    # 初始化扩展
    CORS(app)
    db.init_app(app)
    
    
    # 导入所有模型以确保正确的表创建顺序
    from app.models.model import Project, InputDocument, Outline, OutputDocument, ChatSegment, Card
    

    # 注册蓝图
    from app.api.routers import bp as api_bp
    app.register_blueprint(api_bp, url_prefix='/api')
    
    # 确保上传目录存在
    os.makedirs(app.config['PROJECT_FOLDER'], exist_ok=True)
    
    # 确保实例文件夹存在
    try:
        os.makedirs(app.instance_path)
    except OSError:
        pass
    
    with app.app_context():
        db.create_all()
    
    return app
