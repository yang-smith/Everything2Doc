"use client"

import * as React from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { ScrollArea } from '@/components/ui/scroll-area'
import { FileText, Calendar, ListTodo, HelpCircle, BookOpen, ArrowRight, FileBarChart, MessageSquareQuote, AlertCircle } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'
import { useEffect, useState, useCallback, useMemo } from 'react'
import { api } from '@/lib/api'
import { useProjectStore } from '@/stores/project'
import { shallow } from 'zustand/shallow'


const ICONS = [
  FileBarChart,  
  BookOpen,      
  ListTodo,      
  Calendar       
] as React.ElementType[]

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
            推荐操作
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            根据当前项目状态推荐的智能操作
          </p>
        </div>
      </motion.div>

      <ScrollArea className="flex-1 -mx-6 px-6">
        <AnimatePresence mode="wait">
          <motion.div className="grid gap-4">
            {loading ? (
              // 加载动画
              Array(4).fill(0).map((_, i) => (
                <motion.div
                  key={`skeleton-${i}`}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1 }}
                >
                  <Card className="animate-pulse bg-gradient-to-r from-card to-card/80">
                    <div className="p-6 h-24" />
                  </Card>
                </motion.div>
              ))
            ) : error ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
              >
                <Card className="border-red-200 bg-red-50/50 backdrop-blur-sm">
                  <div className="p-6 flex items-center gap-3 text-red-600">
                    <AlertCircle className="h-6 w-6" />
                    <span className="font-medium">{error}</span>
                  </div>
                </Card>
              </motion.div>
            ) : (
              recommendations.slice(0, 4).map((action, index) => (
                <motion.div
                  key={action}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Card className="group relative overflow-hidden transition-all duration-300 hover:shadow-lg hover:bg-accent/5 border border-border/50">
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => onActionClick(action)}
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
                            {action}
                          </h3>
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
              ))
            )}
          </motion.div>
        </AnimatePresence>
      </ScrollArea>
    </motion.div>
  )
} 