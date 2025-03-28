"use client";

import { useEffect, useState, useRef } from 'react'
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { ChevronLeft, Loader2, FileDown, AlertTriangle, FileText, Sparkles, Image, Printer, Share2, Copy, Check } from "lucide-react"
import { useProjectStore } from "@/stores/project"
import Vditor from 'vditor'
import 'vditor/dist/index.css'
import { api } from '@/lib/api'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { toast } from "@/hooks/use-toast"

interface AIInlineHtmlRendererProps {
  htmlContent: string;
}

const AIInlineHtmlRenderer: React.FC<AIInlineHtmlRendererProps> = ({ htmlContent }) => {
  // 配置DOMPurify允许内联样式和style标签
  const sanitizeConfig = {
    ADD_TAGS: ['style', 'link', 'meta'],
    ADD_ATTR: ['style', 'charset', 'integrity', 'crossorigin', 'referrerpolicy', 'href', 'rel'],
    WHOLE_DOCUMENT: true, // 允许完整的HTML文档结构
    ALLOW_UNKNOWN_PROTOCOLS: true
  };
  
  const DOMPurify = require('dompurify');
  
  const sanitizedHtml = DOMPurify.sanitize(htmlContent, sanitizeConfig);
  
  return (
    <div 
      style={{
        fontFamily: 'Arial, sans-serif',
        lineHeight: 1.6,
        color: '#333',
        padding: '20px',
        backgroundColor: '#fff',
        borderRadius: '8px',
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
        maxWidth: '100%',
        margin: '0 auto',
        overflowWrap: 'break-word'
      }}
      dangerouslySetInnerHTML={{ __html: sanitizedHtml }} 
    />
  );
};

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
  const [isBeautifying, setIsBeautifying] = useState(false)
  const [beautifiedHtml, setBeautifiedHtml] = useState<string>("")
  const [showBeautified, setShowBeautified] = useState(false)
  const [lastContent, setLastContent] = useState<string>("")
  const contentRef = useRef<HTMLDivElement>(null)
  const [isImageGenerating, setIsImageGenerating] = useState(false)
  const [isCopying, setIsCopying] = useState(false)
  const [copySuccess, setCopySuccess] = useState(false)

  useEffect(() => {
    const vditorInstance = new Vditor("vditor-preview", {
      after: () => {
        vditorInstance.setValue(content)
        setVditor(vditorInstance)
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
    
    return () => {
      vditor?.destroy()
      setVditor(undefined)
    }
  }, [])
  
  useEffect(() => {
    if (vditor && content !== vditor.getValue() && !showBeautified) {
      vditor.setValue(content)
      setLastContent(content) 
    }
  }, [content, vditor, showBeautified])

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

  const handleBeautifyDocument = async () => {
    if (!vditor || isBeautifying) return
    
    try {
      setIsBeautifying(true)
      const markdownContent = vditor.getValue()
      setLastContent(markdownContent) // 保存当前内容
      
      // 使用Document2HTML API将Markdown转换为美化的HTML
      const response = await api.Document2HTML(markdownContent, 'google/gemini-2.0-flash-001')
      setBeautifiedHtml(response.result)
      setShowBeautified(true)
      
    } catch (error) {
      console.error('文档美化失败:', error)
      alert('文档美化失败，请稍后重试')
    } finally {
      setIsBeautifying(false)
    }
  }

  const toggleBeautifiedView = () => {
    if (showBeautified) {
      setShowBeautified(false);
      
      if (vditor) {
        try {
          vditor.destroy();
        } catch (e) {
          console.error("清理Vditor实例时出错:", e);
        }
        setVditor(undefined);
      }
      
      setTimeout(() => {
        const vditorElement = document.getElementById("vditor-preview");
        if (!vditorElement) {
          console.error("找不到vditor-preview元素");
          return;
        }
        
        vditorElement.innerHTML = '';
        
        console.log("正在重建Vditor，内容长度:", (lastContent || content).length);
        
        try {
          const vditorInstance = new Vditor("vditor-preview", {
            after: () => {
              const contentToSet = lastContent || content || '';
              console.log("设置Vditor内容...");
              vditorInstance.setValue(contentToSet);
              setVditor(vditorInstance);
            },
            input: (value) => {
              if (onContentChange) {
                onContentChange(value);
              }
              setLastContent(value);
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
          });
        } catch (e) {
          console.error("初始化Vditor时出错:", e);
          alert("加载编辑器失败，请刷新页面重试");
        }
      }, 300); 
    } else {
      if (vditor) {
        const currentContent = vditor.getValue();
        setLastContent(currentContent);
      } else {
        console.warn("切换到美化视图时，Vditor实例不存在");
      }
      setShowBeautified(true);
    }
  };

  const handleDownloadPDF = async () => {
    if (isPdfGenerating) return;
    
    try {
      setIsPdfGenerating(true);
      
      const html2pdf = (await import('html2pdf.js')).default;
      
      const DOMPurify = require('dompurify');
      
      const sanitizeConfig = {
        ADD_TAGS: ['style', 'link', 'meta'],
        ADD_ATTR: ['style', 'charset', 'integrity', 'crossorigin', 'referrerpolicy', 'href', 'rel'],
        WHOLE_DOCUMENT: true,
        ALLOW_UNKNOWN_PROTOCOLS: true
      };
      
      const container = document.createElement('div');
      container.style.width = '800px';
      container.style.padding = '20px';
      container.style.backgroundColor = 'white';
      container.style.fontFamily = 'Arial, sans-serif';
      container.style.lineHeight = '1.6';
      container.style.color = '#333';
      container.style.margin = '0 auto';
      document.body.appendChild(container);

      if (showBeautified) {
        const sanitizedHtml = DOMPurify.sanitize(beautifiedHtml, sanitizeConfig);
        container.innerHTML = sanitizedHtml;
        
        const styleEl = document.createElement('style');
        styleEl.textContent = `
          @import url('https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css');
          
          body {
            font-family: 'Helvetica Neue', Arial, sans-serif;
            line-height: 1.7;
            color: #333;
          }
          
          .container {
            width: 100%;
            margin: 0 auto;
            background-color: #fff;
            padding: 20px;
          }
        `;
        container.prepend(styleEl);

        const tableStyleEl = document.createElement('style');
        tableStyleEl.textContent = `
          table {
            width: 100%;
            border-collapse: collapse;
            margin: 20px 0;
            font-size: 14px;
          }
          th, td {
            padding: 12px 15px; /* 增加单元格内边距 */
            border: 1px solid #ddd;
            word-break: keep-all;
            white-space: nowrap;
            line-height: 3; /* 增加行高 */
            min-height: 30px; /* 设置最小高度 */
            vertical-align: middle; /* 垂直居中 */
          }
          th {
            background-color: #f5f5f5;
            font-weight: bold;
            text-align: left;
          }
        `;
        container.prepend(tableStyleEl);
      } 
      else {
        if (!vditor) {
          throw new Error("Vditor编辑器未初始化");
        }
        
        const styleEl = document.createElement('style');
        styleEl.textContent = `
          .vditor-reset {
            font-family: -apple-system,BlinkMacSystemFont,Segoe UI,Helvetica,Arial,sans-serif;
            word-wrap: break-word;
            overflow: auto;
            line-height: 1.5;
            font-size: 16px;
            word-break: break-word;
          }
          /* 其他必要的vditor样式 */
        `;
        container.appendChild(styleEl);
        
        const vditorContent = document.createElement('div');
        vditorContent.className = 'vditor-reset';
        vditorContent.innerHTML = vditor.getHTML();
        container.appendChild(vditorContent);
      }
      
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const opt = {
        margin: [15, 15, 15, 15],
        filename: `document-${currentProjectId?.slice(0, 8) || 'untitled'}.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { 
          scale: 2,
          useCORS: true,
          allowTaint: true,
          logging: true,
          letterRendering: true
        },
        jsPDF: { 
          unit: 'mm', 
          format: 'a4', 
          orientation: 'portrait',
          compress: true,
          hotfixes: ["px_scaling"]
        }
      };
      
      await html2pdf().from(container).set(opt).save();
      
      document.body.removeChild(container);
      
    } catch (error) {
      console.error('PDF生成失败:', error);
      alert('PDF生成失败: ' + (error instanceof Error ? error.message : String(error)));
    } finally {
      setIsPdfGenerating(false);
    }
  };

  const handlePrint = () => {
    if (showBeautified && beautifiedHtml) {
      const printWindow = window.open('', '_blank')
      if (printWindow) {
        printWindow.document.write(`
          <html>
            <head>
              <title>打印文档</title>
              <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css">
              <style>
                body { font-family: system-ui, sans-serif; margin: 0; padding: 20px; }
                @media print {
                  body { padding: 0; }
                }
              </style>
            </head>
            <body>
              ${beautifiedHtml}
              <script>
                setTimeout(function() { window.print(); }, 1000);
              </script>
            </body>
          </html>
        `)
        printWindow.document.close()
      }
    } else if (vditor) {
      const htmlContent = vditor.getHTML()
      const printWindow = window.open('', '_blank')
      if (printWindow) {
        printWindow.document.write(`
          <html>
            <head>
              <title>打印文档</title>
              <link rel="stylesheet" href="/vditor/dist/index.css">
              <style>
                body { font-family: system-ui, sans-serif; margin: 0; padding: 20px; }
                .container { max-width: 800px; margin: 0 auto; }
                @media print {
                  body { padding: 0; }
                }
              </style>
            </head>
            <body>
              <div class="container vditor-reset">
                ${htmlContent}
              </div>
              <script>
                setTimeout(function() { window.print(); }, 1000);
              </script>
            </body>
          </html>
        `)
        printWindow.document.close()
      }
    }
  }

  useEffect(() => {
    return () => {
      if (vditor) {
        vditor.destroy();
      }
    };
  }, []);

  useEffect(() => {
    if (!showBeautified) {
      if (vditor) {
        if (content !== vditor.getValue()) {
          vditor.setValue(content);
          setLastContent(content);
        }
      } else {
        const vditorInstance = new Vditor("vditor-preview", {
          after: () => {
            vditorInstance.setValue(content);
            setVditor(vditorInstance);
            setLastContent(content);
          },
          input: (value) => {
            if (onContentChange) {
              onContentChange(value);
            }
            setLastContent(value);
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
        });
      }
    }
  }, [content, showBeautified]);

  const handleExportImage = async () => {
    if (isImageGenerating) return;
    
    try {
      setIsImageGenerating(true);
      
      const html2canvasModule = await import('html2canvas');
      const html2canvas = html2canvasModule.default;
      
      const targetElement = showBeautified 
        ? document.querySelector('.ai-preview-content') || contentRef.current 
        : document.querySelector('.vditor-content') || document.getElementById('vditor-preview');
        
      if (!targetElement) {
        throw new Error("无法找到要导出的内容元素");
      }
      
      const container = document.createElement('div');
      container.style.width = '1200px'; 
      container.style.padding = '40px';
      container.style.backgroundColor = 'white';
      container.style.position = 'absolute';
      container.style.left = '-9999px';
      container.style.top = '0';
      
      const clone = targetElement.cloneNode(true) as HTMLElement;
      container.appendChild(clone);
      document.body.appendChild(container);
      
      if (showBeautified) {
        clone.style.fontFamily = 'Arial, sans-serif';
        clone.style.lineHeight = '1.6';
        clone.style.color = '#333';
      } else {
        const styleEl = document.createElement('style');
        styleEl.textContent = `
          .vditor-reset {
            font-family: -apple-system,BlinkMacSystemFont,Segoe UI,Helvetica,Arial,sans-serif;
            line-height: 1.5;
            font-size: 16px;
            word-break: break-word;
          }
        `;
        clone.appendChild(styleEl);
      }
      
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const options = {
        scale: 2, 
        logging: false, 
        useCORS: true, 
        allowTaint: true,
        backgroundColor: '#ffffff',
        scrollX: 0,
        scrollY: 0
      };
      
      const canvas = await html2canvas(container, options);
      
      const imageURL = canvas.toDataURL('image/png');
      const a = document.createElement('a');
      a.href = imageURL;
      a.download = `document-${currentProjectId?.slice(0, 8) || 'untitled'}.png`;
      a.click();
      
      document.body.removeChild(container);
      
    } catch (error) {
      console.error('图片生成失败:', error);
      alert('图片生成失败: ' + (error instanceof Error ? error.message : String(error)));
    } finally {
      setIsImageGenerating(false);
    }
  };

  const handleCopyImageToClipboard = async () => {
    if (isCopying) return;
    
    try {
      setIsCopying(true);
      
      const html2canvasModule = await import('html2canvas');
      const html2canvas = html2canvasModule.default;
      
      const targetElement = showBeautified 
        ? document.querySelector('.ai-preview-content') || contentRef.current 
        : document.querySelector('.vditor-content') || document.getElementById('vditor-preview');
        
      if (!targetElement) {
        throw new Error("无法找到要分享的内容元素");
      }
      
      // 创建临时容器以确保正确的样式和布局
      const container = document.createElement('div');
      container.style.width = '1200px';
      container.style.padding = '40px';
      container.style.backgroundColor = 'white';
      container.style.position = 'absolute';
      container.style.left = '-9999px';
      container.style.top = '0';
      
      // 克隆目标内容
      const clone = targetElement.cloneNode(true) as HTMLElement;
      container.appendChild(clone);
      document.body.appendChild(container);
      
      // 应用样式并等待渲染
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // 生成画布
      const canvas = await html2canvas(container, {
        scale: 2,
        logging: false,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff'
      });
      
      // 转换为blob并复制到剪贴板
      canvas.toBlob(async (blob) => {
        if (blob) {
          try {
            // 使用Clipboard API复制图片到剪贴板
            const item = new ClipboardItem({ 'image/png': blob });
            await navigator.clipboard.write([item]);
            
            // 显示成功提示
            setCopySuccess(true);
            setTimeout(() => setCopySuccess(false), 2000);
            
            toast({
              title: "图片已复制到剪贴板",
              description: "现在您可以将图片粘贴到任何支持图片的应用中",
              duration: 3000,
            });
          } catch (err) {
            console.error("复制到剪贴板失败:", err);
            alert("复制到剪贴板失败，请尝试使用导出图片功能");
          }
        } else {
          throw new Error("图片生成失败");
        }
        
        // 清理临时元素
        document.body.removeChild(container);
      }, 'image/png');
      
    } catch (error) {
      console.error('图片生成失败:', error);
      toast({
        title: "无法生成图片",
        description: error instanceof Error ? error.message : String(error),
        variant: "destructive",
      });
    } finally {
      setIsCopying(false);
    }
  };

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
          {/* 美化文档按钮保留在主界面 */}
          <Button
            variant="outline"
            size="sm"
            onClick={showBeautified ? toggleBeautifiedView : handleBeautifyDocument}
            disabled={isBeautifying || isLoading || (!vditor && !beautifiedHtml)}
            className="gap-1"
          >
            {isBeautifying ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-1" />
                美化中...
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4" />
                {showBeautified ? "返回编辑" : "美化文档"}
              </>
            )}
          </Button>
          
          {/* 导出功能下拉菜单 */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="gap-1">
                <Share2 className="h-4 w-4" />
                分享
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>分享与导出</DropdownMenuLabel>
              <DropdownMenuSeparator />
              
              {/* 复制到剪贴板选项 */}
              <DropdownMenuItem 
                onClick={handleCopyImageToClipboard}
                disabled={isCopying || isLoading || (!vditor && !beautifiedHtml)}
              >
                {isCopying ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    处理中...
                  </>
                ) : copySuccess ? (
                  <>
                    <Check className="h-4 w-4 mr-2 text-green-500" />
                    已复制到剪贴板
                  </>
                ) : (
                  <>
                    <Copy className="h-4 w-4 mr-2" />
                    复制为图片
                  </>
                )}
              </DropdownMenuItem>
              
              <DropdownMenuSeparator />
              
              <DropdownMenuLabel className="text-xs text-muted-foreground">导出为文件</DropdownMenuLabel>
              
              {/* Markdown导出选项 */}
              <DropdownMenuItem onClick={handleDownloadMarkdown}>
                <FileText className="h-4 w-4 mr-2" />
                Markdown文件
              </DropdownMenuItem>
              
              {/* PDF导出选项 */}
              <DropdownMenuItem 
                onClick={handleDownloadPDF}
                disabled={isPdfGenerating || isLoading || (!vditor && !beautifiedHtml)}
              >
                {isPdfGenerating ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    生成PDF中...
                  </>
                ) : (
                  <>
                    <FileDown className="h-4 w-4 mr-2" />
                    PDF文件
                  </>
                )}
              </DropdownMenuItem>
              
              {/* 图片下载选项 */}
              <DropdownMenuItem 
                onClick={handleExportImage}
                disabled={isImageGenerating || isLoading || (!vditor && !beautifiedHtml)}
              >
                {isImageGenerating ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    生成图片中...
                  </>
                ) : (
                  <>
                    <Image className="h-4 w-4 mr-2" />
                    下载图片
                  </>
                )}
              </DropdownMenuItem>
              
              {/* 打印选项 */}
              <DropdownMenuItem onClick={handlePrint}>
                <Printer className="h-4 w-4 mr-2" />
                打印
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
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
        ) : showBeautified ? (
          // 显示美化后的HTML内容 - 添加ref
          <div ref={contentRef} className="relative h-full p-4">
            <AIInlineHtmlRenderer htmlContent={beautifiedHtml} />
          </div>
        ) : (
          // 显示原始编辑器内容 - 包装一个带ref的div
          <div className="relative h-full">
            <div id="vditor-preview" className="min-h-[500px] w-full" />
            <div ref={contentRef} style={{ display: 'none' }}>
              {vditor && <div dangerouslySetInnerHTML={{ __html: vditor.getHTML() }} />}
            </div>

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