import { memo, useRef, useEffect, useState, useCallback } from 'react'
import { ChatMessage } from '@/lib/chat-parser'
import { cn } from '@/lib/utils'
import { format, parseISO } from 'date-fns'
import { zhCN } from 'date-fns/locale'
import throttle from 'lodash/throttle'
import { useProjectStore } from '@/stores/project'
import { flushSync } from 'react-dom'

interface MessageListProps {
  messages: ChatMessage[]
}

export const VirtualMessageList = memo(function MessageList({ messages }: MessageListProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [visibleRange, setVisibleRange] = useState({ start: 0, end: 50 })
  const targetMessageTime = useProjectStore(state => state.uiState.targetMessageTime)
  const clearTargetMessage = useProjectStore(state => state.clearTargetMessage)
  const isScrollingRef = useRef(false)
  const itemHeights = useRef<Map<number, number>>(new Map())

  // 计算累计高度的辅助函数
  const getAccumulatedHeight = useCallback((index: number) => {
    let total = 0
    for (let i = 0; i < index; i++) {
      total += itemHeights.current.get(i) || 60 // 默认高度
    }
    return total
  }, [])

  // 添加初始化高度的函数
  const initializeHeights = useCallback(() => {
    if (messages.length === itemHeights.current.size) {
      console.log('Heights already initialized')
      return
    }
    
    console.log('Initializing missing heights')
    messages.forEach((_, index) => {
      if (!itemHeights.current.has(index)) {
        itemHeights.current.set(index, 60)
      }
    })
  }, [messages])

  // 处理滚动事件
  const handleScroll = useCallback(
    throttle(() => {
      if (isScrollingRef.current) {
        console.log('Scroll ignored - program scrolling')
        return
      }

      const container = containerRef.current
      if (!container) return

      const { scrollTop, clientHeight } = container
      console.log('Manual scroll:', { scrollTop, clientHeight })
      
      // 基于累计高度找到开始索引
      let currentHeight = 0
      let start = 0
      while (start < messages.length && currentHeight < scrollTop) {
        currentHeight += itemHeights.current.get(start) || 60
        start++
      }
      start = Math.max(0, start - 5) // 缓冲区

      // 计算结束索引
      let end = start
      currentHeight = getAccumulatedHeight(start)
      while (end < messages.length && currentHeight < scrollTop + clientHeight * 2) {
        currentHeight += itemHeights.current.get(end) || 60
        end++
      }

      setVisibleRange({ start, end })
    }, 50),
    [messages.length, getAccumulatedHeight]
  )

  const scrollToMessage = useCallback((timestamp: string) => {
    console.group('ScrollToMessage')
    const container = containerRef.current
    if (!container) {
      console.log('Container not ready')
      console.groupEnd()
      return
    }

    // 查找目标消息索引
    const targetTime = new Date(timestamp).getTime()
    let targetIndex = 0
    let smallestDiff = Infinity
    
    messages.forEach((msg, index) => {
      const msgTime = new Date(msg.timestamp).getTime()
      const timeDiff = Math.abs(msgTime - targetTime)
      if (timeDiff < smallestDiff) {
        smallestDiff = timeDiff
        targetIndex = index
      }
    })

    // 确保所有消息都有高度记录
    initializeHeights()

    // 等待下一帧以确保容器尺寸稳定
    setTimeout(() => {
      const containerHeight = container.clientHeight
      const containerWidth = container.clientWidth
      const targetTop = getAccumulatedHeight(targetIndex)
      const targetBottom = targetTop + (itemHeights.current.get(targetIndex) || 60)
      
      console.log('Heights status:', {
        heightMapSize: itemHeights.current.size,
        totalMessages: messages.length,
        targetTop,
        targetBottom,
        containerHeight,
        containerWidth
      })

      // 计算可见范围
      const start = Math.max(0, targetIndex - Math.floor(containerHeight / 60))
      const end = Math.min(
        messages.length,
        targetIndex + Math.ceil(containerHeight / 60)
      )

      // 标记为程序滚动
      isScrollingRef.current = true
      
      // 修改滚动位置设置方式
      requestAnimationFrame(() => {
        // 再次检查容器尺寸
        if (container.clientHeight !== containerHeight) {
          console.warn('Container size changed, retrying...')
          scrollToMessage(timestamp) // 递归重试
          return
        }

        // 先设置visibleRange
        flushSync(() => {
          setVisibleRange({ start, end })
        })

        // 确保DOM更新完成
        requestAnimationFrame(() => {
          const idealPosition = targetTop - (containerHeight - (targetBottom - targetTop)) / 2
          console.log('Setting scroll position:', { idealPosition })
          container.scrollTop = idealPosition
          
          // 强制布局同步
          container.getBoundingClientRect()

          // 高亮处理
          const messageElements = container.getElementsByClassName('message-item')
          const relativeIndex = targetIndex - start
          const targetElement = messageElements[relativeIndex]
          
          if (targetElement) {
            targetElement.classList.add('highlight-message')
            setTimeout(() => {
              targetElement.classList.remove('highlight-message')
            }, 2000)
          }

          setTimeout(() => {
            isScrollingRef.current = false
            console.log('Scroll flag reset')
            console.groupEnd()
          }, 100)
        })
      })
    }, 0) // 使用setTimeout确保在下一个事件循环执行
  }, [messages, getAccumulatedHeight, initializeHeights])

  useEffect(() => {
    if (targetMessageTime) {
      requestAnimationFrame(() => {
        scrollToMessage(targetMessageTime)
        clearTargetMessage()
      })
    }
  }, [targetMessageTime, scrollToMessage, clearTargetMessage])

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    container.addEventListener('scroll', handleScroll)
    return () => container.removeEventListener('scroll', handleScroll)
  }, [handleScroll])

  // 在useEffect中初始化
  useEffect(() => {
    initializeHeights()
  }, [initializeHeights])

  // 渲染消息
  const renderMessage = (message: ChatMessage, index: number) => {
    const prevMessage = messages[index - 1]
    const isSequential = prevMessage?.username === message.username
    const time = format(parseISO(message.timestamp), 'yyyy-MM-dd HH:mm', { locale: zhCN })

    return (
      <div 
        key={index}
        ref={(el) => {
          if (el) {
            const height = el.getBoundingClientRect().height
            itemHeights.current.set(index, height)
          }
        }}
        className={cn(
          "message-item px-6 py-1 hover:bg-muted/30 transition-colors",
          "transition-all duration-300"
        )}
      >
        {!isSequential && (
          <div className="text-[11px] text-muted-foreground/60 mb-1.5 mt-2">
            <span className="font-medium text-muted-foreground/70">{message.username}</span>
            <span className="ml-2">{time}</span>
          </div>
        )}

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
        <div style={{ 
          height: `${Array.from({length: visibleRange.start})
            .reduce<number>((sum, _, i) => sum + (itemHeights.current.get(i) || 60), 0)}px` 
        }} />
      )}

      {/* 可视区域消息 */}
      {messages
        .slice(visibleRange.start, visibleRange.end)
        .map((message, index) => renderMessage(message, index + visibleRange.start))}

      {/* 下部空白占位 */}
      {visibleRange.end < messages.length && (
        <div style={{ 
          height: `${Array.from({length: messages.length - visibleRange.end})
            .reduce<number>((sum, _, i) => sum + (itemHeights.current.get(i + visibleRange.end) || 60), 0)}px` 
        }} />
      )}
    </div>
  )
})
