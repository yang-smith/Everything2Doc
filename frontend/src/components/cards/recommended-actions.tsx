"use client"

import * as React from 'react'
import { Card } from '@/components/ui/card'
import { ScrollArea } from '@/components/ui/scroll-area'
import { FileBarChart, ArrowRight } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useEffect, useState } from 'react'
import { api } from '@/lib/api'
import { useProjectStore } from '@/stores/project'

// Add fixed recommendations
const RECOMMENDATIONS = [
  {
    id: 'summary',
    title: '生成精华日报',
    description: '智能分析群聊内容，自动提取重要信息，生成结构化的每日精华摘要'
  },
  {
    id: 'knowledge',
    title: '生成干货文档',
    description: '自动识别群聊中的知识要点，提取有价值内容，整理成系统化的学习文档'
  }
] as const

export function RecommendedActions({ 
  projectId, 
  onActionClick 
}: { 
  projectId: string
  onActionClick: (action: string) => void
}) {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  const setRecommendations = useProjectStore(state => state.setRecommendations)
  const allRecommendations = useProjectStore(state => state.recommendations)
  const recommendations = allRecommendations[projectId] || []

  useEffect(() => {
    let mounted = true

    const loadRecommendations = async () => {
      if (recommendations.length > 0) {
        setLoading(false)
        return
      }

      try {
        setLoading(true)
        const data = await api.getProjectRecommendation(projectId)
        if (mounted) {
          setRecommendations(projectId, data)
        }
      } catch (err) {
        if (mounted) {
          setError(err instanceof Error ? err.message : '获取推荐失败')
        }
      } finally {
        if (mounted) {
          setLoading(false)
        }
      }
    }

    loadRecommendations()

    return () => {
      mounted = false
    }
  }, [projectId, setRecommendations, recommendations.length])

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="h-full flex flex-col p-6 bg-gradient-to-br from-background to-background/80"
    >
      <motion.div 
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="flex items-center justify-between mb-8"
      >
        <div>
          <h2 className="text-xl font-semibold bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text text-transparent">
            AI助手
          </h2>
        </div>
      </motion.div>

      <ScrollArea className="flex-1 -mx-6 px-6">
        <AnimatePresence mode="wait">
          <motion.div className="grid gap-4">
            {RECOMMENDATIONS.map((recommendation, index) => (
              <motion.div
                key={recommendation.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card className="group relative overflow-hidden transition-all duration-300 hover:shadow-lg hover:bg-accent/5 border border-border/50">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => onActionClick(recommendation.id)}
                    className="relative w-full text-left p-6"
                  >
                    <div className="flex items-start gap-4">
                      <motion.div 
                        className="mt-1 p-2 rounded-full bg-primary/5"
                        whileHover={{ rotate: 15 }}
                      >
                        <FileBarChart className="h-6 w-6 text-primary" />
                      </motion.div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-base font-medium leading-tight mb-1">
                          {recommendation.title}
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          {recommendation.description}
                        </p>
                      </div>
                      <motion.div
                        initial={{ x: -10, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        className="text-primary"
                      >
                        <ArrowRight className="h-5 w-5 transition-transform duration-300 group-hover:translate-x-1" />
                      </motion.div>
                    </div>
                  </motion.button>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        </AnimatePresence>
      </ScrollArea>
    </motion.div>
  )
} 