from celery import chain
from app.extensions import celery, db
from app.models import ChatSegment, Card
from app.utils.chat_utils import split_chat_records, read_file
from everything2doc import process_segments_to_cards_parallel

@celery.task
def create_segments_task(project_id: str, document_id: str, file_path: str):
    """创建聊天分段并处理第一段"""
    try:
        # 读取文件内容
        chat_text = read_file(file_path)
        
        # 分段处理
        segments = split_chat_records(
            chat_text,
            max_messages=1100,
            min_messages=800,
            time_gap_minutes=180
        )
        
        if not segments:
            raise ValueError("No chat segments found")
            
        # 保存所有分段
        segment_ids = []
        for idx, segment in enumerate(segments):
            chat_segment = ChatSegment(
                project_id=project_id,
                document_id=document_id,
                segment_index=idx,
                content=segment['content'],
                start_time=segment.get('start_time'),
                end_time=segment.get('end_time')
            )
            db.session.add(chat_segment)
            db.session.flush()  # 获取ID
            segment_ids.append(chat_segment.id)
            
        db.session.commit()
        
        # 立即处理第一段
        if segment_ids:
            process_segment_task.delay(segment_ids[0])
            
        return segment_ids
        
    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f"Error creating segments: {str(e)}")
        raise

@celery.task
def process_segment_task(segment_id: str):
    """处理单个分段生成cards"""
    try:
        segment = ChatSegment.query.get(segment_id)
        if not segment:
            raise ValueError(f"Segment {segment_id} not found")
            
        # 生成cards
        cards = process_segments_to_cards_parallel(
            [segment.content],
            model="deepseek-chat",
            max_workers=1
        )
        print(cards)
        
        
        # 保存cards
        for card_content in cards:
            card = Card(
                project_id=segment.project_id,
                document_id=segment.document_id,
                segment_id=segment_id,
                content=card_content,
                timestamp=extract_timestamp(card_content),
                tags=extract_tags(card_content)
            )
            db.session.add(card)
            
        # 更新分段状态
        segment.is_processed = True
        db.session.commit()
        
        return True
        
    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f"Error processing segment {segment_id}: {str(e)}")
        raise 