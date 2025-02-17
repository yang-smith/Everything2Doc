import os
from dotenv import load_dotenv

load_dotenv()

class Config:

    MAX_CONTENT_LENGTH = 50 * 1024 * 1024  # 50MB
  
   
    env =  os.getenv('FLASK_ENV', 'production')
    
    if env == 'development':
        # 本地测试配置
        print("本地测试配置")
        BASE_DIR = os.path.dirname(os.path.abspath(__file__))
        SQLALCHEMY_DATABASE_URI = f"sqlite:///{os.path.join(BASE_DIR, 'app.db')}"
        SQLALCHEMY_TRACK_MODIFICATIONS = False
        PROJECT_FOLDER = os.path.join(BASE_DIR, 'projects')
        
    else:
    # fly.io 配置
        SQLALCHEMY_DATABASE_URI = os.getenv('DATABASE_URL', 'sqlite:////data/app.db')
        SQLALCHEMY_TRACK_MODIFICATIONS = False
        PROJECT_FOLDER = os.getenv('PROJECT_FOLDER', '/data/projects')
        
    # 安全配置
    SECRET_KEY = os.getenv('SECRET_KEY', 'dev-key')
