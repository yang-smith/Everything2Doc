'use client'

import * as React from 'react'
import { motion, AnimatePresence } from "framer-motion"
import { cn } from "@/lib/utils"
import { FileText, Lightbulb, MessageSquare, ChevronDown, BookOpen, Code } from "lucide-react"
import { Card } from '@/types/type-cards'
import { format, parseISO } from 'date-fns'
import { zhCN } from 'date-fns/locale'
import { ChatContent } from './chat-content'
import { useProjectStore } from '@/stores/project'
import { Dialog, DialogContent } from "@/components/ui/dialog"

const categoryIcons = {
  concept: BookOpen,
  code: Code,
  reference: FileText
} as const

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

export function KnowledgeCard({
  summary,
  tags,
  details,
  type,
  category,
  timestamp
}: Card) {
  const [isExpanded, setIsExpanded] = React.useState(false)
  const [dialogOpen, setDialogOpen] = React.useState(false)
  const projectId = useProjectStore(state => state.currentProjectId)
  const showChat = useProjectStore(state => state.showChat)

  const handleJumpToMessage = () => {

  }

  return (
    <>
      <div className="relative mb-4">
        {/* Timeline dot */}
        <div className="absolute left-0 flex items-center justify-center w-6 h-6">
          <div className="w-2 h-2 rounded-full bg-primary/60 ring-4 ring-background" />
        </div>
        
        {/* Timestamp */}
        <div className="ml-12 text-xs text-muted-foreground mb-2">
          {formatTimestamp(timestamp)}
        </div>

        <div 
          onClick={() => type === 'major' && setIsExpanded(!isExpanded)}
          className={cn(
            "ml-12 rounded-lg p-4",
            "bg-card/30 dark:bg-card/10",
            "border border-border/40",
            "transition-all duration-200",
            "hover:bg-accent/5",
            type === 'major' && "cursor-pointer"
          )}
        >
          {/* 标题栏 */}
          <div className="flex items-start gap-2">
            {/* 分类图标 */}
            <div className={cn(
              "mt-1 p-1.5 rounded-md",
              "bg-primary/5 text-primary/70"
            )}>
              {React.createElement(categoryIcons['concept'], { 
                className: "w-3.5 h-3.5"
              })}
            </div>

            {/* 摘要 */}
            <div className="flex-1 text-sm font-medium">
              {summary}
            </div>

            {/* 展开/收起图标 */}
            {type === 'major' && (
              <div 
                className={cn(
                  "p-1 rounded-full",
                  "text-muted-foreground/60",
                  "transition-transform duration-200",
                  isExpanded && "rotate-180"
                )}
              >
                <ChevronDown className="w-4 h-4" />
              </div>
            )}
          </div>

          {/* 标签 */}
          <div className="flex flex-wrap gap-1.5 mt-3">
            {tags.map(tag => (
              <span
                key={tag}
                className={cn(
                  "px-2 py-0.5 text-xs rounded-full",
                  "bg-accent/50 text-accent-foreground/70",
                  "transition-colors duration-200",
                  "hover:bg-accent/70 hover:text-accent-foreground"
                )}
              >
                {tag}
              </span>
            ))}
          </div>

          {/* 详情区域 */}
          <AnimatePresence>
            {type === 'major' && isExpanded && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="mt-3 overflow-hidden"
              >
                <div className="space-y-4">
                  {/* Details text */}
                  <div className="text-sm text-muted-foreground/80">
                    {details}
                  </div>
                  
                  {/* Separator line */}
                  <div className="h-px bg-border/40" />
                  
                  {/* Jump to message button */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      showChat()
                    }}
                    className={cn(
                      "flex items-center gap-2 text-xs",
                      "text-muted-foreground/60 hover:text-muted-foreground/80",
                      "transition-colors duration-200",
                      "group"
                    )}
                  >
                    <MessageSquare className="w-3 h-3" />
                    <span>查看原文</span>
                    <div className={cn(
                      "h-px flex-1 bg-border/40",
                      "group-hover:bg-border/60",
                      "transition-colors duration-200"
                    )} />
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </>
  )
}

