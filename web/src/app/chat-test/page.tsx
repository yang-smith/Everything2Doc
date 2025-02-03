"use client"

import { useState, useRef, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { api } from '@/lib/api'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Progress } from '@/components/ui/progress'

export default function ChatTestPage() {
  // 聊天相关状态
  const [messages, setMessages] = useState<string[]>([])
  const [input, setInput] = useState('')
  const [isStreaming, setIsStreaming] = useState(false)
  
  // 月度总结相关状态
  const [summary, setSummary] = useState('')
  const [generationProgress, setGenerationProgress] = useState(0)
  const [isGenerating, setIsGenerating] = useState(false)
  const [error, setError] = useState('')
  
  // 新增推荐相关状态
  const [recommendations, setRecommendations] = useState<string[]>([])
  const [loadingRecommendations, setLoadingRecommendations] = useState(false)
  const [recommendationError, setRecommendationError] = useState('')
  
  const scrollRef = useRef<HTMLDivElement>(null)

  // 自动滚动
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages, summary])

  // 处理聊天提交
  const handleChatSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || isStreaming) return

    setMessages(prev => [...prev, `用户: ${input}`])
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
    setInput('')
  }

  // 新增：处理月度总结生成
  const handleGenerateSummary = async () => {
    if (isGenerating) return
    
    setIsGenerating(true)
    setError('')
    setSummary('')
    setGenerationProgress(0)

    try {
      const eventSource = api.createMonthSummaryStream('d44c4112-0987-4a1b-a7e2-1dd2f4f8e55a', {
        start_date: '2024-06-01',
        end_date: '2024-06-30'
      })

      eventSource.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data)
          
          if (data.progress) {
            setGenerationProgress(data.progress)
          }
          
          if (data.content) {
            setSummary(prev => prev + data.content)
          }
          
          if (data.error) {
            setError(data.error)
            eventSource.close()
          }
          
          if (event.data === '[DONE]') {
            eventSource.close()
            setIsGenerating(false)
          }
        } catch (err) {
          console.error('Error parsing stream data:', err)
        }
      }

      eventSource.onerror = (err) => {
        console.error('Summary stream error:', err)
        setError('生成中断，请重试')
        eventSource.close()
        setIsGenerating(false)
      }
    } catch (err) {
      console.error('Error starting generation:', err)
      setError('无法开始生成')
      setIsGenerating(false)
    }
  }

  // 新增：获取推荐处理
  const handleGetRecommendations = async () => {
    setLoadingRecommendations(true)
    setRecommendationError('')
    try {
      const projectId = 'd44c4112-0987-4a1b-a7e2-1dd2f4f8e55a' // 测试用项目ID
      const result = await api.getProjectRecommendation(projectId)
      setRecommendations(result)
      console.log(result)
    } catch (err) {
      setRecommendationError(err instanceof Error ? err.message : '获取推荐失败')
    } finally {
      setLoadingRecommendations(false)
    }
  }

  return (
    <div className="container max-w-4xl mx-auto p-4 space-y-6">
      {/* 聊天测试部分 */}
      <section className="space-y-4">
        <h2 className="text-xl font-bold">聊天测试</h2>
        <div className="h-[400px] border rounded-lg bg-background p-4">
          <ScrollArea ref={scrollRef} className="h-full">
            <div className="space-y-4">
            {messages.map((msg, index) => (
              <div 
                key={`msg-${index}-${msg.slice(0,10)}`} // 添加唯一组合key
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
        
        <form onSubmit={handleChatSubmit} className="flex gap-2">
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
      </section>

      {/* 新增：月度总结测试部分 */}
      <section className="space-y-4">
        <h2 className="text-xl font-bold">月度总结测试</h2>
        
        <div className="space-y-2">
          <div className="flex items-center gap-4">
            <Button 
              onClick={handleGenerateSummary}
              disabled={isGenerating}
            >
              {isGenerating ? '生成中...' : '生成月度总结'}
            </Button>
            {generationProgress > 0 && (
              <Progress value={generationProgress} className="w-[200px]" />
            )}
          </div>
          
          {error && (
            <div className="text-red-500 text-sm">{error}</div>
          )}
        </div>

        <div className="h-[400px] border rounded-lg bg-background p-4">
          <ScrollArea className="h-full">
            <div className="whitespace-pre-wrap text-sm">
              {summary || (isGenerating && '正在生成总结...')}
            </div>
          </ScrollArea>
        </div>
      </section>

      {/* 新增：推荐测试部分 */}
      <section className="space-y-4">
        <h2 className="text-xl font-bold">推荐测试</h2>
        
        <div className="space-y-2">
          <div className="flex items-center gap-4">
            <Button 
              onClick={handleGetRecommendations}
              disabled={loadingRecommendations}
            >
              {loadingRecommendations ? '获取中...' : '获取推荐'}
            </Button>
          </div>
          
          {recommendationError && (
            <div className="text-red-500 text-sm">{recommendationError}</div>
          )}
        </div>

        <div className="h-[300px] border rounded-lg bg-background p-4">
          <ScrollArea className="h-full">
            <div className="space-y-2 text-sm">
              {recommendations.map((item, index) => (
                <div 
                  key={`rec-${index}-${item.slice(0,10)}`}
                  className="p-2 rounded bg-muted/50"
                >
                  {item}
                </div>
              ))}
              {loadingRecommendations && (
                <div className="text-muted-foreground animate-pulse">
                  正在加载推荐...
                </div>
              )}
            </div>
          </ScrollArea>
        </div>
      </section>
    </div>
  )
} 