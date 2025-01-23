import os
from everything2doc import (
    gen_structure,
    split_chat_records,
    process_segments_parallel,
    process_chapters_to_document,
    merge_chapter_results,
    read_file,
    process_segments_to_cards_parallel,
    parse_messages,
    ai_chat,
    generate_overview
)

from datetime import datetime, timedelta
from typing import List, Dict
from itertools import groupby
from dateutil.parser import parse
from concurrent.futures import ThreadPoolExecutor
from tqdm import tqdm
import concurrent.futures

def split_messages_by_time(messages: List[Dict], 
                         time_unit: str = 'day',
                         max_gap_minutes: int = 600) -> List[List[Dict]]:
    """
    按时间单位分割消息列表
    
    Args:
        messages: 消息列表
        time_unit: 时间单位 ('day', 'week', 'month')
        max_gap_minutes: 最大时间间隔（分钟），超过此间隔将强制分割
        
    Returns:
        List[List[Dict]]: 分割后的消息组列表
    """
    if not messages:
        return []
        
    # 定义时间单位的处理函数
    def get_period_key(timestamp: datetime) -> str:
        if time_unit == 'day':
            return timestamp.strftime('%Y-%m-%d')
        elif time_unit == 'week':
            return f"{timestamp.year}-W{timestamp.isocalendar()[1]}"
        elif time_unit == 'month':
            return timestamp.strftime('%Y-%m')
        else:
            raise ValueError(f"Unsupported time unit: {time_unit}")
    
    # 按时间排序并分组
    sorted_messages = sorted(messages, 
                           key=lambda x: parse(x['timestamp']))
    
    # 初始化结果和当前组
    result = []
    current_group = []
    last_timestamp = None
    
    for msg in sorted_messages:
        current_timestamp = parse(msg['timestamp'])
        
        # 检查是否需要开始新组
        start_new_group = False
        
        if last_timestamp:
            # 检查时间间隔
            time_diff = (current_timestamp - last_timestamp).total_seconds() / 60
            
            # 如果超过最大间隔或跨越时间单位，开始新组
            if (time_diff > max_gap_minutes or 
                get_period_key(current_timestamp) != get_period_key(last_timestamp)):
                start_new_group = True
        
        if start_new_group and current_group:
            result.append(current_group)
            current_group = []
        
        current_group.append(msg)
        last_timestamp = current_timestamp
    
    # 添加最后一组
    if current_group:
        result.append(current_group)
    
    return result


def generate_community_guide(input_file: str, output_file: str = 'output/final_document.md', user_input = "将聊天记录转为一份社区生活指南"):
    """
    Generate a community guide document from chat records
    
    Args:
        input_file: Path to input chat records file
        output_file: Path to output markdown file
    """
    try:
        input_file = os.path.abspath(input_file)
        
        try:
            chat_text = read_file(input_file)
            if not chat_text:
                raise ValueError("Empty chat text")
                
            print(f"Successfully read file: {input_file}")
            print(f"Content length: {len(chat_text)} characters")
            
            # Split into segments
            segments = split_chat_records(
                chat_text, 
                max_messages=1300, 
                min_messages=1000, 
                time_gap_minutes=100
            )
            
            if not segments:
                raise ValueError("No chat segments found")
                
            # Generate document structure
            doc_structure, outline = gen_structure(user_input, segments[0], model="anthropic/claude-3.5-sonnet:beta")
        
            # Process segments
            all_results = process_segments_parallel(segments[0:8], outline)

            # Merge results
            merged_result = merge_chapter_results(all_results)
            print("Merged results:", merged_result)
            # return 

            # Generate final document
            cleaned_document = process_chapters_to_document(merged_result, doc_structure)

            # Save output
            os.makedirs(os.path.dirname(output_file), exist_ok=True)
            with open(output_file, 'w', encoding='utf-8') as f:
                f.write(cleaned_document)
            
            print(f"Document saved to: {output_file}")
            
        except (FileNotFoundError, IOError) as e:
            print(f"Failed to read input file: {str(e)}")
            raise
            
    except Exception as e:
        print(f"Error generating document: {str(e)}")
        raise


def generate_cards_test(input_file: str, output_file: str = 'output/final_document.md'):
    try:
        input_file = os.path.abspath(input_file)
        
        try:
            chat_text = read_file(input_file)  
            # Split into segments
            segments = split_chat_records(
                chat_text, 
                max_messages=1100, 
                min_messages=800, 
                time_gap_minutes=180
            )
            
            if not segments:
                raise ValueError("No chat segments found")
            
            # overview = generate_overview(segments[0], model="meta-llama/llama-3.3-70b-instruct")
            # print(overview)
            # return
            # Generate cards in parallel
            all_cards = process_segments_to_cards_parallel(segments[0:3],model="google/gemini-flash-1.5-8b", max_workers=20)
            print(all_cards)
            return
            # Combine all cards
            combined_cards = '\n\n'.join(all_cards)
            
            # Save output
            os.makedirs(os.path.dirname(output_file), exist_ok=True)
            with open(output_file, 'w', encoding='utf-8') as f:
                f.write(combined_cards)
                
            print(f"Cards saved to: {output_file}")
            
        except (FileNotFoundError, IOError) as e:
            print(f"Failed to read input file: {str(e)}")
            raise
            
    except Exception as e:
        print(f"Failed to process file: {str(e)}")
        raise

if __name__ == '__main__':
    try:
        # generate_community_guide("./examples/ToAnotherCountry/ToAnotherCountry.txt")
        # generate_community_guide("./examples/yucun/DNyucun.txt")
        generate_cards_test("./examples/yucun/DNyucun.txt")
        
    except Exception as e:
        print(f"Failed to process file: {str(e)}")