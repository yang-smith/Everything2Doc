'use client'

import * as React from 'react'
import { motion, AnimatePresence } from "framer-motion"
import { cn } from "@/lib/utils"
import { FileText, Lightbulb, MessageSquare, ChevronDown } from "lucide-react"

interface KnowledgeCardProps {
  summary: string
  tags: string[]
  details: string[]
  supplement?: string
  category: 'concept' | 'code' | 'reference'
  type: 'major' | 'minor'
}

const categoryIcons = {
  concept: Lightbulb,
  code: FileText,
  reference: MessageSquare
} as const

export function KnowledgeCard({
  summary,
  tags,
  details,
  supplement,
  category,
  type
}: KnowledgeCardProps) {
  const [isExpanded, setIsExpanded] = React.useState(false)

  return (
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
          {React.createElement(categoryIcons[category], { 
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
            <div className="space-y-2 text-sm text-muted-foreground/80">
              {details.map((detail, i) => (
                <p key={i} className="leading-relaxed">
                  {detail}
                </p>
              ))}
              {supplement && (
                <p className="text-xs text-muted-foreground/60 border-t border-border/20 pt-2">
                  {supplement}
                </p>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

