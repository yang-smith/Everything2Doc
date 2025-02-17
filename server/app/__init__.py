from flask import Flask, jsonify
from flask_sqlalchemy import SQLAlchemy
from flask_cors import CORS
from config import Config
import os
from concurrent.futures import ThreadPoolExecutor
from datetime import datetime

db = SQLAlchemy()
# 创建全局线程池
thread_pool = ThreadPoolExecutor(max_workers=10)  # 可以根据需要调整worker数量

def create_app(config_class=Config):
    app = Flask(__name__)
    app.config.from_object(config_class)
    
    # 初始化扩展
    # 配置CORS
    CORS(app, resources={
        r"/api/*": {
            "origins": [
                "http://localhost:3000",
                "https://everything2doc.pages.dev"],  
            "supports_credentials": True,           
            "allow_headers": ["Content-Type"],     
            "methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS"]  
        }
    })
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
    
    @app.route('/health')
    def health_check():
        return jsonify({
            'status': 'healthy',
            'timestamp': datetime.utcnow().isoformat()
        }), 200
    
    return app
