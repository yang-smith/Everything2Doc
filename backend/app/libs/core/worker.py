from ..utils.ai_chat_client import ai_chat, ai_chat_stream, ai_chat_async, num_tokens_from_string, ai_chat_stream_async
from datetime import datetime
import re
from concurrent.futures import ThreadPoolExecutor
import concurrent.futures
from tqdm import tqdm
import os 
from ..preprocessing.reader import read_file
from ..preprocessing.split import split_chat_records, split_by_time_period, split_by_tokens
from ..prompt.prompt import (
    PROMPT_GEN_OVERVIEW,
    PROMPT_MERGE_SUMMARY,
    PROMPT_GEN_PART_DOC,
    PROMPT_MERGE_DOC,
    PROMPT_GEN_QA,
    PROMPT_DRY_CONTENT,
    PROMPT_SUMMARY_CONTENT,
)
from dataclasses import dataclass
from typing import List, Optional, Callable
from tiktoken import get_encoding
import asyncio
import logging

logger = logging.getLogger(__name__)


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


async def process_chunk_parallel_async(
    chunks: List[str], 
    model: str = "deepseek-reasoner",
    doc_type: str = "recent_month_summary",
    concurrency_limit: int = 10,
    retry_count: int = 1,
    timeout: float = 200.0  
) -> List[str]:
    """
    并行处理文本块生成摘要
    
    Args:
        chunks: 文本块列表
        model: 使用的AI模型
        doc_type: 文档类型
        concurrency_limit: 同时处理的最大文本块数量
        retry_count: 处理失败时的重试次数
        timeout: 每个块处理的最大等待时间(秒)
    
    Returns:
        List[str]: 生成的摘要列表
    """
    print(f"\nStarting parallel processing with model: {model}")
    print(f"Number of chunks: {len(chunks)}")
    print(f"Document type: {doc_type}")
    print(f"Concurrency limit: {concurrency_limit}")
    print(f"Timeout: {timeout} seconds")
    
    # 创建信号量限制并发
    semaphore = asyncio.Semaphore(concurrency_limit)
    
    async def process_single_chunk(chunk: str, chunk_index: int) -> tuple[int, Optional[str]]:
        # 使用信号量控制并发
        async with semaphore:
            for attempt in range(retry_count + 1):
                try:
                    # 构建提示
                    if doc_type == "summary":
                        prompt = PROMPT_SUMMARY_CONTENT.format(chat_records=chunk)
                    elif doc_type == "QA":
                        prompt = PROMPT_GEN_QA.format(chat_records=chunk)
                    elif doc_type == "knowledge":
                        prompt = PROMPT_DRY_CONTENT.format(chat_records=chunk)
                    else:
                        prompt = PROMPT_GEN_PART_DOC.format(chat_records=chunk, doc_type=doc_type)
                    
                    # 带超时的AI调用
                    try:
                        # 将AI调用包装在wait_for中以增加超时
                        summary = await asyncio.wait_for(
                            ai_chat_async(
                                message=prompt,
                                model=model
                            ),
                            timeout=timeout
                        )
                        
                        # 验证响应
                        if not summary or len(summary.strip()) == 0:
                            if attempt < retry_count:
                                print(f"Warning: Empty response for chunk {chunk_index}, attempt {attempt+1}/{retry_count+1}")
                                await asyncio.sleep(1)  # 短暂延迟后重试
                                continue
                            print(f"Warning: Empty response from model for chunk {chunk_index} after all attempts")
                            return chunk_index, None
                        
                        return chunk_index, summary
                        
                    except asyncio.TimeoutError:
                        if attempt < retry_count:
                            print(f"Timeout ({timeout}s) for chunk {chunk_index}, attempt {attempt+1}/{retry_count+1}")
                            continue
                        print(f"Timeout ({timeout}s) for chunk {chunk_index} after all attempts")
                        return chunk_index, None
                    except Exception as e:
                        if attempt < retry_count:
                            print(f"AI chat error for chunk {chunk_index}, attempt {attempt+1}/{retry_count+1}: {str(e)}")
                            await asyncio.sleep(1)  # 短暂延迟后重试
                            continue
                        print(f"AI chat error for chunk {chunk_index} after all attempts: {str(e)}")
                        return chunk_index, None
                        
                except Exception as e:
                    if attempt < retry_count:
                        print(f"Error in process_single_chunk {chunk_index}, attempt {attempt+1}/{retry_count+1}: {str(e)}")
                        await asyncio.sleep(1)  # 短暂延迟后重试
                        continue
                    print(f"Error in process_single_chunk {chunk_index} after all attempts: {str(e)}")
                    return chunk_index, None
            
            # 如果执行到这里，说明所有尝试都失败了
            return chunk_index, None

    # 创建任务列表
    tasks = [
        process_single_chunk(chunk, i) 
        for i, chunk in enumerate(chunks)
    ]
    
    # 使用tqdm创建进度条
    pbar = tqdm(total=len(tasks), desc="Processing chunks")
    results = []
    failed_chunks = []
    timeouts = 0  # 跟踪超时的数量
    
    # 捕获键盘中断，确保能够正确处理已完成的结果
    try:
        # 并行执行任务
        for completed_task in asyncio.as_completed(tasks):
            try:
                index, result = await completed_task
                if result is not None:
                    results.append((index, result))
                else:
                    failed_chunks.append(index)
                pbar.update(1)
            except asyncio.TimeoutError:
                # 记录顶层任务超时
                print(f"Task timed out at top level")
                timeouts += 1
                pbar.update(1)
            except Exception as e:
                print(f"Task completion error: {str(e)}")
                pbar.update(1)
    except KeyboardInterrupt:
        print("\nProcess interrupted by user. Saving completed results...")
        # 让已完成的任务保持完成状态
    finally:
        pbar.close()
    
    # 打印处理统计
    print(f"\nProcessing completed:")
    print(f"Successful chunks: {len(results)}")
    print(f"Failed chunks: {len(failed_chunks)}")
    if timeouts > 0:
        print(f"Timeouts: {timeouts}")
    if failed_chunks:
        print(f"Failed chunk indices: {failed_chunks}")
    
    if not results:
        print("\nDetailed error summary:")
        print(f"Total chunks: {len(chunks)}")
        print(f"All chunks failed to process")
        print(f"Please check the logs above for specific error messages")
        raise ValueError("No valid summaries generated - all chunks failed to process")
    
    # 按原始顺序排序结果
    results.sort(key=lambda x: x[0])
    return [result for _, result in results if result is not None]


async def generate_recent_month_summary(chat_content: str, 
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
    summaries = await process_chunk_parallel_async(chunks, model=model, doc_type="recent_month_summary")
    return ai_chat_stream_async(
        message=PROMPT_MERGE_SUMMARY.format(summaries='\n'.join(summaries)), 
        model=model
    )

def resum_part_docs(part_docs: list, max_tokens: int = 100000) -> list:
    """
    将part_docs按照token数量分组，确保每组的token数不超过max_tokens
    
    Args:
        part_docs: 文档片段列表
        max_tokens: 每组最大token数
        
    Returns:
        list: 分组后的文档列表，每个元素是一组文档的合并结果
    """
    if not part_docs:
        return []
        
    enc = get_encoding("cl100k_base")
    
    grouped_docs = []
    current_group = []
    current_tokens = 0
    
    for doc in part_docs:
        doc_tokens = len(enc.encode(doc))
        
        if doc_tokens > max_tokens:
            if current_group:
                grouped_docs.append('\n'.join(current_group))
                current_group = []
                current_tokens = 0
            grouped_docs.append(doc)
            continue
            
        if current_tokens + doc_tokens > max_tokens and current_group:
            grouped_docs.append('\n'.join(current_group))
            current_group = []
            current_tokens = 0
            
        current_group.append(doc)
        current_tokens += doc_tokens
    
    if current_group:
        grouped_docs.append('\n'.join(current_group))
    
    return grouped_docs

async def process_grouped_docs_parallel(
    grouped_docs: List[str],
    prompt_template: str,
    model: str = "deepseek-reasoner",
    progress_callback: Optional[Callable] = None,
    concurrency_limit: int = 10  
) -> List[str]:
    """
    并行处理分组后的文档
    
    Args:
        grouped_docs: 分组后的文档列表
        prompt_template: 提示模板字符串
        model: 使用的AI模型
        progress_callback: 进度回调函数
        concurrency_limit: 同时处理的最大文档数量
    
    Returns:
        List[str]: 处理结果列表，保持原始顺序
    """
    async def process_single_doc(doc: str, index: int) -> tuple[int, str]:
        try:
            result = await ai_chat_async(
                message=prompt_template.format(part_docs=doc),
                model=model
            )
            return index, result
        except Exception as e:
            print(f"Error processing group {index}: {str(e)}")
            return index, None

    # 使用Semaphore限制并发数量
    semaphore = asyncio.Semaphore(concurrency_limit)
    
    async def bounded_process(doc: str, index: int) -> tuple[int, str]:
        async with semaphore:
            return await process_single_doc(doc, index)
    
    # 创建任务列表
    tasks = [
        bounded_process(doc, i) 
        for i, doc in enumerate(grouped_docs)
    ]
    
    # 使用tqdm创建进度条
    pbar = tqdm(total=len(tasks), desc="Processing document groups")
    results = []
    
    # 并行执行任务
    for completed_task in asyncio.as_completed(tasks):
        try:
            index, result = await completed_task
            if result is not None:
                results.append((index, result))
            
            # 更新进度
            pbar.update(1)
            if progress_callback:
                try:
                    progress = (pbar.n / len(tasks)) * 100  
                    progress_callback(progress)
                except Exception as e:
                    print(f"Progress callback failed: {str(e)}")
                    
        except Exception as e:
            print(f"Task failed: {str(e)}")
    
    pbar.close()
    
    results.sort(key=lambda x: x[0])
    return [result for _, result in results if result is not None]

def generate_doc_single_chunk(chat_records: str, doc_type: str, model: str = "deepseek-reasoner"):
    """直接生成单个文档"""
    if doc_type == "summary":
        prompt = PROMPT_SUMMARY_CONTENT.format(chat_records=chat_records)
    elif doc_type == "QA":
        prompt = PROMPT_GEN_QA.format(chat_records=chat_records)
    elif doc_type == "knowledge":
        prompt = PROMPT_DRY_CONTENT.format(chat_records=chat_records)
    else:
        prompt = PROMPT_MERGE_DOC.format(part_docs=chat_records)
    
    return ai_chat_stream_async(
        message=prompt, 
        model=model
    )


async def generate_doc_async(chat_records: str, doc_type: str, model: str = "deepseek-reasoner", max_tokens: int = 50000):
    """生成文档（异步版本）"""
    logger.info(f"=== 开始文档生成 ===")
    logger.info(f"聊天记录长度: {len(chat_records)} 字符")
    logger.info(f"文档类型: {doc_type}")
    logger.info(f"使用模型: {model}")
    
    logger.info(f"1. 将聊天记录分割为段落...")
    segments = split_by_tokens(chat_records, max_tokens=max_tokens)
    logger.info(f"创建了 {len(segments)} 个段落")
    
    total_tokens = sum(num_tokens_from_string(s) for s in segments)
    avg_tokens = total_tokens / len(segments) if segments else 0
    logger.info(f"平均段落token数: {avg_tokens:.0f}")
    logger.info(f"总token数: {total_tokens}")
    
    if len(segments) == 1:
        return generate_doc_single_chunk(segments[0], doc_type, model)

    logger.info("\n2. 并行处理段落...")
    default_model = "google/gemini-2.0-flash-001"
    part_docs = await process_chunk_parallel_async(segments, model=default_model, doc_type=doc_type)
    logger.info(f"生成了 {len(part_docs)} 个部分文档")
    
    # 合并文档并检查token数量
    logger.info("\n3. 合并并检查token数量...")
    combined_docs = '\n'.join(part_docs)
    current_tokens = num_tokens_from_string(combined_docs, encoding_name="cl100k_base")
    logger.info(f"初始合并文档token数: {current_tokens}")
    
    iteration = 1
    while current_tokens > max_tokens:
        logger.info("3.1 汇总部分文档...")
        part_docs = resum_part_docs(part_docs)
        logger.info(f"汇总为 {len(part_docs)} 组")
        
        logger.info("3.2 处理汇总的组...")
        # 直接使用异步版本
        part_docs = await process_grouped_docs_parallel(
            grouped_docs=part_docs,
            prompt_template=PROMPT_MERGE_DOC,
            model=model
        )
        logger.info(f"处理了 {len(part_docs)} 组")
        
        combined_docs = '\n'.join(part_docs)
        current_tokens = num_tokens_from_string(combined_docs, encoding_name="cl100k_base")
        logger.info(f"处理后token数: {current_tokens}")
        
        iteration += 1
    
    logger.info("\n4. 生成最终文档...")
    logger.info(f"最终文档token数: {current_tokens}")
    logger.info("流式返回最终结果...\n")
    
    return ai_chat_stream_async(
        message=PROMPT_MERGE_DOC.format(part_docs=combined_docs), 
        model=model
    )

if __name__ == "__main__":
    
    main()
