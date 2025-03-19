"use client"

import { useState, useEffect } from 'react'
import { RecommendedActions } from '@/components/cards/recommended-actions'
import { VditorPreview } from '@/components/cards/vditor-preview'
import { useProjectStore } from '@/stores/project'
import { api } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'
import { UploadDialog } from '@/components/workspace/upload-dialog'
import { Sidebar } from '@/components/layout/sidebar'

export default function WorkspacePage() {
  const currentProjectId = useProjectStore(state => state.currentProjectId)
  const [uploadOpen, setUploadOpen] = useState(false)
  const [documentContent, setDocumentContent] = useState<{
    content: string
    isLoading: boolean
    error?: string
  }>({ content: '', isLoading: false })
  const [showDocument, setShowDocument] = useState(false)

  const handleStreamDocument = async (actionTitle: string, model: string) => {
    setDocumentContent({ content: '', isLoading: true, error: undefined })
    setShowDocument(true)
    
    try {
      if(currentProjectId){
        let eventSource: EventSource
        eventSource = api.createDocStream(
          currentProjectId,
          actionTitle as any,
          model
        )


        eventSource.onmessage = (event) => {
          try {
            if (event.data === '[DONE]') {
              setDocumentContent(prev => ({
                content: prev.content,
                isLoading: false
              }))
              eventSource.close()
              return
            }
            
            const data = JSON.parse(event.data)
            if (data.content) {
              setDocumentContent(prev => ({
                content: prev.content + data.content,
                isLoading: true
              }))
            }
          } catch (err) {
            console.error('解析文档流错误:', err)
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

        eventSource.addEventListener('done', () => {
          setDocumentContent(prev => ({
            content: prev.content,
            isLoading: false
          }))
          eventSource.close()
        })
      }
    } catch (err) {
      console.error('创建流失败:', err)
      setDocumentContent({ content: '', isLoading: false, error: '无法启动生成' })
    }
  }

  const handleContentChange = (newContent: string) => {
    setDocumentContent(prev => ({
      ...prev,
      content: newContent
    }))
  }

  // 整合原layout.tsx的内容，并修复样式问题
  return (
    <div className="flex h-[calc(100vh-theme(spacing.12))]">
      <Sidebar />
      <div className="flex-1 p-4 overflow-auto">
        <div className="flex flex-col h-full w-full">
          {!showDocument ? (
            <div className="flex flex-col h-full">
              <div className="flex items-center justify-between mb-6">
                <h1 className="text-2xl font-bold">工作区</h1>
                <Button onClick={() => setUploadOpen(true)} className="gap-2">
                  <Plus className="h-4 w-4" />
                  添加项目
                </Button>
              </div>

              {currentProjectId ? (
                <div className="h-full">
                  <div className="rounded-lg border p-4 h-full w-full">
                    <h2 className="text-xl font-semibold mb-4">推荐操作</h2>
                    <RecommendedActions 
                      projectId={currentProjectId} 
                      onActionClick={handleStreamDocument}
                    />
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-center p-8 border rounded-lg">
                  <h2 className="text-xl font-medium mb-2">选择一个项目开始</h2>
                  <p className="text-muted-foreground mb-6">
                    请从左侧选择一个已有项目，或创建新项目
                  </p>
                  <Button onClick={() => setUploadOpen(true)}>
                    创建新项目
                  </Button>
                </div>
              )}
            </div>
          ) : (
            <VditorPreview
              content={documentContent.content}
              isLoading={documentContent.isLoading}
              error={documentContent.error}
              onBack={() => setShowDocument(false)}
              onContentChange={handleContentChange}
            />
          )}

          <UploadDialog 
            open={uploadOpen}
            onOpenChange={setUploadOpen}
          />
        </div>
      </div>
    </div>
  )
}