from datetime import datetime, timedelta
import re
import os
from typing import List
from ..utils.ai_chat_client import num_tokens_from_string

def split_chat_records(chat_text, max_messages=500, min_messages=300, time_gap_minutes=100):
    """
    分割聊天记录
    
    参数:
    chat_text: 原始聊天记录文本
    max_messages: 每个片段最大消息数
    min_messages: 每个片段最小消息数（除最后一个片段外）
    time_gap_minutes: 判定为新会话的时间间隔（分钟）
    
    返回:
    list of str: 分割后的聊天记录片段列表
    """
    # 解析消息
    # 时间格式：2023-05-11 19:33:39
    pattern = r'(\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}) (.*?)(?=\n\d{4}-\d{2}-\d{2}|\Z)'
    messages = re.findall(pattern, chat_text, re.DOTALL)
    
    if not messages:
        return []
    
    # 存储分割后的片段
    segments = []
    current_segment = []
    last_time = datetime.strptime(messages[0][0], '%Y-%m-%d %H:%M:%S')
    
    for i, (timestamp, content) in enumerate(messages):
        current_time = datetime.strptime(timestamp, '%Y-%m-%d %H:%M:%S')
        time_diff = (current_time - last_time).total_seconds() / 60
        
        # 判断是否需要分割
        should_split = False
        
        # 检查时间间隔和最小消息数要求
        if time_diff > time_gap_minutes and len(current_segment) >= min_messages:
            should_split = True
            
        # 检查消息数量
        if len(current_segment) >= max_messages:
            should_split = True
            
        if should_split and current_segment:
            segments.append('\n'.join(f"{t} {c}" for t, c in current_segment))
            current_segment = []
            
        current_segment.append((timestamp, content))
        last_time = current_time
    
    # 添加最后一个片段
    if current_segment:
        segments.append('\n'.join(f"{t} {c}" for t, c in current_segment))
    
    return segments


def segment_test():

    with open('ToAnotherCountry.txt', 'r', encoding='utf-8') as file:
        chat_text = file.read()
    segments = split_chat_records(chat_text)
    
    # 打印总段数
    print(f"聊天记录被分割成 {len(segments)} 个部分\n")

    # 打印分割结果
    for i, segment in enumerate(segments, 1):
        # 计算该片段中的消息数量（通过计算时间戳的数量）
        message_count = len(re.findall(r'\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}', segment))
        print(f"=== Segment {i} (包含 {message_count} 条消息) ===")
        print("\n")

def split_tasks(task_text: str) -> list[str]:
    """
    将任务说明文本分割成独立的任务字符串列表
    
    Args:
        task_text (str): 包含多个任务的文本
        
    Returns:
        list[str]: 任务字符串列表，每个字符串包含完整的任务描述
    """
    # 分割任务块并去掉第一个空元素
    tasks = task_text.split('<task_start>')[1:]
    
    # 处理每个任务块，去掉结束标记并清理空白
    parsed_tasks = [
        task.split('<task_end>')[0].strip()
        for task in tasks
        if task.strip()  # 只保留非空任务
    ]
    
    return parsed_tasks

def split_by_time_period(chat_text: str, period: str = 'day') -> list[str]:
    """
    按时间周期分割聊天记录
    
    参数:
    chat_text: 原始聊天记录文本
    period: 分割周期，可选值：'day', 'week', 'month'
    
    返回:
    list of str: 按时间周期分割后的聊天记录片段列表
    """
    # 解析消息
    pattern = r'(\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}) (.*?)(?=\n\d{4}-\d{2}-\d{2}|\Z)'
    messages = re.findall(pattern, chat_text, re.DOTALL)
    
    if not messages:
        return []
    
    # 按时间周期分组
    segments_dict = {}
    for timestamp, content in messages:
        dt = datetime.strptime(timestamp, '%Y-%m-%d %H:%M:%S')
        
        # 获取时间周期的key
        if period == 'day':
            period_key = dt.replace(hour=0, minute=0, second=0)
        elif period == 'week':
            # 获取本周一
            period_key = dt - timedelta(days=dt.weekday())
            period_key = period_key.replace(hour=0, minute=0, second=0)
        elif period == 'month':
            period_key = dt.replace(day=1, hour=0, minute=0, second=0)
        else:
            raise ValueError("period must be one of: 'day', 'week', 'month'")
            
        # 添加到对应分组
        if period_key not in segments_dict:
            segments_dict[period_key] = []
        segments_dict[period_key].append((timestamp, content))
    
    # 转换为文本片段
    segments = []
    for period_key in sorted(segments_dict.keys()):
        segment = '\n'.join(f"{t} {c}" for t, c in segments_dict[period_key])
        segments.append(segment)
    
    return segments

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

def split_by_tokens(chat_text: str, max_tokens: int = 8000) -> List[str]:
    """
    按照token数量分割聊天记录
    
    Args:
        chat_text: 原始聊天记录文本
        max_tokens: 每个片段最大token数
    
    Returns:
        List[str]: 分割后的聊天记录片段列表
    """
    # 解析消息
    # 时间格式：2023-05-11 19:33:39
    pattern = r'(\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}) (.*?)(?=\n\d{4}-\d{2}-\d{2}|\Z)'
    messages = re.findall(pattern, chat_text, re.DOTALL)
    
    if not messages:
        return []
    
    # 存储分割后的片段
    segments = []
    current_segment = []
    current_tokens = 0
    
    for i, (timestamp, content) in enumerate(messages):
        # 构造完整消息
        message = f"{timestamp} {content}"
        message_tokens = num_tokens_from_string(message)
        
        # 如果单条消息就超过最大token限制
        if message_tokens > max_tokens:
            # 如果当前段落非空，先保存当前段落
            if current_segment:
                segments.append('\n'.join(current_segment))
                current_segment = []
                current_tokens = 0
            # 将大消息单独作为一个段落
            segments.append(message)
            continue
            
        # 如果当前消息加入后会超过token限制，保存当前段落并开始新段落
        if current_tokens + message_tokens > max_tokens:
            segments.append('\n'.join(current_segment))
            current_segment = []
            current_tokens = 0
            
        # 将消息添加到当前段落
        current_segment.append(message)
        current_tokens += message_tokens
    
    # 处理最后一个段落
    if current_segment:
        segments.append('\n'.join(current_segment))
    
    # print(f"Split into {len(segments)} segments based on tokens:")
    # for i, segment in enumerate(segments, 1):
    #     segment_tokens = num_tokens_from_string(segment)
    #     print(f"Segment {i}: {segment_tokens} tokens")
    
    return segments