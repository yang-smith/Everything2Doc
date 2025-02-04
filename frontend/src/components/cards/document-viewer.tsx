'use client'

import { motion, AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui/button"
import { ChevronLeft, Loader2, Pencil, Save, X, FileDown } from "lucide-react"
import ReactMarkdown from 'react-markdown'
import { cn } from "@/lib/utils"
import { useProjectStore } from "@/stores/project"
import { useState, useEffect, useRef } from "react"
import { Textarea } from '@/components/ui/textarea'
import remarkGfm from 'remark-gfm'
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'

interface DocumentViewerProps {
  content: string
  isLoading: boolean
  error?: string
  onBack: () => void
  onContentChange?: (newContent: string) => void
}

export function DocumentViewer({ content, isLoading, error, onBack, onContentChange }: DocumentViewerProps) {
  const currentProjectId = useProjectStore(state => state.currentProjectId)
  const [isEditing, setIsEditing] = useState(false)
  const [editContent, setEditContent] = useState(content)
  const viewerRef = useRef<HTMLDivElement>(null)
  const editorRef = useRef<HTMLTextAreaElement>(null)

  const editor = useEditor({
    extensions: [StarterKit],
    content: content,
    editorProps: {
      attributes: {
        class: 'prose prose-sm max-w-none p-4 focus:outline-none'
      }
    },
    onUpdate: ({ editor }) => {
      setEditContent(editor.getText())  
    }
  })

  // Sync content when prop changes
  useEffect(() => {
    setEditContent(content)
  }, [content])

  // Update editor content when prop changes
  useEffect(() => {
    if (editor && content) {
      editor.commands.setContent(content)
    }
  }, [content, editor])

  // Handle edit mode toggle
  const handleEditToggle = () => {
    if (isEditing) {
      // If canceling edit, reset content
      setEditContent(content)
    }
    setIsEditing(!isEditing)
  }

  // Handle content save
  const handleSave = () => {
    onContentChange?.(editContent)
    setIsEditing(false)
  }

  const handleExportPDF = async () => {
    if (!viewerRef.current) return
    
    try {
      // 动态导入 html2pdf.js
      const html2pdf = (await import('html2pdf.js')).default
      
      const element = viewerRef.current
      const opt = {
        margin: 1,
        filename: 'document.pdf',
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2 },
        jsPDF: { unit: 'in', format: 'letter', orientation: 'portrait' }
      }
      
      await html2pdf().set(opt).from(element).save()
    } catch (err) {
      console.error('PDF export failed:', err)
    }
  }

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
              {/* Toolbar */}
              <div className="flex items-center justify-between p-2 border-b">
                <div className="flex items-center gap-2">
                  {isEditing ? (
                    <>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleSave}
                        className="gap-1"
                      >
                        <Save className="h-4 w-4" />
                        保存
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleEditToggle}
                        className="gap-1"
                      >
                        <X className="h-4 w-4" />
                        取消
                      </Button>
                    </>
                  ) : (
                    <>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleEditToggle}
                        className="gap-1"
                      >
                        <Pencil className="h-4 w-4" />
                        编辑
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleExportPDF}
                        className="gap-1"
                      >
                        <FileDown className="h-4 w-4" />
                        导出PDF
                      </Button>
                    </>
                  )}
                </div>
              </div>

              {/* Content area */}
              {isEditing ? (
                <div className="p-4">
                  <Textarea
                    value={editContent}
                    onChange={(e) => setEditContent(e.target.value)}
                    className="min-h-[500px] w-full resize-none font-mono text-sm"
                  />
                </div>
              ) : (
                <div ref={viewerRef} className="p-4">
                  <ReactMarkdown
                    remarkPlugins={[remarkGfm]}
                    className="prose max-w-none prose-headings:font-bold prose-h1:text-2xl prose-h2:text-xl prose-h3:text-lg"
                  >
                    {content}
                  </ReactMarkdown>
                </div>
              )}

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