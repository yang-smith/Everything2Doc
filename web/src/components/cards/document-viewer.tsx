'use client'

import { motion, AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui/button"
import { ChevronLeft, Loader2 } from "lucide-react"
import ReactMarkdown from 'react-markdown'
import { cn } from "@/lib/utils"
import { useProjectStore } from "@/stores/project"

interface DocumentViewerProps {
  content: string
  isLoading: boolean
  error?: string
  onBack: () => void
}

export function DocumentViewer({ content, isLoading, error, onBack }: DocumentViewerProps) {
  const currentProjectId = useProjectStore(state => state.currentProjectId)

  return (
    <AnimatePresence>
      <motion.div
        initial={{ x: '100%' }}
        animate={{ x: 0 }}
        exit={{ x: '100%' }}
        transition={{ type: "spring", damping: 20 }}
        className="absolute inset-0 bg-background overflow-hidden flex flex-col"
      >
        {/* 头部操作栏 */}
        <div className="flex items-center justify-between p-4 border-b">
          <Button
            variant="ghost"
            onClick={onBack}
            className="gap-2"
          >
            <ChevronLeft className="h-4 w-4" />
            返回
          </Button>
          <div className="text-sm text-muted-foreground">
            {currentProjectId?.slice(0, 8)}
          </div>
        </div>

        {/* 内容区域 */}
        <div className="flex-1 overflow-auto p-6 document-viewer-content">
          {error ? (
            <div className="text-red-500 text-center py-4">{error}</div>
          ) : (
            <div className="relative">
              <ReactMarkdown
                className={cn(
                  "prose dark:prose-invert max-w-none",
                  "prose-headings:font-semibold prose-h1:text-2xl",
                  "prose-code:bg-muted/50 prose-code:px-1 prose-code:rounded"
                )}
              >
                {content || "没有生成内容"}
              </ReactMarkdown>
              
              {/* 加载指示器 */}
              {isLoading && (
                <div className="absolute bottom-4 right-4 flex items-center gap-2 text-muted-foreground/60">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span className="text-sm">生成中...</span>
                </div>
              )}
            </div>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  )
} 