import os
import httpx
import tiktoken
import asyncio
from aiolimiter import AsyncLimiter
from openai import OpenAI, AsyncOpenAI
from dotenv import load_dotenv
import json

load_dotenv()
# 常量配置
DEFAULT_TEMPERATURE = 0.05
DEFAULT_SYSTEM_MESSAGE = "You are a helpful assistant."
semaphore = asyncio.Semaphore(10)


def _get_client(model: str, is_async: bool = False) -> OpenAI | AsyncOpenAI:
    """Return appropriate OpenAI client based on model and type."""
    client_class = AsyncOpenAI if is_async else OpenAI
    
    # 处理 OpenRouter 模型 (包含 '/' 的模型名称)
    if '/' in model:
        api_key = os.environ.get("OPENROUTER_API_KEY")
        base_url = os.environ.get("OPENROUTER_API_BASE", "https://openrouter.ai/api/v1")
        if not api_key:
            raise ValueError(
                "Missing required environment variable: OPENROUTER_API_KEY"
            )
        return client_class(api_key=api_key, base_url=base_url)
    
    # 处理 Deepseek 模型
    if model == 'deepseek-chat' or model == 'deepseek-reasoner':
        api_key = os.environ.get("DEEPSEEK_API_KEY")
        base_url = os.environ.get("DEEPSEEK_API_BASE")
        if not api_key or not base_url:
            raise ValueError(
                "Missing required environment variables for Deepseek: "
                "DEEPSEEK_API_KEY and DEEPSEEK_API_BASE must be set"
            )
        return client_class(api_key=api_key, base_url=base_url)
    
    # 处理默认 OpenAI 模型
    api_key = os.environ.get("OPENAI_API_KEY")
    base_url = os.environ.get("OPENAI_API_BASE")
    if not api_key:
        raise ValueError("Missing required environment variable: OPENAI_API_KEY")
    
    return client_class(
        api_key=api_key,
        base_url=base_url or "https://api.openai.com/v1"
    )

def _prepare_messages(message, system_message: str = DEFAULT_SYSTEM_MESSAGE):
    """Prepare messages for chat completion."""
    return [
        {"role": "system", "content": system_message},
        {"role": "user", "content": message}
    ]

def ai_chat(message: str | list, 
            model: str = "gpt-4o-mini", 
            response_format: str = 'NOT_GIVEN', 
            tools: list = None) -> str:
    """
    Synchronous chat completion using OpenAI API.
    
    Args:
        message: User message (str) or full messages list
        model: Model to use for completion
        response_format: Optional response format (e.g., 'json')
        tools: Optional list of function definitions for function calling
    
    Returns:
        str: AI response content
    """
    client = _get_client(model)
    messages = message if isinstance(message, list) else _prepare_messages(message)
    
    kwargs = {
        "messages": messages,
        "model": model,
        "temperature": DEFAULT_TEMPERATURE
    }
    
    if response_format == 'json':
        kwargs["response_format"] = {"type": "json_object"}
    
    if tools:
        kwargs["tools"] = tools
        kwargs["tool_choice"] = "auto"
    

    chat_completion = client.chat.completions.create(**kwargs)
    
    response_message = chat_completion.choices[0].message
    
    # 检查是否有函数调用
    if hasattr(response_message, 'tool_calls') and response_message.tool_calls:
        tool_call = response_message.tool_calls[0]  # 获取第一个工具调用
        function_name = tool_call.function.name
        function_args = json.loads(tool_call.function.arguments)
        
        # 返回函数调用的结果
        return json.dumps({
            "function_call": {
                "name": function_name,
                "arguments": function_args
            }
        })
    
    return response_message.content

async def ai_chat_async(message: str | list, 
            model: str = "gpt-4o-mini", 
            response_format: str = 'NOT_GIVEN', 
            tools: list = None) -> str:
    """
    Asynchronous chat completion using OpenAI API.
    
    Args:
        message: User message (str) or full messages list
        model: Model to use for completion
        response_format: Optional response format (e.g., 'json')
        tools: Optional list of function definitions for function calling
    
    Returns:
        str: AI response content
    """
    client = _get_client(model, is_async=True)
    messages = message if isinstance(message, list) else _prepare_messages(message)
    
    kwargs = {
        "messages": messages,
        "model": model,
        "temperature": DEFAULT_TEMPERATURE
    }
    
    if response_format == 'json':
        kwargs["response_format"] = {"type": "json_object"}
    
    if tools:
        kwargs["tools"] = tools
        kwargs["tool_choice"] = "auto"
    
    try:
        async with semaphore:
            chat_completion = await asyncio.wait_for(
                client.chat.completions.create(**kwargs),
                timeout=200
            )
    except asyncio.TimeoutError:
        raise TimeoutError("API request timed out after 200 seconds")
    except Exception as e:
        raise e


    response_message = chat_completion.choices[0].message
    
    # 检查是否有函数调用
    if hasattr(response_message, 'tool_calls') and response_message.tool_calls:
        tool_call = response_message.tool_calls[0]  # 获取第一个工具调用
        function_name = tool_call.function.name
        function_args = json.loads(tool_call.function.arguments)
        
        # 返回函数调用的结果
        return json.dumps({
            "function_call": {
                "name": function_name,
                "arguments": function_args
            }
        })
    
    return response_message.content

# Token handling utilities
def num_tokens_from_string(string: str, encoding_name: str = "cl100k_base") -> int:
    """Returns the number of tokens in a text string."""
    encoding = tiktoken.get_encoding(encoding_name)
    return len(encoding.encode(string))

def truncate_list_by_token_size(list_data: list, max_token_size: int) -> list:
    """
    Truncate a list of data by token size.
    
    Args:
        list_data: List of strings to truncate
        max_token_size: Maximum allowed tokens
    
    Returns:
        list: Truncated list
    """
    tokens = 0
    for i, data in enumerate(list_data):
        tokens += num_tokens_from_string(data)
        if tokens > max_token_size:
            return list_data[:i]
    return list_data

def ai_chat_stream(message: str | list, 
                  model: str = "gpt-4o-mini", 
                  response_format: str = 'NOT_GIVEN',
                  tools: list = None):
    """
    Streaming version of chat completion using OpenAI API.
    """
    client = _get_client(model)
    messages = message if isinstance(message, list) else _prepare_messages(message)
    
    kwargs = {
        "messages": messages,
        "model": model,
        "temperature": DEFAULT_TEMPERATURE,
        "stream": True
    }
    
    if response_format == 'json':
        kwargs["response_format"] = {"type": "json_object"}
    
    if tools:
        kwargs["tools"] = tools
        kwargs["tool_choice"] = "auto"

    try:
        stream = client.chat.completions.create(**kwargs)
        for chunk in stream:
            if chunk.choices[0].delta.content is not None:
                yield chunk.choices[0].delta.content
    finally:
        # 确保清理资源
        if hasattr(client, 'close'):
            client.close()
