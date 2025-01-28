"use client"

import { useState, useRef, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { api } from '@/lib/api'
import { ScrollArea } from '@/components/ui/scroll-area'

export default function ChatTestPage() {
  const [messages, setMessages] = useState<string[]>([])
  const [input, setInput] = useState('')
  const [isStreaming, setIsStreaming] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)
  
  // 自动滚动到底部
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || isStreaming) return

    // 添加用户消息
    setMessages(prev => [...prev, `用户: ${input}`])
    
    // 开始流式响应
    setIsStreaming(true)
    let responseText = ''
    
    try {
      const eventSource = api.createChatStream(input)
      
      eventSource.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data)
          
          // 处理开始消息
          if (data.status === 'start') {
            console.log('Chat started with model:', data.model)
            return
          }
          
          // 处理错误消息
          if (data.error) {
            console.error('Stream error:', data.error)
            setMessages(prev => [...prev, `错误: ${data.error}`])
            eventSource.close()
            setIsStreaming(false)
            return
          }
          
          // 处理完成信号
          if (event.data === '[DONE]') {
            eventSource.close()
            setIsStreaming(false)
            return
          }

          // 处理内容块
          if (data.content) {
            responseText += data.content
            setMessages(prev => [...prev.slice(0, -1), `AI: ${responseText}`])
          }
        } catch (error) {
          console.error('Error parsing stream data:', error)
        }
      }

      eventSource.onerror = (error) => {
        console.error('Stream error:', error)
        eventSource.close()
        setIsStreaming(false)
        setMessages(prev => [...prev, "错误：连接中断，请重试"])
      }
    } catch (error) {
      console.error('Error creating stream:', error)
      setIsStreaming(false)
      setMessages(prev => [...prev, "错误：无法创建连接"])
    }

    // 清空输入
    setInput('')
  }

  return (
    <div className="container max-w-2xl mx-auto p-4 space-y-4">
      <h1 className="text-2xl font-bold">流式聊天测试</h1>
      
      {/* 消息显示区域 */}
      <div className="h-[600px] border rounded-lg bg-background p-4">
        <ScrollArea ref={scrollRef} className="h-full">
          <div className="space-y-4">
            {messages.map((msg, index) => (
              <div 
                key={index}
                className="text-sm whitespace-pre-wrap"
              >
                {msg}
              </div>
            ))}
            {isStreaming && (
              <div className="text-muted-foreground animate-pulse">
                AI正在思考...
              </div>
            )}
          </div>
        </ScrollArea>
      </div>

      {/* 输入区域 */}
      <form onSubmit={handleSubmit} className="flex gap-2">
        <Input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="输入消息..."
          disabled={isStreaming}
        />
        <Button type="submit" disabled={isStreaming}>
          发送
        </Button>
      </form>
    </div>
  )
} 