from flask import Blueprint, request, jsonify, current_app, Response
from app.services.project_service import ProjectService
from app.services.document_service import DocumentService
from werkzeug.exceptions import BadRequest, NotFound
from app.services.cards_service import CardsService
from app.utils.stream_handler import create_sse_response
from everything2doc import ai_chat_stream

bp = Blueprint('api', __name__)
project_service = ProjectService()
document_service = DocumentService()
cards_service = CardsService()

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

@bp.route('/all_projects', methods=['GET'])
def get_all_projects():
    """获取所有项目"""
    try:
        projects = project_service.get_all_projects()
        return jsonify([project.to_dict() for project in projects])
    except Exception as e:
        current_app.logger.error(f"Error getting projects: {str(e)}")
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
@bp.route('/projects/<project_id>/start_processing', methods=['POST'])
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

@bp.route('/projects/<project_id>/processing_status', methods=['GET'])
def get_processing_status(project_id):
    """获取文档处理状态"""
    try:
        result = document_service.get_processing_status(project_id)
        if not result:
            return jsonify({
                'status': 'not_started',
                'progress': 0,
            })
            
        return jsonify(result)
        
    except Exception as e:
        current_app.logger.error(f"Error getting status: {str(e)}")
        return jsonify({'error': 'Internal server error'}), 500

@bp.route('/projects/<project_id>/output_content', methods=['GET'])
def get_project_output_content(project_id):
    """获取项目文档内容"""
    try:
        content = document_service.get_output_document(project_id)
        return jsonify({
            'content': content
        })
    except NotFound:
        return jsonify({
            'error': 'No document found for this project'
        }), 404
    except Exception as e:
        current_app.logger.error(f"Error getting document content: {str(e)}")
        return jsonify({
            'error': 'Internal server error'
        }), 500

# Cards相关路由
@bp.route('/projects/<project_id>/cards', methods=['GET'])
def get_project_cards(project_id):
    """获取项目的所有cards"""
    try:
        cards, status = cards_service.get_project_cards(project_id)
        
        return jsonify({
            'cards': [card.to_dict() for card in cards],
            'total': len(cards),
            'status': status
        })
        
    except NotFound:
        return jsonify({'error': 'Project not found'}), 404
    except Exception as e:
        current_app.logger.error(f"Error getting cards: {str(e)}")
        return jsonify({'error': str(e)}), 500

@bp.route('/projects/<project_id>/segments/<segment_id>/process', methods=['POST'])
def process_segment(project_id, segment_id):
    """处理指定分段"""
    try:
        result = cards_service.process_segment(project_id, segment_id)
        return jsonify(result)
        
    except NotFound:
        return jsonify({'error': 'Segment not found'}), 404
    except Exception as e:
        current_app.logger.error(f"Error processing segment: {str(e)}")
        return jsonify({'error': str(e)}), 500

@bp.route('/projects/<project_id>/segments', methods=['GET'])
def get_project_segments(project_id):
    """获取项目的所有分段信息"""
    try:
        segments = cards_service.get_project_segments(project_id)
        return jsonify(segments)
        
    except NotFound:
        return jsonify({'error': 'Project not found'}), 404
    except Exception as e:
        current_app.logger.error(f"Error getting segments: {str(e)}")
        return jsonify({'error': str(e)}), 500

@bp.route('/segments/<segment_id>/status', methods=['GET'])
def get_segment_status(segment_id):
    """获取指定分段的状态"""
    try:
        status = cards_service.get_segment_status(segment_id)
        return jsonify(status)
    except NotFound:
        return jsonify({'error': 'Segment not found'}), 404
    except Exception as e:
        current_app.logger.error(f"Error getting segment status: {str(e)}")
        return jsonify({'error': str(e)}), 500

@bp.route('/segments/<segment_id>/cards')
def get_segment_cards(segment_id):
    """获取某个segment下的所有cards"""
    try:
        cards = cards_service.get_segment_cards(segment_id)
        return jsonify({
            'segment_id': segment_id,
            'cards': [card.to_dict() for card in cards]
        })
        
    except NotFound:
        return jsonify({'error': 'Segment not found'}), 404
    except Exception as e:
        current_app.logger.error(f"Error getting segment cards: {str(e)}")
        return jsonify({'error': str(e)}), 500

@bp.route('/projects/<project_id>/overview', methods=['GET'])
def get_project_overview(project_id):
    """获取文档简述"""
    try:
        overview = document_service.get_project_overview(project_id)
        return jsonify(overview)
        
    except NotFound:
        return jsonify({'error': 'Project not found'}), 404
    except Exception as e:
        current_app.logger.error(f"Error getting segments: {str(e)}")
        return jsonify({'error': str(e)}), 500

@bp.route('/projects/<project_id>/content', methods=['GET'])
def get_project_content(project_id):
    """获取文档内容"""
    try:
        content = document_service.get_project_content(project_id)
        return jsonify({
            'content': content
        })
        
    except NotFound:
        return jsonify({'error': 'Project not found'}), 404
    except Exception as e:
        current_app.logger.error(f"Error getting segments: {str(e)}")
        return jsonify({'error': str(e)}), 500

@bp.route('/chat/stream', methods=['GET', 'POST'])
def stream_chat():
    """流式聊天接口"""
    try:
        if request.method == 'GET':
            message = request.args.get('message')
        else:
            data = request.get_json()
            message = data.get('message')

        if not message:
            return jsonify({'error': 'Message is required'}), 400

        # 创建流式响应
        stream = ai_chat_stream(
            message=message,
            model='deepseek-chat'
        )
        return create_sse_response(stream, model='deepseek-chat')

    except Exception as e:
        current_app.logger.error(f"Error in stream chat: {str(e)}")
        return jsonify({'error': str(e)}), 500

# 错误处理
@bp.errorhandler(404)
def not_found_error(error):
    return jsonify({'error': 'Not found'}), 404

@bp.errorhandler(500)
def internal_error(error):
    current_app.logger.error(f"Server Error: {error}")
    return jsonify({'error': 'Internal server error'}), 500