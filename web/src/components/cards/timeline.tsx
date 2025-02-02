'use client'

import * as React from 'react'
import { motion, AnimatePresence } from "framer-motion"
import { format, parseISO } from "date-fns"
import { zhCN } from "date-fns/locale"
import { cn } from "@/lib/utils"
import { KnowledgeCard } from './knowledge-card'
import { MessageCircle, Clock } from 'lucide-react'
import { useProjectData } from '@/hooks/use-project-data'
import { useState, useEffect } from 'react'
import { api } from '@/lib/api'
import { ProjectOverview } from '@/types/type-cards'


export function Timeline({ 
  projectId
}: { 
  projectId: string
}) {
  const { cards, loading, error } = useProjectData(projectId)
  
  const [summary, setSummary] = useState<ProjectOverview>({
    totalTime: '加载中...',
    messageCount: 0,
    description: '正在加载聊天记录...'
  })

  useEffect(() => {
    let timeoutId: NodeJS.Timeout | null = null
    let isSubscribed = true // 用于处理组件卸载情况

    const fetchSummary = async () => {
      try {
        const data = await api.getProjectOverview(projectId)
        
        // 只在组件仍然挂载时更新状态
        if (!isSubscribed) return

        setSummary({
          totalTime: data.totalTime,
          messageCount: data.messageCount,
          description: data.description === 'processing' 
            ? '正在解析聊天记录...' 
            : data.description
        })

        // 如果还在处理中，3秒后重试
        if (data.description === 'processing') {
          timeoutId = setTimeout(fetchSummary, 3000)
        }
      } catch (error) {
        console.error('Failed to fetch summary:', error)
        if (isSubscribed) {
          setSummary(prev => ({
            ...prev,
            description: '加载失败，请稍后重试'
          }))
        }
      }
    }

    fetchSummary()

    // 清理函数
    return () => {
      isSubscribed = false
      if (timeoutId) {
        clearTimeout(timeoutId)
      }
    }
  }, [projectId])

  const formatTimestamp = (timestamp: string) => {
    try {
      const date = parseISO(timestamp)
      const today = new Date()
      
      if (format(date, 'yyyy-MM-dd') === format(today, 'yyyy-MM-dd')) {
        return format(date, "HH:mm", { locale: zhCN })
      }
      
      return format(date, "MM-dd HH:mm", { locale: zhCN })
    } catch (error) {
      console.error('Invalid timestamp:', timestamp)
      return '时间未知'
    }
  }

  return (
    <div className="h-full flex flex-col">
      {/* 顶部简述卡片 */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex-none px-6 mb-8"
      >
        <div className={cn(
          "rounded-lg p-4",
          "bg-primary/5 dark:bg-primary/10",
          "border border-primary/10",
          "backdrop-blur-sm"
        )}>
          <p className="text-sm text-primary/80 mb-3">
            {summary.description}
          </p>
          
          <div className="h-px bg-primary/10 mb-3" />
          
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-primary/60" />
              <span className="text-sm text-primary/80">
                 {summary.totalTime}
              </span>
            </div>

            <div className="h-4 w-px bg-primary/10" />

            <div className="flex items-center gap-2">
              <MessageCircle className="w-4 h-4 text-primary/60" />
              <span className="text-sm text-primary/80">
                {summary.messageCount} 条记录
              </span>
            </div>
          </div>
        </div>
      </motion.div>

      {/* 时间线 */}
      <div className="relative">
        <div className="absolute left-9 top-0 bottom-0 w-[1px] bg-gradient-to-b from-border/40 via-border/20 to-transparent" />
        
        <AnimatePresence mode="popLayout">
          {/* Show existing cards */}
          {cards.map(card => (
            <KnowledgeCard key={card.id} {...card} />
          ))}
          
          {/* Show error message if there's an error and not loading */}
          {error && !loading && (
            <motion.div 
              key="error-message"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="ml-12 p-4 rounded-lg bg-destructive/10 text-destructive"
            >
              <p className="text-sm">加载失败: {error}</p>
            </motion.div>
          )}

          {/* Show loading skeleton when loading */}
          {loading && (
            <motion.div
              key="loading-skeleton"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="relative mb-4"
            >
              <div className="absolute left-0 flex items-center justify-center w-6 h-6">
                <div className="w-2 h-2 rounded-full bg-muted ring-4 ring-background animate-pulse" />
              </div>
              <div className="ml-12">
                <div className="h-4 w-24 bg-muted rounded animate-pulse mb-2" />
                <div className="h-32 bg-muted rounded-lg animate-pulse" />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}

