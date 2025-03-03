import os
from typing import Tuple
import json
from fastapi import UploadFile
import shutil
from pathlib import Path
from ..core.config import settings

class FileHandler:
    ALLOWED_EXTENSIONS = {'txt'}
    
    @staticmethod
    def allowed_file(filename: str) -> bool:
        return '.' in filename and \
               filename.rsplit('.', 1)[1].lower() in FileHandler.ALLOWED_EXTENSIONS
    
    @staticmethod
    def get_project_dir(project_id: str) -> str:
        """Get project root directory"""
        return os.path.join(settings.PROJECT_FOLDER, project_id)
    
    @staticmethod
    def get_input_dir(project_id: str) -> str:
        """Get input files directory"""
        return os.path.join(FileHandler.get_project_dir(project_id), 'input')
    
    @staticmethod
    def get_output_dir(project_id: str) -> str:
        """Get output files directory"""
        return os.path.join(FileHandler.get_project_dir(project_id), 'output')
    
    @staticmethod
    async def save_input_file(file: UploadFile, project_id: str) -> Tuple[str, int]:
        """Save input file"""
        # Create input directory
        input_dir = FileHandler.get_input_dir(project_id)
        os.makedirs(input_dir, exist_ok=True)
        
        # Save file
        filename = file.filename
        if not filename:
            filename = "unnamed_file.txt"
        
        file_path = os.path.join(input_dir, filename)
        
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
        
        file_size = os.path.getsize(file_path)
        
        return file_path, file_size
    
    @staticmethod
    def save_output_file(content: str, filename: str, project_id: str) -> str:
        """Save output file"""
        # Create output directory
        output_dir = FileHandler.get_output_dir(project_id)
        os.makedirs(output_dir, exist_ok=True)
        
        # Save file
        file_path = os.path.join(output_dir, filename)
        with open(file_path, 'w', encoding='utf-8') as f:
            f.write(content)
            
        return file_path
    
    
    @staticmethod
    def delete_project_files(project_id: str) -> None:
        """Delete all project files"""
        project_dir = FileHandler.get_project_dir(project_id)
        if os.path.exists(project_dir):
            import shutil
            shutil.rmtree(project_dir) 