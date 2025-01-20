'use client'

import * as React from 'react'
import { motion } from "framer-motion"
import { format, parseISO } from "date-fns"
import { zhCN } from "date-fns/locale"
import { cn } from "@/lib/utils"
import { KnowledgeCard } from './knowledge-card'
import { MessageCircle, Clock } from 'lucide-react'

interface TimelineNode {
  id: string
  timestamp: string
  tags: string[]
  summary: string
  details: string[]
  supplement: string
  category: 'concept' | 'code' | 'reference'
  type: 'major' | 'minor'
}

interface TimelineSummary {
  totalTime: string
  messageCount: number
  description?: string
}

export function Timeline({ 
  data,
  summary 
}: { 
  data?: TimelineNode[]
  summary?: TimelineSummary 
}) {
  const defaultSummary = {
    totalTime: '45分钟',
    messageCount: 12,
    description: '这是一份关于余村社区在地群聊天的聊天记录，大家主要在其中讨论活动等等'
  }
  
  const currentSummary = summary || defaultSummary

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
          {/* 描述文本 */}
          <p className="text-sm text-primary/80 mb-3">
            {currentSummary.description}
          </p>
          
          {/* 分隔线 */}
          <div className="h-px bg-primary/10 mb-3" />
          
          {/* 统计信息 */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-primary/60" />
              <span className="text-sm text-primary/80">
                对话时长 {currentSummary.totalTime}
              </span>
            </div>

            <div className="h-4 w-px bg-primary/10" />

            <div className="flex items-center gap-2">
              <MessageCircle className="w-4 h-4 text-primary/60" />
              <span className="text-sm text-primary/80">
                {currentSummary.messageCount} 条记录
              </span>
            </div>
          </div>
        </div>
      </motion.div>

      {/* 时间线 */}
      <div 
        className="absolute left-9 top-0 bottom-0 w-[1px] bg-gradient-to-b from-border/40 via-border/20 to-transparent"
      />
      {data && data.map((node, index) => (
        <motion.div
          key={node.id}
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
            className="relative"
          >
            {/* 时间点 */}
            <div className="absolute left-0 flex items-center justify-center w-6 h-6">
              <div className="w-2 h-2 rounded-full bg-primary/60 ring-4 ring-background" />
            </div>

            {/* 时间戳 */}
            <div className="ml-12 text-xs text-muted-foreground mb-2">
              {formatTimestamp(node.timestamp)}
            </div>

            {/* 知识卡片 */}
            <KnowledgeCard {...node} />
          </motion.div>
        ))}
      </div>
  )
}

