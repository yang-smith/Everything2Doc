from flask import Blueprint, request, jsonify, current_app
from app.services.project_service import ProjectService
from app.services.document_service import DocumentService
from werkzeug.exceptions import BadRequest, NotFound

bp = Blueprint('api', __name__)
project_service = ProjectService()
document_service = DocumentService()

# 项目相关路由
@bp.route('/projects', methods=['POST'])
def create_project():
    """创建新项目"""   
    try:
        data = request.get_json() or {}
        print(data)
        name = data.get('name', 'New Project')
        
        project = project_service.create_project(name)
        return jsonify(project.to_dict()), 201
        
    except Exception as e:
        current_app.logger.error(f"Error creating project: {str(e)}")
        return jsonify({'error': str(e)}), 500

@bp.route('/projects/<project_id>', methods=['GET'])
def get_project(project_id):
    """获取项目详情"""
    try:
        project = project_service.get_project(project_id)
        return jsonify(project.to_dict())
    except NotFound:
        return jsonify({'error': 'Project not found'}), 404
    except Exception as e:
        current_app.logger.error(f"Error getting project: {str(e)}")
        return jsonify({'error': str(e)}), 500

# 文档相关路由
@bp.route('/documents', methods=['POST'])
def upload_document():
    """上传单个文档"""
    try:
        # 验证项目ID
        project_id = request.form.get('projectId')
        if not project_id:
            raise BadRequest('Project ID is required')
            
        # 检查文件
        if 'file' not in request.files:
            raise BadRequest('No file part')
        
        file = request.files['file']
        if not file.filename:
            raise BadRequest('No selected file')
        
        # 上传文件
        document = document_service.add_document_to_project(
            project_id=project_id,
            file=file
        )
        
        return jsonify(document.to_dict()), 201
        
    except ValueError as e:
        return jsonify({'error': str(e)}), 400
    except Exception as e:
        current_app.logger.error(f"Error uploading file: {str(e)}")
        return jsonify({'error': 'Internal server error'}), 500

@bp.route('/projects/<project_id>/outline', methods=['POST'])
def generate_outline(project_id):
    """生成文档大纲"""
    print("generate_outline")
    try:
        outline = document_service.generate_outline(project_id)
        return jsonify({'outline': outline}), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500 

@bp.route('/projects/<project_id>/outline', methods=['PUT'])
def update_outline(project_id):
    """更新文档大纲"""
    try:
        data = request.get_json()
        if not data or 'content' not in data:
            raise BadRequest('Content is required')
            
        outline = document_service.update_outline(
            project_id=project_id,
            content=data['content']
        )
        
        return jsonify(outline.to_dict()), 200
        
    except NotFound:
        return jsonify({'error': 'Project not found'}), 404
    except BadRequest as e:
        return jsonify({'error': str(e)}), 400
    except Exception as e:
        current_app.logger.error(f"Error updating outline: {str(e)}")
        return jsonify({'error': 'Internal server error'}), 500


# 开始处理
@bp.route('/projects/<project_id>/process', methods=['POST'])
def start_processing(project_id):
    """开始处理文档"""
    try:
        result = document_service.start_processing(project_id)
        return jsonify(result), 200
    except NotFound:
        return jsonify({'error': 'Project not found'}), 404
    except ValueError as e:
        return jsonify({'error': str(e)}), 400
    except Exception as e:
        current_app.logger.error(f"Error processing document: {str(e)}")
        return jsonify({'error': 'Internal server error'}), 500

@bp.route('/projects/<project_id>/status', methods=['GET'])
def get_processing_status(project_id):
    """获取处理状态"""
    try:
        project = Project.query.get_or_404(project_id)
        output_doc = project.output_documents[-1] if project.output_documents else None
        
        if not output_doc:
            return jsonify({
                'status': 'not_started'
            })
            
        return jsonify({
            'status': output_doc.status,
            'progress': output_doc.progress if hasattr(output_doc, 'progress') else None,
            'error': output_doc.error if output_doc.status == 'error' else None,
            'document_id': output_doc.id if output_doc.status == 'completed' else None
        })
        
    except Exception as e:
        current_app.logger.error(f"Error getting status: {str(e)}")
        return jsonify({'error': 'Internal server error'}), 500

# 错误处理
@bp.errorhandler(404)
def not_found_error(error):
    return jsonify({'error': 'Not found'}), 404

@bp.errorhandler(500)
def internal_error(error):
    current_app.logger.error(f"Server Error: {error}")
    return jsonify({'error': 'Internal server error'}), 500