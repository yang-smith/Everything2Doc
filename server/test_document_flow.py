from app import create_app, db
from app.models.model import InputDocument, ChatSegment, Card
from everything2doc import read_file, split_chat_records
from everything2doc.core.worker import process_segments_to_cards_parallel
import os
from datetime import datetime

def test_document_flow():
    app = create_app()
    
    with app.app_context():
        try:
            project_id = 'd3413fe2-f7cf-4dc6-850e-b6c6b9336e31'

            
            print("\n=== 1. 检查文档 ===")
            docs = InputDocument.query.filter_by(project_id=project_id).all()
            if not docs:
                print("没有找到文档记录")
                return
                
            doc = docs[0]
            print(f"文档ID: {doc.id}")
            print(f"文件名: {doc.filename}")
            print(f"文件路径: {doc.file_path}")
            print(f"状态: {doc.status}")
            
            print("\n=== 2. 检查文件 ===")
            if not os.path.exists(doc.file_path):
                print("文件不存在")
                return
                
            print(f"文件大小: {os.path.getsize(doc.file_path)} bytes")
            
            print("\n=== 3. 读取文件内容 ===")
            chat_text = read_file(doc.file_path)
            print(f"文件内容长度: {len(chat_text)}")
            print("内容预览:")
            print(chat_text[:200])
            
            print("\n=== 4. 测试分段 ===")
            segments = split_chat_records(
                chat_text,
                max_messages=1100,
                min_messages=800,
                time_gap_minutes=180
            )
            print(f"分段数量: {len(segments)}")
            if segments:
                print("\n第一个分段预览:")
                print(segments[0][:200])
                
                print("\n=== 5. 测试分段保存 ===")
                # 清理旧的分段
                ChatSegment.query.filter_by(project_id=project_id).delete()
                db.session.commit()
                
                # 保存新的分段
                for idx, segment_content in enumerate(segments):
                    # 从第一行提取时间
                    first_line = segment_content.split('\n')[0]
                    last_line = segment_content.split('\n')[-1]
                    
                    try:
                        start_time = datetime.strptime(first_line[:19], '%Y-%m-%d %H:%M:%S')
                        end_time = datetime.strptime(last_line[:19], '%Y-%m-%d %H:%M:%S')
                    except Exception as e:
                        print(f"解析时间错误: {str(e)}")
                        start_time = None
                        end_time = None
                    
                    chat_segment = ChatSegment(
                        project_id=project_id,
                        document_id=doc.id,
                        segment_index=idx,
                        content=segment_content,
                        start_time=start_time,
                        end_time=end_time
                    )
                    db.session.add(chat_segment)
                    print(f"添加分段 {idx}, 内容长度: {len(segment_content)}")
                
                db.session.commit()
                print("分段保存完成")
                
                print("\n=== 6. 验证保存的分段 ===")
                saved_segments = ChatSegment.query.filter_by(project_id=project_id).all()
                print(f"保存的分段数量: {len(saved_segments)}")
                for seg in saved_segments:
                    print(f"\nSegment ID: {seg.id}")
                    print(f"Index: {seg.segment_index}")
                    print(f"Content length: {len(seg.content) if seg.content else 0}")
                    if seg.content:
                        print("Content preview:")
                        print(seg.content[:10])
            else:
                print("没有生成分段")
            
            print("\n=== 7. 测试生成Cards ===")
            # 清理旧的cards
            Card.query.filter_by(project_id=project_id).delete()
            db.session.commit()
            
            # 为每个分段生成cards
            for segment in saved_segments:
                print(f"\n处理分段 {segment.id}")
                try:
                    # 使用process_segments_to_cards_parallel处理单个分段
                    cards = process_segments_to_cards_parallel(
                        [segment.content],
                        model="deepseek-chat",
                        max_workers=1
                    )
                    print(f"生成了 {len(cards)} 个cards")
                    
                    # 保存cards
                    for card in cards:
                        db_card = Card(
                            project_id=project_id,
                            document_id=segment.document_id,
                            segment_id=segment.id,
                            summary=card.summary,
                            details=card.details,
                            tags=card.tags,
                            timestamp=card.time
                        )
                        db.session.add(db_card)
                        print(f"\nCard预览:")
                        print(f"Summary: {card.summary[:100]}")
                        print(f"Tags: {', '.join(card.tags)}")
                    
                    db.session.commit()
                    print(f"分段 {segment.id} 的cards保存完成")
                    
                except Exception as e:
                    print(f"处理分段 {segment.id} 时出错: {str(e)}")
                    db.session.rollback()
            
            print("\n=== 8. 验证保存的Cards ===")
            saved_cards = Card.query.filter_by(project_id=project_id).all()
            print(f"\n总共保存了 {len(saved_cards)} 个cards")
            for card in saved_cards:
                print(f"\nCard ID: {card.id}")
                print(f"Segment ID: {card.segment_id}")
                print(f"Summary: {card.summary[:100]}")
                print(f"Tags: {card.tags}")
                print("-" * 50)
                
        except Exception as e:
            print(f"错误: {str(e)}")
            db.session.rollback()

if __name__ == "__main__":
    test_document_flow() 