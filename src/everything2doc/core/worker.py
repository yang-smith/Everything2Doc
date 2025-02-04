from everything2doc.utils.ai_chat_client import ai_chat, ai_chat_stream
from datetime import datetime
import re
from concurrent.futures import ThreadPoolExecutor
import concurrent.futures
from tqdm import tqdm
import os 
from ..preprocessing.reader import read_file
from ..preprocessing.split import split_chat_records, split_by_time_period
from ..prompt.prompt import PROMPT_GEN_STRUCTURE, PROMPT_GEN_DOC_STRUCTURE, PROMPT_GET_INFO, PROMPT_GEN_END_DOC, PROMPT_EXTRACT_INFO, PROMPT_GEN_OVERVIEW, PROMPT_MONTHLY_SUMMARY, PROMPT_MERGE_SUMMARY, PROMPT_GEN_RECOMMENDATIONS, PROMPT_GEN_PART_DOC, PROMPT_MERGE_DOC
from .gen_structure import gen_structure
from dataclasses import dataclass
from typing import List, Optional

@dataclass
class Card:
    time: datetime
    tags: List[str]
    summary: str
    details: str
    
    def to_markdown(self) -> str:
        """转换为markdown格式"""
        tags_str = ', '.join(self.tags)
        return f"""<card>
time: {self.time.strftime('%Y-%m-%d %H:%M:%S')}
tags: {tags_str}
summary: {self.summary}

details: {self.details}
</card>"""

def parse_cards(markdown_text: str) -> List[Card]:
    """从markdown文本解析出cards列表"""
    cards = []
    # 匹配<card>...</card>块
    card_pattern = r'<card>(.*?)</card>'
    card_matches = re.finditer(card_pattern, markdown_text, re.DOTALL)
    
    for match in card_matches:
        card_content = match.group(1).strip()
        
        # 解析各个字段
        time_match = re.search(r'time: (.*?)(?:\n|$)', card_content)
        tags_match = re.search(r'tags: (.*?)(?:\n|$)', card_content)
        summary_match = re.search(r'summary: (.*?)(?:\n|$)', card_content)
        details_match = re.search(r'details: (.*?)(?:\n|$)', card_content)
        
        if all([time_match, tags_match, summary_match, details_match]):
            try:
                time = datetime.strptime(time_match.group(1).strip(), '%Y-%m-%d %H:%M:%S')
                tags = [tag.strip() for tag in tags_match.group(1).split(',')]
                summary = summary_match.group(1).strip()
                details = details_match.group(1).strip()
                
                cards.append(Card(
                    time=time,
                    tags=tags,
                    summary=summary,
                    details=details
                ))
            except Exception as e:
                print(f"Error parsing card: {str(e)}")
                continue
    
    return cards

def merge_chapter_results(results: list[str]) -> str:
    """
    合并多个结果，按章节组织内容
    """
    # 用于存储每个章节的内容
    chapter_contents = {}
    
    for result in results:
        # 提取 info_start 和 info_end 之间的内容
        pattern = r'<info_start>(.*?)<info_end>'
        match = re.search(pattern, result, re.DOTALL)
        if not match:
            continue
            
        content = match.group(1).strip()
        
        # 按章节分割内容
        chapters = re.split(r'\n(?=[\d一二三四五六七八九十]+、)', content)
        
        for chapter in chapters:
            if not chapter.strip():
                continue
                
            # 提取章节标题
            chapter_title = chapter.split('\n')[0].strip()
            chapter_content = '\n'.join(chapter.split('\n')[1:]).strip()
            
            if chapter_title not in chapter_contents:
                chapter_contents[chapter_title] = []
            
            # 将内容分成独立的条目
            items = [item.strip() for item in chapter_content.split('\n') if item.strip()]
            chapter_contents[chapter_title].extend(items)
    
    # 组合最终结果
    merged_content = ['<info_start>']
    for title, items in chapter_contents.items():
        # 去重并保持顺序
        unique_items = list(dict.fromkeys(items))
        merged_content.append(f"{title}\n{chr(10).join(unique_items)}\n")
    merged_content.append('<info_end>')
    
    return '\n'.join(merged_content)



def process_segments_parallel(segments, 
                                task, 
                                model = "openai/gpt-4o-mini-2024-07-18",
                                progress_callback=None):
    
    # 定义一个处理单个 segment 的函数
    def process_segment(segment):
        prompt_gen_doc_content = PROMPT_GET_INFO.format(
            outline=task, 
            chat_records=segment
        )
        return ai_chat(
            message=prompt_gen_doc_content, 
            model=model
        )

    all_results = []
    total_segments = len(segments)
    completed = 0

    with ThreadPoolExecutor(max_workers=20) as executor:
        # 提交所有任务
        future_to_segment = {
            executor.submit(process_segment, segment): i 
            for i, segment in enumerate(segments)
        }
        
        # 使用 tqdm 显示进度
        for future in tqdm(
            concurrent.futures.as_completed(future_to_segment),
            total=len(future_to_segment),
            desc="Processing segments"
        ):
            try:
                result = future.result()
                all_results.append(result)
                # 更新进度
                completed += 1
                if progress_callback:
                    try:
                        progress = (completed / total_segments) * 100
                        progress_callback(progress)
                    except Exception as e:
                        print(f"Progress callback failed: {str(e)}")
            except Exception as e:
                print(f"Segment processing failed: {str(e)}")
    
    return all_results



def process_chapters_to_document(merged_result: str, outline: str, model: str = "openai/gpt-4o-mini-2024-07-18") -> str:
    """
    Process chapters in parallel and generate final document.
    
    Args:
        merged_result: String containing merged chapter results with info tags
        outline: Document outline/structure
        model: AI model to use for processing
    
    Returns:
        str: Final processed and formatted document
    """
    # Extract chapters
    pattern = r'<info_start>(.*?)<info_end>'
    match = re.search(pattern, merged_result, re.DOTALL)
    if match:
        content = match.group(1).strip()
        chapters = re.split(r'\n(?=[\d一二三四五六七八九十]+、)', content)
    else:
        chapters = []

    def process_chapter(chapter_content):
        return ai_chat(
            message=PROMPT_GEN_END_DOC.format(
                outline=outline,
                aggregated_info=f"<info_start>\n{chapter_content}\n<info_end>"
            ),
            model=model
        )

    # Process chapters in parallel
    indexed_results = []
    with ThreadPoolExecutor(max_workers=len(chapters)) as executor:
        future_to_chapter = {
            executor.submit(process_chapter, chapter): i
            for i, chapter in enumerate(chapters) if chapter.strip()
        }

        for future in tqdm(
            concurrent.futures.as_completed(future_to_chapter),
            total=len(future_to_chapter),
            desc="Processing chapters"
        ):
            try:
                chapter_result = future.result()
                chapter_index = future_to_chapter[future]
                indexed_results.append((chapter_index, chapter_result))
            except Exception as e:
                print(f"Chapter processing failed: {str(e)}")

    # Merge and clean results
    final_document = '\n\n'.join(
        result for _, result in sorted(indexed_results, key=lambda x: x[0])
    )
    cleaned_document = re.sub(r'<content>\s*|\s*</content>', '', final_document)
    
    return cleaned_document

def process_segments_to_cards_single(segment: str, model: str = "deepseek-chat"):
    cards =  ai_chat(message=PROMPT_EXTRACT_INFO.format(chat_records=segment), model=model)
    cards = parse_cards(cards)
    cards.sort(key=lambda x: x.time, reverse=True)
    return cards

def generate_cards(chat_records: str, model: str = "deepseek-chat"):
    cards =  ai_chat(message=PROMPT_EXTRACT_INFO.format(chat_records=chat_records), model=model)
    return cards


def process_segments_to_cards_parallel(segments: list, 
                                     model: str = "deepseek-chat",
                                     max_workers: int = 20) -> List[Card]:
    """
    并行处理聊天记录片段，生成知识卡片
    
    Args:
        segments: 聊天记录片段列表
        model: 使用的AI模型
        max_workers: 最大并行工作线程数
    
    Returns:
        List[Card]: 生成的知识卡片列表
    """
    def process_segment(segment):
        try:
            markdown_text = generate_cards(segment, model=model)
            return parse_cards(markdown_text)
        except Exception as e:
            print(f"Segment processing failed: {str(e)}")
            return []

    all_cards = []
    
    with ThreadPoolExecutor(max_workers=max_workers) as executor:
        future_to_segment = {
            executor.submit(process_segment, segment): i 
            for i, segment in enumerate(segments)
        }
        
        for future in tqdm(
            concurrent.futures.as_completed(future_to_segment),
            total=len(future_to_segment),
            desc="Generating cards"
        ):
            try:
                cards = future.result()
                all_cards.extend(cards)
            except Exception as e:
                print(f"Card generation failed: {str(e)}")
    
    # 按时间排序
    all_cards.sort(key=lambda x: x.time, reverse=True)
    return all_cards


def generate_overview(chat_records: str, model: str = "meta-llama/llama-3.3-70b-instruct"):
    overview = ai_chat(message=PROMPT_GEN_OVERVIEW.format(chat_records=chat_records), model=model)
    return overview

def generate_recommendation(chat_records: str, model: str = "meta-llama/llama-3.3-70b-instruct"):
    recommendation = ai_chat(message=PROMPT_GEN_RECOMMENDATIONS.format(chat_records=chat_records), model=model)
    return recommendation

def generate_monthly_summary(chat_records: str, model: str = "deepseek-reasoner"):
    summary = ai_chat(message=PROMPT_MONTHLY_SUMMARY.format(chat_records=chat_records), model=model)
    return summary

def generate_part_doc(chat_records: str, doc_type: str, model: str = "deepseek-reasoner"):
    part_doc = ai_chat(message=PROMPT_GEN_PART_DOC.format(chat_records=chat_records, doc_type=doc_type), model=model)
    return part_doc

def test_update_doc():

    chat_text = read_file()

    segments = split_chat_records(chat_text, max_messages=1300, min_messages=1000, time_gap_minutes=100)
    
    chat_records = segments[0]

    # user_input = "将聊天记录转为一份常见问答文档"
    user_input = "将聊天记录转为一份社区生活指南"
    result, task = gen_structure(user_input, chat_records)

    all_results = process_segments_parallel(segments, task)

    # 合并结果
    merged_result = merge_chapter_results(all_results)
    print(merged_result)

    # 处理章节并生成最终文档
    cleaned_document = process_chapters_to_document(merged_result, result)

    # 写入文件
    output_file = 'output/final_document.md'
    os.makedirs('output', exist_ok=True)
    with open(output_file, 'w', encoding='utf-8') as f:
        f.write(cleaned_document)
    
    print(f"文档已保存到: {output_file}")

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

def process_chunk_parallel(chunks: List[str], 
                         model: str = "deepseek-reasoner",
                         max_workers: int = 10,
                         doc_type: str = "recent_month_summary") -> List[str]:
    """
    并行处理文本块生成摘要
    
    Args:
        chunks: 文本块列表
        model: 使用的AI模型
        max_workers: 最大并行工作线程数
    
    Returns:
        List[str]: 生成的摘要列表
    """
    def process_single_chunk(chunk: str, chunk_index: int, doc_type: str, model: str) -> Optional[str]:
        try:
            if doc_type == "recent_month_summary":
                summary = generate_monthly_summary(chunk, model=model)
            else:
                summary = generate_part_doc(chunk, doc_type, model=model)
            if not summary or len(summary.strip()) == 0:
                return None
            return summary
        except Exception as e:
            return None

    summaries = []
    with ThreadPoolExecutor(max_workers=max_workers) as executor:
        future_to_chunk = {
            executor.submit(process_single_chunk, chunk, i, doc_type, model): i 
            for i, chunk in enumerate(chunks)
        }

        for future in concurrent.futures.as_completed(future_to_chunk):
            try:
                summary = future.result()
                if summary:
                    summaries.append(summary)
            except Exception:
                continue
    
    if not summaries:
        raise ValueError("No valid summaries generated")
    
    return summaries

def generate_recent_month_summary(chat_content: str, 
                                output_file: Optional[str] = None,
                                model: str = "deepseek-reasoner",
                                max_tokens: int = 10000) -> str:
    """
    生成最近一个月的月度总结
    
    Args:
        input_file: 输入文件路径
        output_file: 输出文件路径（可选）
        model: 使用的AI模型
        max_tokens: 每个块的最大token数量
    
    Returns:
        sream流
    """
    segments = split_by_time_period(chat_content, 'month')
    
    if not segments:
        raise ValueError("No chat segments found")
    
    recent_month_records = segments[-1]
    if not recent_month_records:
        raise ValueError("No chat records found in the most recent month")
    
    chunks = limit_text_length(recent_month_records, max_tokens=max_tokens)
    summaries = process_chunk_parallel(chunks, model=model, doc_type="recent_month_summary")
    return ai_chat_stream(
        message=PROMPT_MERGE_SUMMARY.format(summaries='\n'.join(summaries)), 
        model=model
    )

def generate_doc(chat_records: str, doc_type: str, model: str = "deepseek-reasoner"):
    segments = split_chat_records(chat_records, 
                                max_messages=1300, 
                                min_messages=1000, 
                                time_gap_minutes=100)
    part_docs = process_chunk_parallel(segments, model=model, doc_type=doc_type)
    print(part_docs)
    return ai_chat_stream(
        message=PROMPT_MERGE_DOC.format(part_docs='\n'.join(part_docs)), 
        model=model
    )

if __name__ == "__main__":
    
    test_update_doc()
    # main()
