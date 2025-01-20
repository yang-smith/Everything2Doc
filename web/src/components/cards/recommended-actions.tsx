"use client"

import * as React from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { ScrollArea } from '@/components/ui/scroll-area'
import { FileText, Calendar, ListTodo, HelpCircle, BookOpen, ArrowRight, FileBarChart, MessageSquareQuote } from 'lucide-react'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'

interface Action {
  id: string
  title: string
  description: string
  icon: React.ElementType
  onClick: () => void
}

const actions: Action[] = [
  {
    id: 'knowledge-extract',
    title: '知识提取',
    description: '从对话中提取关键知识点，形成知识卡片',
    icon: BookOpen,
    onClick: () => console.log('Extract knowledge')
  },
  {
    id: 'summary-generate',
    title: '总结生成',
    description: '生成对话内容的精要总结，突出重点',
    icon: FileBarChart,
    onClick: () => console.log('Generate summary')
  },
  {
    id: 'task-identify',
    title: '任务识别',
    description: '识别对话中的任务和待办事项',
    icon: ListTodo,
    onClick: () => console.log('Identify tasks')
  },
  {
    id: 'quote-collect',
    title: '月度报告',
    description: '生成最近一个月的月度报告',
    icon: MessageSquareQuote,
    onClick: () => console.log('Collect quotes')
  }
]

export function RecommendedActions() {
  const [hoveredAction, setHoveredAction] = React.useState<string | null>(null)

  return (
    <div className="h-full flex flex-col p-4">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-lg font-medium">推荐操作</h2>
        </div>
      </div>

      <ScrollArea className="flex-1 -mx-4 px-4">
        <div className="grid gap-4">
          {actions.map((action) => (
            <Card
              key={action.id}
              className={cn(
                "relative overflow-hidden transition-all duration-300",
                "hover:shadow-md hover:bg-accent/5",
                hoveredAction === action.id && "ring-1 ring-primary/10"
              )}
              onMouseEnter={() => setHoveredAction(action.id)}
              onMouseLeave={() => setHoveredAction(null)}
            >
              <motion.div
                className="absolute inset-0 bg-gradient-to-r from-primary/5 to-transparent"
                initial={{ x: '-100%' }}
                animate={{
                  x: hoveredAction === action.id ? '0%' : '-100%'
                }}
                transition={{ type: 'spring', stiffness: 100, damping: 20 }}
              />
              <button
                onClick={action.onClick}
                className="relative w-full text-left p-4"
              >
                <div className="flex items-start gap-4">
                  <div className="mt-1">
                    <action.icon className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-medium leading-none mb-1">
                      {action.title}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {action.description}
                    </p>
                  </div>
                  <ArrowRight 
                    className={cn(
                      "h-5 w-5 transition-opacity duration-300",
                      hoveredAction === action.id ? "opacity-100" : "opacity-0"
                    )}
                  />
                </div>
              </button>
            </Card>
          ))}
        </div>
      </ScrollArea>
    </div>
  )
} 