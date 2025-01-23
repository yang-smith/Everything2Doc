import { memo, useRef, useEffect, useState, useCallback } from 'react'
import { ChatMessage } from '@/lib/chat-parser'
import { cn } from '@/lib/utils'
import { format, parseISO } from 'date-fns'
import { zhCN } from 'date-fns/locale'
import throttle from 'lodash/throttle'

interface MessageListProps {
  messages: ChatMessage[]
}

export const VirtualMessageList = memo(function MessageList({ messages }: MessageListProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [visibleRange, setVisibleRange] = useState({ start: 0, end: 50 })

  // 节流处理滚动更新
  const handleScroll = useCallback(
    throttle(() => {
      const container = containerRef.current
      if (!container) return

      const { scrollTop, clientHeight, scrollHeight } = container
      const itemHeight = 60
      const bufferItems = 30 // 增加缓冲区大小

      const start = Math.max(0, Math.floor(scrollTop / itemHeight) - bufferItems)
      const end = Math.min(
        messages.length,
        Math.ceil((scrollTop + clientHeight) / itemHeight) + bufferItems
      )

      setVisibleRange({ start, end })
    }, 100), // 100ms 节流
    [messages.length]
  )

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    container.addEventListener('scroll', handleScroll)
    handleScroll() // 初始化可视范围

    return () => container.removeEventListener('scroll', handleScroll)
  }, [handleScroll])

  // 渲染消息
  const renderMessage = (message: ChatMessage, index: number) => {
    const prevMessage = messages[index - 1]
    const isSequential = prevMessage?.username === message.username
    const time = format(parseISO(message.timestamp), 'yyyy-MM-dd HH:mm', { locale: zhCN })

    return (
      <div key={index} className="px-6 py-1 hover:bg-muted/30 transition-colors">
        {/* 用户名和时间 */}
        {!isSequential && (
          <div className="text-[11px] text-muted-foreground/60 mb-1.5 mt-2">
            <span className="font-medium text-muted-foreground/70">{message.username}</span>
            <span className="ml-2">{time}</span>
          </div>
        )}

        {/* 消息内容 */}
        {message.type === 'text' ? (
          <div className={cn(
            "text-sm whitespace-pre-wrap break-words",
            "bg-primary/[0.03] rounded-2xl px-4 py-2.5",
            "max-w-[85%]",
            isSequential && "mt-1"
          )}>
            {message.content}
          </div>
        ) : (
          message.content
        )}
      </div>
    )
  }

  return (
    <div 
      ref={containerRef}
      className="h-full overflow-auto scroll-smooth"
    >
      {/* 上部空白占位 */}
      {visibleRange.start > 0 && (
        <div style={{ height: `${visibleRange.start * 60}px` }} />
      )}

      {/* 可视区域消息 */}
      {messages
        .slice(visibleRange.start, visibleRange.end)
        .map((message, index) => renderMessage(message, index + visibleRange.start))
      }

      {/* 下部空白占位 */}
      {visibleRange.end < messages.length && (
        <div style={{ height: `${(messages.length - visibleRange.end) * 60}px` }} />
      )}
    </div>
  )
})

// SpecialMessage 组件保持不变 