import json
from typing import Callable, Generator, AsyncGenerator, Any, Dict
from fastapi.responses import StreamingResponse
import asyncio
from fastapi import Request
import logging

logger = logging.getLogger(__name__)

async def ai_stream_endpoint(
    request: Request,
    stream_generator: Callable,  
    stream_params: dict,
    model: str
):
    """
    统一的AI流式端点处理函数
    
    Args:
        request: FastAPI请求对象
        stream_generator: 异步生成器函数 (如generate_doc_async)
        stream_params: 传递给生成器的参数
        model: 使用的模型名称
    
    Returns:
        StreamingResponse: SSE流式响应
    """
    logger.info(f"开始流式响应，模型: {model}")
    
    # 客户端断开连接标志
    disconnect = asyncio.Event()
    
    # 监控客户端连接状态
    async def monitor_client():
        while not disconnect.is_set():
            if await request.is_disconnected():
                logger.info("客户端断开连接")
                disconnect.set()
                break
            await asyncio.sleep(1)

    # 创建监控任务
    monitor_task = asyncio.create_task(monitor_client())
    
    # 创建处理流的异步生成器
    async def stream_generator_wrapper():
        try:
            # 调用生成器函数
            async_stream = await stream_generator(**stream_params)
            
            # 处理不同类型的返回值
            if hasattr(async_stream, '__aiter__'):
                # 如果是异步迭代器(AsyncGenerator)
                async for chunk in async_stream:
                    if disconnect.is_set():
                        logger.info("检测到客户端断开，停止生成")
                        break
                    
                    # 构造SSE消息，确保以JSON格式发送
                    yield f"data: {json.dumps({'content': chunk})}\n\n"
            else:
                # 如果是同步生成器
                for chunk in async_stream:
                    if disconnect.is_set():
                        logger.info("检测到客户端断开，停止生成")
                        break
                    
                    # 构造SSE消息，确保以JSON格式发送
                    yield f"data: {json.dumps({'content': chunk})}\n\n"
                    
            # 发送完成信号
            if not disconnect.is_set():
                yield "data: [DONE]\n\n"
                
        except Exception as e:
            logger.error(f"流式生成过程中出错: {str(e)}")
            error_message = json.dumps({"error": str(e)})
            yield f"data: {error_message}\n\n"
            yield "data: [ERROR]\n\n"
        finally:
            # 确保监控任务被取消
            monitor_task.cancel()
    
    # 返回流式响应
    return StreamingResponse(
        stream_generator_wrapper(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "Content-Type": "text/event-stream",
            "X-Accel-Buffering": "no",  # 禁用Nginx缓冲
        }
    )