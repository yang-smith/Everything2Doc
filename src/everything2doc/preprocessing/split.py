from datetime import datetime
import re
import os


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
