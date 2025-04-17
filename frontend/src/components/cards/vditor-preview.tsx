"use client";

import { useEffect, useState, useRef, useCallback } from 'react'
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { ChevronLeft, Loader2, FileDown, AlertTriangle, FileText, Sparkles, Image, Printer, Share2, Copy, Check, MoreHorizontal } from "lucide-react"
import { useProjectStore } from "@/stores/project"
import Vditor from 'vditor'
import 'vditor/dist/index.css'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { toast } from "@/hooks/use-toast"
import { MarkdownBeautifier } from "@/components/markdown-beautifier"
import DocumentParser from "@/components/document-phraser"
import { toPng } from 'html-to-image'

interface VditorPreviewProps {
  content: string
  isLoading: boolean
  error?: string
  onBack: () => void
  onContentChange?: (newContent: string) => void
}

export function VditorPreview({ content, isLoading, error, onBack, onContentChange }: VditorPreviewProps) {
  const currentProjectId = useProjectStore(state => state.currentProjectId)
  const [vditor, setVditor] = useState<Vditor | null>(null)
  const [beautifiedHtml, setBeautifiedHtml] = useState<string>("")
  const [showBeautified, setShowBeautified] = useState(false)
  const [lastContent, setLastContent] = useState<string>("")
  const contentRef = useRef<HTMLDivElement>(null)
  const [showSimpleBeautifier, setShowSimpleBeautifier] = useState(true)
  const [beautifyMode, setBeautifyMode] = useState<'mobile' | 'desktop' | 'apple-notes' | 'minimal-gray' | 'imperial'>('minimal-gray')

  const initializeVditor = () => {
    const element = document.getElementById("vditor-preview")
    if (!element) {
      console.error("vditor-preview 元素不存在，无法初始化编辑器")
      return null
    }
    
    try {
      if (vditor) {
        vditor.destroy()
      }
      
      const instance = new Vditor("vditor-preview", {
        after: () => {
          instance.setValue(content)
          setLastContent(content)
        },
        input: (value) => {
          if (onContentChange) {
            onContentChange(value)
          }
          setLastContent(value)
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
      
      return instance
    } catch (error) {
      console.error("初始化Vditor时出错:", error)
      return null
    }
  }

  const handleReturnToEditor = () => {
    setShowSimpleBeautifier(false)
    
    setTimeout(() => {
      const instance = initializeVditor()
      if (instance) {
        setVditor(instance)
      }
    }, 100)
  }

  const handleBeautifyDocument = () => {
    if (vditor) {
      setLastContent(vditor.getValue())
      vditor.destroy()
      setVditor(null)
    }
    
    setShowSimpleBeautifier(true)
    setBeautifiedHtml("")
    setShowBeautified(false)
  }

  const handleDownloadMarkdown = () => {
    const docContent = lastContent || vditor?.getValue() || content
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

  const isDocumentFormat = (text: string) => {
    if (!text) return false;
    // Check in the first 5 lines of content for document format indicators
    const firstFewLines = text.split('\n').slice(0, 5).join('\n');
    return firstFewLines.includes('<document name>') || firstFewLines.includes('<title>');
  }

  const handleExportImage = useCallback(async () => {
    try {
      // Check if we're using DocumentParser or MarkdownBeautifier
      const isDocFormat = isDocumentFormat(lastContent || content);
      
      // Select the appropriate element based on content type
      const targetSelector = isDocFormat ? '.document-phraser' : '.markdown-card-container';
      const targetElement = document.querySelector(targetSelector);
      
      if (!targetElement) {
        throw new Error(`无法找到要导出的内容元素 (${targetSelector})`);
      }
      
      const originalStyle = targetElement.getAttribute('style') || '';
      
      // 特别处理热门标签和关键词标签的字体大小
      const heatBadges = targetElement.querySelectorAll('.heatlevel-badge');
      const keywordBadges = targetElement.querySelectorAll('.keyword-badge');
      
      // 保存原始样式
      const originalStyles = new Map();
      
      // 设置热度标签样式
      heatBadges.forEach((badge, i) => {
        originalStyles.set(`heatlevel-${i}`, badge.getAttribute('style') || '');
        badge.setAttribute('style', 'font-size: 0.75rem !important; white-space: nowrap !important; display: inline-flex !important;');
      });
      
      // 设置关键词标签样式
      keywordBadges.forEach((badge, i) => {
        originalStyles.set(`keyword-${i}`, badge.getAttribute('style') || '');
        badge.setAttribute('style', 'font-size: 0.75rem !important; white-space: nowrap !important; display: inline-flex !important;');
      });
      
      targetElement.setAttribute('style', `${originalStyle}; margin: 0 !important;`);
      
      toast({
        title: "正在导出图片",
        description: "请稍候...",
      });
      
      // 增加等待时间确保样式应用
      await new Promise(resolve => setTimeout(resolve, 300));
      
      const dataUrl = await toPng(targetElement as HTMLElement);
      
      // 恢复原始样式
      targetElement.setAttribute('style', originalStyle);
      
      // 恢复标签样式
      heatBadges.forEach((badge, i) => {
        badge.setAttribute('style', originalStyles.get(`heatlevel-${i}`) || '');
      });
      
      keywordBadges.forEach((badge, i) => {
        badge.setAttribute('style', originalStyles.get(`keyword-${i}`) || '');
      });
      
      const link = document.createElement('a');
      link.download = `document-${currentProjectId?.slice(0, 8) || 'untitled'}.png`;
      link.href = dataUrl;
      link.click();
      
      toast({
        title: "导出成功",
        description: "图片已保存",
        duration: 3000,
      });
    } catch (error) {
      console.error('图片导出失败:', error);
      toast({
        title: "导出失败",
        description: error instanceof Error ? error.message : "未知错误",
        variant: "destructive",
      });
    }
  }, [showSimpleBeautifier, currentProjectId, lastContent, content, isDocumentFormat]);

  useEffect(() => {
    return () => {
      if (vditor) {
        vditor.destroy()
        setVditor(null)
      }
    }
  }, [])

  
  
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex flex-col h-full w-full overflow-hidden bg-background"
    >
      <div className="flex items-center justify-between p-4 border-b">
        <Button
          variant="ghost"
          onClick={onBack}
          className="gap-2"
        >
          <ChevronLeft className="h-4 w-4" />
          返回
        </Button>
        
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={showSimpleBeautifier ? handleReturnToEditor : handleBeautifyDocument}
            disabled={isLoading || (showSimpleBeautifier && !content)}
            className="gap-1"
          >
            <>
              <Sparkles className="h-4 w-4" />
              {showSimpleBeautifier ? "编辑" : "完成编辑"}
            </>
          </Button>
          
          {showSimpleBeautifier && (
            <>
              {!isDocumentFormat(lastContent || content) && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm" className="gap-1">
                      <FileText className="h-4 w-4" />
                      切换样式
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuLabel>选择展示风格</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    
                    <DropdownMenuItem 
                      onClick={() => setBeautifyMode('apple-notes')}
                      className={beautifyMode === 'apple-notes' ? 'bg-accent' : ''}
                    >
                      <span className="mr-2">🍎</span>
                      Apple Notes 风格
                    </DropdownMenuItem>
                    
                    <DropdownMenuItem 
                      onClick={() => setBeautifyMode('minimal-gray')}
                      className={beautifyMode === 'minimal-gray' ? 'bg-accent' : ''}
                    >
                      <span className="mr-2">🔳</span>
                      简约高级灰
                    </DropdownMenuItem>
                    
                    <DropdownMenuItem 
                      onClick={() => setBeautifyMode('mobile')}
                      className={beautifyMode === 'mobile' ? 'bg-accent' : ''}
                    >
                      <span className="mr-2">📱</span>
                      移动端样式
                    </DropdownMenuItem>
                    
                    <DropdownMenuItem 
                      onClick={() => setBeautifyMode('imperial')}
                      className={beautifyMode === 'imperial' ? 'bg-accent' : ''}
                    >
                      <span className="mr-2">👑</span>
                      古朴风格
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
              
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="gap-1">
                    <MoreHorizontal className="h-4 w-4" />
                    
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={handleDownloadMarkdown}>
                    <FileDown className="h-4 w-4 mr-2" />
                    下载Markdown
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleExportImage}>
                    <Image className="h-4 w-4 mr-2" />
                    导出为图片
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-auto p-3 document-viewer-content">
        {error ? (
          <div className="flex flex-col items-center justify-center h-full">
            <div className="text-destructive mb-2">
              <AlertTriangle className="h-8 w-8 mx-auto mb-2" />
              <p className="text-center">{error}</p>
            </div>
            <Button variant="outline" onClick={onBack}>返回</Button>
          </div>
        ) : showSimpleBeautifier ? (
          <div ref={contentRef} className="relative h-full p-4">
            {isDocumentFormat(lastContent || content) ? (
              <DocumentParser inputText={lastContent || content} />
            ) : (
              <MarkdownBeautifier 
                markdown={lastContent || content} 
                theme={beautifyMode}
                isMobile={beautifyMode === 'mobile'} 
              />
            )}
          </div>
        ) : (
          <div className="relative h-full">
            <div id="vditor-preview" className="min-h-[500px] w-full" />
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