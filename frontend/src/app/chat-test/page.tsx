"use client"

import { useState, useRef, useEffect, useId } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { api } from '@/lib/api'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Progress } from '@/components/ui/progress'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import mermaid from 'mermaid'
import { Components } from 'react-markdown'

const DOC_TYPES = [
  {
    value: 'meeting_minutes',
    label: '会议纪要1'
  },
  {
    value: 'project_summary',
    label: '项目总结'
  },
  {
    value: '需求文档',
    label: '需求文档'
  },
  {
    value: 'tech_proposal',
    label: '技术方案'
  },
  {
    value: 'issue_record',
    label: '问题记录'
  }
] as const

type DocType = typeof DOC_TYPES[number]['value']

const AI_MODELS = [
  {
    value: 'qwen/qwen-turbo',
    label: 'Qwen Turbo'
  },
  {
    value: 'deepseek/deepseek-r1-distill-llama-70b',
    label: 'Deepseek R1 Distill 70B'
  },
  {
    value: 'deepseek/deepseek-r1',
    label: 'Deepseek R1'
  },
  {
    value: 'deepseek/deepseek-chat',
    label: 'Deepseek Chat'
  },
  {
    value: 'openai/gpt-4o-2024-11-20',
    label: 'GPT-4O'
  },
  {
    value: 'anthropic/claude-3.5-haiku-20241022',
    label: 'Claude 3.5 Haiku'
  }
] as const

type AIModel = typeof AI_MODELS[number]['value']

// 初始化 mermaid
mermaid.initialize({
  startOnLoad: true,
  theme: 'default',
})

// Mermaid 组件
const MermaidDiagram = ({ content }: { content: string }) => {
  const elementId = `mermaid-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`

  useEffect(() => {
    mermaid.run({
      nodes: document.querySelectorAll(`#${elementId}`)
    })
  }, [elementId, content])

  return (
    <div id={elementId} className="mermaid">
      {content}
    </div>
  )
}

export default function ChatTestPage() {
  // 聊天相关状态
  const [messages, setMessages] = useState<string[]>([])
  const [prompt, setPrompt] = useState('')  // 新增prompt输入状态
  const [chatHistory, setChatHistory] = useState('')  // 新增聊天记录状态
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
  
  // 新增文档生成相关状态
  const [docContent, setDocContent] = useState('')
  const [docProgress, setDocProgress] = useState(0)
  const [isGeneratingDoc, setIsGeneratingDoc] = useState(false)
  const [docError, setDocError] = useState('')
  
  const [selectedDocType, setSelectedDocType] = useState<DocType>('meeting_minutes')
  const [selectedModel, setSelectedModel] = useState<AIModel>('deepseek/deepseek-r1-distill-llama-70b')
  
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
    if ((!prompt.trim() && !chatHistory.trim()) || isStreaming) return

    const combinedInput = `${prompt.trim()}\n\n聊天记录：\n${chatHistory.trim()}`
    
    // setMessages(prev => [...prev, `用户输入:\n提示词: ${prompt}\n聊天记录: ${chatHistory}`])
    setIsStreaming(true)
    let responseText = ''
    
    try {
      const eventSource = api.createChatStream(combinedInput, selectedModel)
      
      eventSource.onmessage = (event) => {
        try {
          // 首先检查是否是完成信号
          if (event.data === '[DONE]') {
            eventSource.close()
            setIsStreaming(false)
            return
          }

          // 然后尝试解析JSON数据
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

          // 处理内容块
          if (data.content) {
            responseText += data.content
            setMessages(prev => [...prev.slice(0, -1), `${responseText}`])
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
    
    // 保留输入内容，方便调整
    // setPrompt('')
    // setChatHistory('')
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

  // 新增：处理文档生成
  const handleGenerateDoc = async () => {
    if (isGeneratingDoc) return
    
    setIsGeneratingDoc(true)
    setDocError('')
    setDocContent('')
    setDocProgress(0)

    try {
      const eventSource = api.createDocStream(
        'd44c4112-0987-4a1b-a7e2-1dd2f4f8e55a', 
        selectedDocType
      )

      eventSource.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data)
          
          if (data.progress) {
            setDocProgress(data.progress)
          }
          
          if (data.content) {
            setDocContent(prev => prev + data.content)
          }
          
          if (data.error) {
            setDocError(data.error)
            eventSource.close()
          }
          
          if (event.data === '[DONE]') {
            eventSource.close()
            setIsGeneratingDoc(false)
          }
        } catch (err) {
          console.error('Error parsing stream data:', err)
        }
      }

      eventSource.onerror = (err) => {
        console.error('Doc stream error:', err)
        setDocError('生成中断，请重试')
        eventSource.close()
        setIsGeneratingDoc(false)
      }
    } catch (err) {
      console.error('Error starting generation:', err)
      setDocError('无法开始生成')
      setIsGeneratingDoc(false)
    }
  }

  return (
    <div className="container max-w-4xl mx-auto p-4 space-y-6">
      {/* 聊天测试部分 */}
      <section className="space-y-4">
        <h2 className="text-xl font-bold">聊天测试</h2>
        
        {/* 添加模型选择 */}
        <div className="w-full">
          <label className="text-sm font-medium block mb-2">
            选择模型
          </label>
          <Select
            value={selectedModel}
            onValueChange={(value: AIModel) => setSelectedModel(value)}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="选择AI模型" />
            </SelectTrigger>
            <SelectContent>
              {AI_MODELS.map(({ value, label }) => (
                <SelectItem key={value} value={value}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="h-[400px] border rounded-lg bg-background p-4">
          <ScrollArea ref={scrollRef} className="h-full">
            <div className="space-y-4">
              {messages.map((msg, index) => (
                <div 
                  key={`msg-${index}-${msg.slice(0,10)}`}
                  className="text-sm prose prose-sm max-w-none dark:prose-invert"
                >
                  <ReactMarkdown
                    remarkPlugins={[remarkGfm]}
                    components={{
                      // 支持 mermaid 图表
                      code: ({ node, className, children, ...props }) => {
                        const match = /language-(\w+)/.exec(className || '')
                        if (match && match[1] === 'mermaid') {
                          return <MermaidDiagram content={String(children).trim()} />
                        }
                        return <code className={className} {...props}>{children}</code>
                      },
                      // 优化表格样式
                      table: ({ children }) => {
                        return (
                          <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                              {children}
                            </table>
                          </div>
                        )
                      }
                    }}
                  >
                    {msg}
                  </ReactMarkdown>
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
        
        <form onSubmit={handleChatSubmit} className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">
              提示词（用于指导AI如何处理聊天记录）
            </label>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="例如：请将以下聊天记录整理成会议纪要..."
              disabled={isStreaming}
              className="w-full h-32 px-3 py-2 border rounded-md"
            />
          </div>
          
          <div className="space-y-2">
            <label className="text-sm font-medium">
              聊天记录
            </label>
            <textarea
              value={chatHistory}
              onChange={(e) => setChatHistory(e.target.value)}
              placeholder="粘贴需要处理的聊天记录..."
              disabled={isStreaming}
              className="w-full h-32 px-3 py-2 border rounded-md"
            />
          </div>
          
          <Button type="submit" disabled={isStreaming} className="w-full">
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

      {/* 简化的文档生成测试部分 */}
      <section className="space-y-4">
        <h2 className="text-xl font-bold">文档生成测试</h2>
        
        <div className="space-y-2">
          <div className="flex items-center gap-4">
            <Select
              value={selectedDocType}
              onValueChange={(value: DocType) => setSelectedDocType(value)}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="选择文档类型" />
              </SelectTrigger>
              <SelectContent>
                {DOC_TYPES.map(({ value, label }) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <Button 
              onClick={handleGenerateDoc}
              disabled={isGeneratingDoc}
              className="min-w-[120px]"
            >
              {isGeneratingDoc ? '生成中...' : '生成文档'}
            </Button>
            
            {docProgress > 0 && (
              <Progress value={docProgress} className="w-[200px]" />
            )}
          </div>
          
          {docError && (
            <div className="text-red-500 text-sm">{docError}</div>
          )}
        </div>

        <div className="h-[400px] border rounded-lg bg-background p-4">
          <ScrollArea className="h-full">
            <div className="whitespace-pre-wrap text-sm">
              {docContent || (isGeneratingDoc && '正在生成文档...')}
            </div>
          </ScrollArea>
        </div>
      </section>
    </div>
  )
} 