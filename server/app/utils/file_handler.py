import os
from werkzeug.utils import secure_filename
from flask import current_app
from typing import Tuple
import json

class FileHandler:
    ALLOWED_EXTENSIONS = {'txt'}
    
    @staticmethod
    def allowed_file(filename: str) -> bool:
        return '.' in filename and \
               filename.rsplit('.', 1)[1].lower() in FileHandler.ALLOWED_EXTENSIONS
    
    @staticmethod
    def get_project_dir(project_id: str) -> str:
        """获取项目根目录"""
        return os.path.join(current_app.config['PROJECT_FOLDER'], project_id)
    
    @staticmethod
    def get_input_dir(project_id: str) -> str:
        """获取输入文件目录"""
        return os.path.join(FileHandler.get_project_dir(project_id), 'input')
    
    @staticmethod
    def get_output_dir(project_id: str) -> str:
        """获取输出文件目录"""
        return os.path.join(FileHandler.get_project_dir(project_id), 'output')
    
    @staticmethod
    def save_input_file(file, project_id: str) -> Tuple[str, int]:
        """保存输入文件"""
        # 创建输入目录
        input_dir = FileHandler.get_input_dir(project_id)
        os.makedirs(input_dir, exist_ok=True)
        
        # 保存文件
        filename = secure_filename(file.filename)
        file_path = os.path.join(input_dir, filename)
        
        file.save(file_path)
        file_size = os.path.getsize(file_path)
        
        return file_path, file_size
    
    @staticmethod
    def save_output_file(content: str, filename: str, project_id: str) -> str:
        """保存输出文件"""
        # 创建输出目录
        output_dir = FileHandler.get_output_dir(project_id)
        os.makedirs(output_dir, exist_ok=True)
        
        # 保存文件
        file_path = os.path.join(output_dir, filename)
        with open(file_path, 'w', encoding='utf-8') as f:
            f.write(content)
            
        return file_path
    
    @staticmethod
    def save_outline(outline_content: str, project_id: str) -> str:
        """保存大纲文件"""
        output_dir = FileHandler.get_output_dir(project_id)
        os.makedirs(output_dir, exist_ok=True)
        
        file_path = os.path.join(output_dir, 'outline.json')
        with open(file_path, 'w', encoding='utf-8') as f:
            f.write(outline_content)
            
        return file_path
    
    @staticmethod
    def delete_project_files(project_id: str) -> None:
        """删除项目的所有文件"""
        project_dir = FileHandler.get_project_dir(project_id)
        if os.path.exists(project_dir):
            import shutil
            shutil.rmtree(project_dir)