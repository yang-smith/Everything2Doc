import os
from everything2doc import (
    gen_structure,
    split_chat_records,
    split_by_time_period,
    process_segments_parallel,
    process_chapters_to_document,
    merge_chapter_results,
    read_file,
    process_segments_to_cards_parallel,
    parse_messages,
    ai_chat,
    generate_overview,
    generate_monthly_summary
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
            segments = split_by_time_period(
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

def limit_text_length(text: str, max_tokens: int = 10000) -> List[str]:
    """
    将文本按照token限制分割成多个部分
    
    Args:
        text: 原始文本
        max_tokens: 每个部分的最大token数量（默认10000）
    
    Returns:
        List[str]: 分割后的文本列表
    """
    # 粗略估计：平均每个token约4个字符
    CHARS_PER_TOKEN = 4
    max_chars = max_tokens * CHARS_PER_TOKEN
    
    if not text:
        return []
        
    if len(text) <= max_chars:
        return [text]
        
    # 按消息分割
    messages = text.split('\n')
    
    # 初始化结果列表和当前块
    chunks = []
    current_chunk = []
    current_length = 0
    
    for message in messages:
        message_length = len(message) + 1  # +1 for newline
        
        # 如果当前消息加入后超过限制，保存当前块并开始新块
        if current_length + message_length > max_chars and current_chunk:
            chunks.append('\n'.join(current_chunk))
            current_chunk = []
            current_length = 0
            
        # 处理单条消息超过限制的情况
        if message_length > max_chars:
            # 如果当前块非空，先保存
            if current_chunk:
                chunks.append('\n'.join(current_chunk))
                current_chunk = []
                current_length = 0
            # 将长消息单独作为一块（可能需要进一步处理）
            chunks.append(message)
            continue
            
        # 将消息添加到当前块
        current_chunk.append(message)
        current_length += message_length
    
    # 处理最后一个块
    if current_chunk:
        chunks.append('\n'.join(current_chunk))
    
    return chunks

Prompt = """
帮我将下面的多个summary合并成一个summary。
从读者角度出发，你的读者是群成员，注意根据群的调性调整文本风格。
合并的summary内容尽量丰富细节。

{summaries}
直接输出合并后的summary
"""

def generate_month_document(input_file: str, output_file: str = 'output/month_document.md'):
    try:
        input_file = os.path.abspath(input_file)
        
        try:
            chat_text = read_file(input_file)  
            # Split into segments
            segments = split_by_time_period(
                chat_text, 
                'month'
            )
            
            if not segments:
                raise ValueError("No chat segments found")
            
            print(f"Found {len(segments)} segments")
                
            # Get the most recent month's records
            records = segments[-2] if segments else ""
            if not records:
                raise ValueError("No chat records found in the most recent segment")
            
            # 限制records长度
            chunks = limit_text_length(records, max_tokens=10000)
            summaries = ""
            for i, chunk in enumerate(chunks):
                print(f"Chunk {i+1} length: {len(chunk)}")
                summaries += generate_monthly_summary(chunk, model='deepseek-reasoner')
           
            print(summaries)
            summary = ai_chat(Prompt.format(summaries=summaries), model='deepseek-reasoner')

            print(summary)
            return


            
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

def process_chunk_parallel(chunks: List[str], 
                         model: str = "deepseek-reasoner",
                         max_workers: int = 10) -> List[str]:
    """
    并行处理文本块生成摘要
    
    Args:
        chunks: 文本块列表
        model: 使用的AI模型
        max_workers: 最大并行工作线程数
    
    Returns:
        List[str]: 生成的摘要列表
    """
    def process_single_chunk(chunk: str, chunk_index: int) -> str:
        try:
            print(f"\nProcessing chunk {chunk_index + 1}/{len(chunks)}")
            print(f"Chunk length: {len(chunk)} characters")
            
            summary = generate_monthly_summary(chunk, model=model)
            
            if not summary or len(summary.strip()) == 0:
                print(f"Warning: Empty summary received for chunk {chunk_index + 1}")
                return None
                
            print(f"Successfully generated summary for chunk {chunk_index + 1}")
            print(f"Summary length: {len(summary)} characters")
            return summary
            
        except Exception as e:
            print(f"\nError processing chunk {chunk_index + 1}: {str(e)}")
            print(f"Chunk content preview: {chunk[:200]}...")
            raise  # 重新抛出异常，让主程序处理

    summaries = []
    failed_chunks = []
    
    with ThreadPoolExecutor(max_workers=max_workers) as executor:
        future_to_chunk = {
            executor.submit(process_single_chunk, chunk, i): i 
            for i, chunk in enumerate(chunks)
        }
        
        for future in tqdm(
            concurrent.futures.as_completed(future_to_chunk),
            total=len(future_to_chunk),
            desc="Generating summaries"
        ):
            chunk_index = future_to_chunk[future]
            try:
                summary = future.result()
                if summary:
                    summaries.append(summary)
                else:
                    failed_chunks.append(chunk_index)
            except Exception as e:
                print(f"\nChunk {chunk_index + 1} processing failed: {str(e)}")
                failed_chunks.append(chunk_index)
    
    # 报告处理结果
    print(f"\nProcessing complete:")
    print(f"- Successfully processed: {len(summaries)}/{len(chunks)} chunks")
    if failed_chunks:
        print(f"- Failed chunks: {failed_chunks}")
    
    if not summaries:
        raise ValueError(f"No valid summaries generated. All {len(chunks)} chunks failed processing.")
    
    return summaries

def generate_recent_month_summary(input_file: str, 
                                output_file: str = 'output/recent_month_summary.md',
                                model: str = "deepseek-reasoner",
                                max_tokens: int = 10000) -> str:
    """
    生成最近一个月的月度总结
    
    Args:
        input_file: 输入文件路径
        output_file: 输出文件路径
        model: 使用的AI模型
        max_tokens: 每个块的最大token数量
    
    Returns:
        str: 生成的月度总结
    """
    try:
        input_file = os.path.abspath(input_file)
        chat_text = read_file(input_file)
        
        # 按月份分割聊天记录
        segments = split_by_time_period(chat_text, 'month')
        if not segments:
            raise ValueError("No chat segments found")
        
        print(f"Found {len(segments)} monthly segments")
        
        # 获取最近一个月的记录
        recent_month_records = segments[-1] if segments else ""
        if not recent_month_records:
            raise ValueError("No chat records found in the most recent month")
        
        # 限制文本长度并分块
        chunks = limit_text_length(recent_month_records, max_tokens=max_tokens)
        print(f"\nSplit into {len(chunks)} chunks")
        print(f"Average chunk size: {sum(len(c) for c in chunks)/len(chunks):.0f} characters")
        
        # 并行处理生成摘要
        try:
            summaries = process_chunk_parallel(chunks, model=model)
        except Exception as e:
            print(f"\nError during parallel processing: {str(e)}")
            raise
        
        print("\nGenerating final merged summary...")
        # 合并所有摘要
        merged_summary = ai_chat(
            Prompt.format(summaries='\n'.join(summaries)), 
            model=model
        )
        
        if not merged_summary or len(merged_summary.strip()) == 0:
            raise ValueError("Generated merged summary is empty")
            
        # 保存结果
        if output_file:
            os.makedirs(os.path.dirname(output_file), exist_ok=True)
            with open(output_file, 'w', encoding='utf-8') as f:
                f.write(merged_summary)
            print(f"Summary saved to: {output_file}")
        
        return merged_summary
        
    except Exception as e:
        print(f"\nFailed to generate recent month summary: {str(e)}")
        raise

if __name__ == '__main__':
    try:
        # generate_community_guide("./examples/ToAnotherCountry/ToAnotherCountry.txt")
        # generate_community_guide("./examples/yucun/DNyucun.txt")
        # generate_month_document("./examples/yucun/DNyucun.txt")
        # generate_month_document("./examples/ToAnotherCountry/ToAnotherCountry.txt")
        summary = generate_recent_month_summary(
            "./examples/yucun/DNyucun.txt",
            model="deepseek-chat",
            max_tokens=10000
        )
        print(summary)        
    except Exception as e:
        print(f"Failed to process file: {str(e)}")