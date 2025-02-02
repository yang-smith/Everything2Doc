"use client"

import { ChatContent } from '@/components/cards/chat-content'
import { Timeline } from '@/components/cards/timeline'
import { RecommendedActions } from '@/components/cards/recommended-actions'
import { useProjectStore } from '@/stores/project'
import { Button } from '@/components/ui/button'
import { UploadDialog } from '@/components/workspace/upload-dialog'
import { Plus, FileUp, X } from 'lucide-react'
import { useState, useCallback, useEffect } from 'react'
import { AnimatePresence, motion } from "framer-motion"
import { DocumentViewer } from '@/components/cards/document-viewer'
import { api } from '@/lib/api'

export default function Page() {
  const currentProjectId = useProjectStore(state => state.currentProjectId)
  const [uploadOpen, setUploadOpen] = useState(false)
  const chatVisible = useProjectStore(state => state.uiState.chatVisible)
  const hideChat = useProjectStore(state => state.hideChat)
  const [documentContent, setDocumentContent] = useState<{
    content: string
    isLoading: boolean
    error?: string
  }>({ content: '', isLoading: false })
  const [leftWidth, setLeftWidth] = useState('55%')
  const [isDragging, setIsDragging] = useState(false)

  const handleStreamDocument = async (actionId: string) => {
    setDocumentContent({ content: '', isLoading: true, error: undefined })
    
    try {
      if(currentProjectId){
        const eventSource = api.createMonthSummaryStream(currentProjectId, {
          start_date: '2024-06-01',
          end_date: '2024-06-30'
        })
        setDocumentContent(prev => ({
          ...prev,
          content: ' ',
          isLoading: true
        }))
        eventSource.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data)
            
            if (data.content) {
              setDocumentContent(prev => ({
                ...prev,
                content: prev.content + data.content,
                isLoading: true
              }))
              
              setTimeout(() => {
                const viewer = document.querySelector('.document-viewer-content')
                if (viewer) {
                  viewer.scrollTop = viewer.scrollHeight
                }
              }, 0)
            }
            
            if (data.error) {
              setDocumentContent(prev => ({
                content: prev.content,
                isLoading: false,
                error: data.error
              }))
              eventSource.close()
            }
            
            if (event.data === '[DONE]') {
              setDocumentContent(prev => ({ ...prev, isLoading: false }))
              eventSource.close()
            }
          } catch (err) {
            console.error('流数据解析错误:', err)
          }
        }
        
        eventSource.onerror = (err) => {
          console.error('文档流错误:', err)
          setDocumentContent(prev => ({
            content: prev.content,
            isLoading: false,
            error: '连接中断，请重试'
          }))
          eventSource.close()
        }
    }
    } catch (err) {
      console.error('创建流失败:', err)
      setDocumentContent({ content: '', isLoading: false, error: '无法启动生成' })
    }
  }

  const handleMouseDown = useCallback(() => {
    setIsDragging(true)
  }, [])

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isDragging) return
    const container = document.querySelector('.cards-container')
    if (container) {
      const { left, width } = container.getBoundingClientRect()
      const newWidth = ((e.clientX - left) / width * 100).toFixed(2) + '%'
      setLeftWidth(newWidth)
    }
  }, [isDragging])

  const handleMouseUp = useCallback(() => {
    setIsDragging(false)
  }, [])

  useEffect(() => {
    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', handleMouseUp)
    return () => {
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
    }
  }, [handleMouseMove, handleMouseUp])

  if (!currentProjectId) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-screen">
        <div className="text-center space-y-4 max-w-md mx-auto p-8">
          <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
            <FileUp className="w-6 h-6 text-primary" />
          </div>
          <h2 className="text-lg font-semibold">没有选择项目</h2>
          <p className="text-sm text-muted-foreground">
            上传一个聊天记录文件开始使用，我们将帮助您将其转换为结构化文档。
          </p>
          <Button 
            onClick={() => setUploadOpen(true)}
            className="gap-2"
          >
            <Plus className="w-4 h-4" />
            新建项目
          </Button>
        </div>

        <UploadDialog 
          open={uploadOpen}
          onOpenChange={setUploadOpen}
        />
      </div>
    )
  }

  return (
    <div className="flex h-[calc(100vh-theme(spacing.16))] cards-container">
      {/* 左侧时间线 */}
      <div 
        className="relative flex flex-col rounded-lg bg-card border shadow-sm"
        style={{ width: leftWidth, minWidth: '400px' }}
      >
        <div className="flex-1 overflow-auto">
          <Timeline projectId={currentProjectId} />
        </div>
        <div 
          className="absolute -right-2 top-0 bottom-0 w-1 cursor-col-resize z-20 hover:bg-primary/30 active:bg-primary/50"
          onMouseDown={handleMouseDown}
        />
      </div>

      {/* 右侧内容区 - 添加 relative 定位 */}
      <div className="flex-1 min-w-0 relative flex flex-col rounded-lg bg-card border shadow-sm ml-4">
<AnimatePresence mode='wait'>
  {documentContent.content ? (
    <DocumentViewer
      key="document-viewer" // 添加唯一key
      content={documentContent.content}
      isLoading={documentContent.isLoading}
      onBack={() => setDocumentContent({ content: '', isLoading: false })}
    />
  ) : !chatVisible ? (
    <main 
      key="recommended-actions" // 添加唯一key
      className="flex-1 overflow-auto"
    >
      <RecommendedActions
        projectId={currentProjectId}
        onActionClick={handleStreamDocument}
      />
    </main>
  ) : null}
</AnimatePresence>

        {/* 覆盖层：聊天内容 */}
        <AnimatePresence>
          {chatVisible && (
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 20 }}
              className="absolute inset-0 bg-background border-l overflow-hidden rounded-lg"
            >
              <div className="flex flex-col h-full">
                <div className="flex justify-between items-center p-4 border-b">
                  <h2 className="text-lg font-medium">聊天记录</h2>
                  <button 
                    onClick={hideChat}
                    className="text-muted-foreground hover:text-foreground"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
                <div className="flex-1 overflow-hidden">
                  <ChatContent messageId={'123'} />
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}

