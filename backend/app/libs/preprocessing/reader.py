from typing import TypedDict, List
from datetime import datetime
import re
import os 

class Message(TypedDict):
    timestamp: str
    content: str
    sender: str
    type: str
    metadata: dict

def read_file(filename: str) -> str:
    """
    读取聊天记录文件并返回其内容
    
    Args:
        filename (str): 要读取的文件的完整路径
        
    Returns:
        str: 文件内容
        
    Raises:
        FileNotFoundError: 当文件不存在时
        IOError: 当读取文件出现问题时
    """
    if not filename:
        raise ValueError("Filename cannot be empty")
        
    if not os.path.exists(filename):
        raise FileNotFoundError(f"File not found: {filename}")
        
    try:
        with open(filename, 'r', encoding='utf-8') as file:
            content = file.read()
            if not content:
                raise ValueError(f"File is empty: {filename}")
            return content
    except UnicodeDecodeError:
        # Try different encodings if utf-8 fails
        try:
            with open(filename, 'r', encoding='gbk') as file:
                return file.read()
        except UnicodeDecodeError:
            raise IOError(f"Unable to read file with utf-8 or gbk encoding: {filename}")
    except Exception as e:
        raise IOError(f"Error reading file {filename}: {str(e)}")

def read_chat_records(filename, max_lines=300):
    """
    读取聊天记录文件的前N行并返回格式化的字符串
    
    Args:
        filename (str): 要读取的文件名
        max_lines (int): 要读取的最大行数
        
    Returns:
        str: 格式化的聊天记录字符串，如果出错则返回None
    """
    try:
        with open(filename, 'r', encoding='utf-8') as file:
            lines = []
            for _ in range(max_lines):
                try:
                    line = next(file).strip()
                    if line:  # 只添加非空行
                        lines.append(line)
                except StopIteration:
                    break
            
            # 直接将所有行用换行符连接
            return '\n'.join(lines)
            
    except FileNotFoundError:
        print(f"错误: 找不到文件 '{filename}'")
        return None
    except Exception as e:
        print(f"读取文件时发生错误: {str(e)}")
        return None

def parse_single_message(message_text: str) -> Message:
    """
    将单条消息文本解析为标准格式
    
    Args:
        message_text: 原始消息文本
        
    Returns:
        Message: 标准格式的消息对象
        
    Raises:
        ValueError: 当消息格式不正确时
    """
    # 更新后的模式，捕获时间戳、发送者和内容
    pattern = r'(\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}) ([^-\n]+?)(?:[ ]*-[ ]*|\s+)(.+)'
    match = re.match(pattern, message_text.strip(), re.DOTALL)
    
    if not match:
        raise ValueError(f"Invalid message format: {message_text}")
        
    timestamp_str, sender, content = match.groups()
    
    # 清理发送者名称（移除URL等）
    sender = re.split(r'\s+(?:https?://|$)', sender.strip())[0]
    
    # 转换时间戳为ISO 8601格式
    timestamp = datetime.strptime(timestamp_str, '%Y-%m-%d %H:%M:%S').isoformat()
    
    return Message(
        timestamp=timestamp,
        content=content.strip(),
        sender=sender.strip(),
        type="text",
        metadata={}
    )

def parse_messages(chat_text: str) -> List[Message]:
    """
    将聊天记录文本解析为标准格式的消息列表
    
    Args:
        chat_text: 完整的聊天记录文本
        
    Returns:
        List[Message]: 标准格式的消息列表
    """
    # 使用更灵活的模式来分割消息
    pattern = r'(\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2} .+?)(?=\n\d{4}-\d{2}-\d{2}|\Z)'
    messages = re.findall(pattern, chat_text, re.DOTALL)
    
    parsed_messages = []
    for msg in messages:
        if msg.strip():
            try:
                parsed_messages.append(parse_single_message(msg))
            except ValueError as e:
                print(f"Warning: Skipping invalid message: {e}")
                continue
    
    return parsed_messages


