"use client";

import { useEffect, useState } from 'react'
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { ChevronLeft, Loader2, FileDown, AlertTriangle, FileText } from "lucide-react"
import { useProjectStore } from "@/stores/project"
import Vditor from 'vditor'
import 'vditor/dist/index.css'

interface VditorPreviewProps {
  content: string
  isLoading: boolean
  error?: string
  onBack: () => void
  onContentChange?: (newContent: string) => void
}

export function VditorPreview({ content, isLoading, error, onBack, onContentChange }: VditorPreviewProps) {
  const currentProjectId = useProjectStore(state => state.currentProjectId)
  const [vditor, setVditor] = useState<Vditor>()
  const [isPdfGenerating, setIsPdfGenerating] = useState(false)
  
  useEffect(() => {
    const vditorInstance = new Vditor("vditor-preview", {
      after: () => {
        vditorInstance.setValue(content)
        setVditor(vditorInstance)
      },
      input: (value) => {
        if (onContentChange) {
          onContentChange(value)
        }
      },
      height: 500,
      mode: 'wysiwyg',
      theme: 'classic',
      outline: {
        enable: true,
        position: 'left'
      },
      toolbar: [
        'headings', 'bold', 'italic', 'strike', 'line', 'quote', 'list', 'ordered-list', 
        'code', 'inline-code', 'link', 'table', 'undo', 'redo'
      ],
      cache: {
        enable: false
      }
    })
    
    return () => {
      vditor?.destroy()
      setVditor(undefined)
    }
  }, [])
  
  // Update content when it changes externally
  useEffect(() => {
    if (vditor && content !== vditor.getValue()) {
      vditor.setValue(content)
    }
  }, [content, vditor])

  // Handle download as Markdown
  const handleDownloadMarkdown = () => {
    const docContent = vditor?.getValue() || content
    const blob = new Blob([docContent], { type: 'text/markdown' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `document-${currentProjectId?.slice(0, 8) || 'untitled'}.md`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  // Handle download as PDF
  const handleDownloadPDF = async () => {
    if (!vditor || isPdfGenerating) return
    
    try {
      setIsPdfGenerating(true)
      
      // 动态导入 html2pdf
      const html2pdf = (await import('html2pdf.js')).default
      
      // 获取HTML内容
      const htmlContent = vditor.getHTML()
      
      // 创建一个容器元素，用于存放格式化的HTML
      const element = document.createElement('div')
      element.className = 'vditor-reset'
      element.innerHTML = htmlContent
      element.style.padding = '20px'
      element.style.margin = '0'
      element.style.fontSize = '14px'
      
      // 临时添加到DOM以便转换
      document.body.appendChild(element)
      
      // 使用html2pdf配置
      const options = {
        margin: 10,
        filename: `document-${currentProjectId?.slice(0, 8) || 'untitled'}.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
      }
      
      // 转换为PDF并下载
      await html2pdf().from(element).set(options).save()
      
      // 移除临时元素
      document.body.removeChild(element)
    } catch (error) {
      console.error('PDF生成失败:', error)
      alert('PDF生成失败，请稍后重试')
    } finally {
      setIsPdfGenerating(false)
    }
  }

  // Handle print (can be used as another way to generate PDF)
  const handlePrint = () => {
    if (!vditor) return
    
    const htmlContent = vditor.getHTML()
    const printWindow = window.open('', '_blank')
    
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>打印文档</title>
            <link rel="stylesheet" href="/vditor/dist/index.css">
            <style>
              body { font-family: system-ui, sans-serif; padding: 20px; }
              .container { max-width: 800px; margin: 0 auto; }
            </style>
          </head>
          <body>
            <div class="container vditor-reset">
              ${htmlContent}
            </div>
            <script>
              window.onload = function() { window.print(); }
            </script>
          </body>
        </html>
      `)
      printWindow.document.close()
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex flex-col h-full w-full overflow-hidden bg-background"
    >
      {/* Header bar */}
      <div className="flex items-center justify-between p-4 border-b">
        <Button
          variant="ghost"
          onClick={onBack}
          className="gap-2"
        >
          <ChevronLeft className="h-4 w-4" />
          返回
        </Button>
        
        {/* Document action buttons moved to header */}
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleDownloadMarkdown}
            className="gap-1"
          >
            <FileText className="h-4 w-4" />
            Markdown
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleDownloadPDF}
            disabled={isPdfGenerating}
            className="gap-1"
          >
            <FileDown className="h-4 w-4" />
            {isPdfGenerating ? '生成中...' : 'PDF'}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={handlePrint}
            className="gap-1"
          >
            <FileText className="h-4 w-4" />
            打印
          </Button>
        </div>
      </div>

      {/* Content area */}
      <div className="flex-1 overflow-auto p-3 document-viewer-content">
        {error ? (
          <div className="flex flex-col items-center justify-center h-full">
            <div className="text-destructive mb-2">
              <AlertTriangle className="h-8 w-8 mx-auto mb-2" />
              <p className="text-center">{error}</p>
            </div>
            <Button variant="outline" onClick={onBack}>返回</Button>
          </div>
        ) : (
          <div className="relative h-full">
            <div id="vditor-preview" className="min-h-[500px] w-full" />

            {/* Loading indicator */}
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
  )
}