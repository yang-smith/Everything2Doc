from datetime import datetime
import re
import os 

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

def read_chat_records(filename='ToAnotherCountry.txt', max_lines=300):
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


