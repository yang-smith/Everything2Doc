from everything2doc.utils.ai_chat_client import ai_chat
from datetime import datetime
import re
from concurrent.futures import ThreadPoolExecutor
import concurrent.futures
from tqdm import tqdm
import os 
from ..preprocessing.reader import read_file
from ..preprocessing.split import split_chat_records
from ..prompt.prompt import PROMPT_GEN_STRUCTURE, PROMPT_GEN_DOC_STRUCTURE, PROMPT_GET_INFO, PROMPT_GEN_END_DOC
from .gen_structure import gen_structure



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



def process_segments_parallel(segments, task, model = "openai/gpt-4o-mini-2024-07-18"):
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




if __name__ == "__main__":
    
    test_update_doc()
    # main()
