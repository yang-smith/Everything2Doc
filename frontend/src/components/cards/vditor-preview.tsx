"use client";

import { useEffect, useState, useRef } from 'react'
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { ChevronLeft, Loader2, FileDown, AlertTriangle, FileText, Sparkles, Image, Printer, Share2, Copy, Check } from "lucide-react"
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
  const [isCopyingMobile, setIsCopyingMobile] = useState(false)
  const [isCopyingDesktop, setIsCopyingDesktop] = useState(false)
  const [copySuccess, setCopySuccess] = useState(false)
  const [showSimpleBeautifier, setShowSimpleBeautifier] = useState(false)
  const [beautifyMode, setBeautifyMode] = useState<'mobile' | 'desktop'>('mobile')

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

  const handleBeautifyDocument = () => {
    setShowSimpleBeautifier(true);
    setBeautifiedHtml(""); // Clear old AI-generated HTML if any
    setShowBeautified(false);
  };

  const toggleBeautifiedView = () => {
    if (showBeautified || showSimpleBeautifier) {
      setShowBeautified(false);
      setShowSimpleBeautifier(false);
      
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
      }
      // Simply show beautifier, no AI call needed
      setShowSimpleBeautifier(true);
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

  const createImage = async (format: 'desktop' | 'mobile') => {
    const html2canvasModule = await import('html2canvas');
    const html2canvas = html2canvasModule.default;
    
    const targetElement = showBeautified 
      ? document.querySelector('.ai-preview-content') || contentRef.current 
      : document.querySelector('.vditor-content') || document.getElementById('vditor-preview');
      
    if (!targetElement) {
      throw new Error("无法找到要导出的内容元素");
    }
    
    // 创建临时容器以确保正确的样式和布局
    const container = document.createElement('div');
    
    // 根据选择的格式设置不同的宽度和样式
    if (format === 'mobile') {
      container.style.width = '600px'; // 移动端更窄的宽度
      container.style.padding = '15px'; // 减少内边距
    } else {
      container.style.width = '1200px'; // 桌面端更宽的宽度
      container.style.padding = '40px'; // 保持原有内边距
    }
    
    container.style.backgroundColor = 'white';
    container.style.position = 'absolute';
    container.style.left = '-9999px';
    container.style.top = '0';
    
    // 克隆目标内容
    const clone = targetElement.cloneNode(true) as HTMLElement;
    container.appendChild(clone);
    document.body.appendChild(container);
    
    // 根据不同格式应用不同样式
    if (format === 'mobile') {
      // 添加移动端优化样式
      const styleEl = document.createElement('style');
      styleEl.textContent = `
        * {
          font-size: 16px !important;
          line-height: 1.8 !important;
        }
        h1 { font-size: 24px !important; }
        h2 { font-size: 22px !important; }
        h3 { font-size: 20px !important; }
        h4, h5, h6 { font-size: 18px !important; }
        p { margin-bottom: 16px !important; }
        pre, code {
          white-space: pre-wrap !important;
          word-break: break-word !important;
          max-width: 100% !important;
          overflow-x: visible !important;
        }
        table {
          width: 100% !important;
          font-size: 14px !important;
          word-break: break-word !important;
          white-space: normal !important;
        }
        img {
          max-width: 100% !important;
          height: auto !important;
        }
      `;
      container.appendChild(styleEl);
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
    document.body.removeChild(container);
    
    return canvas;
  };

  const handleCopyImageToClipboard = async (format: 'desktop' | 'mobile') => {
    if ((format === 'mobile' && isCopyingMobile) || (format === 'desktop' && isCopyingDesktop)) return;
    
    try {
      if (format === 'mobile') {
        setIsCopyingMobile(true);
      } else {
        setIsCopyingDesktop(true);
      }
      
      const canvas = await createImage(format);
      
      canvas.toBlob(async (blob) => {
        if (blob) {
          try {
            const item = new ClipboardItem({ 'image/png': blob });
            await navigator.clipboard.write([item]);
            
            setCopySuccess(true);
            setTimeout(() => setCopySuccess(false), 2000);
            
            toast({
              title: "图片已复制到剪贴板",
              description: `已创建${format === 'mobile' ? '手机友好' : '桌面友好'}版图片`,
              duration: 3000,
            });
          } catch (err) {
            console.error("复制到剪贴板失败:", err);
            alert("复制到剪贴板失败，请尝试使用导出图片功能");
          }
        } else {
          throw new Error("图片生成失败");
        }
      }, 'image/png');
      
    } catch (error) {
      console.error('图片生成失败:', error);
      toast({
        title: "无法生成图片",
        description: error instanceof Error ? error.message : String(error),
        variant: "destructive",
      });
    } finally {
      if (format === 'mobile') {
        setIsCopyingMobile(false);
      } else {
        setIsCopyingDesktop(false);
      }
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
            onClick={showSimpleBeautifier || showBeautified ? toggleBeautifiedView : handleBeautifyDocument}
            disabled={isLoading || (!vditor && !beautifiedHtml)}
            className="gap-1"
          >
            <>
              <Sparkles className="h-4 w-4" />
              {showSimpleBeautifier || showBeautified ? "返回编辑" : "美化文档"}
            </>
          </Button>
          
          {/* 分享功能下拉菜单 - 简化版 */}
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
              
              {/* 简化后的两个直接选项 */}
              <DropdownMenuItem 
                onClick={() => handleCopyImageToClipboard('mobile')}
                disabled={isCopyingMobile || isLoading || (!vditor && !beautifiedHtml)}
              >
                {isCopyingMobile ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    处理中...
                  </>
                ) : (
                  <>
                    <Copy className="h-4 w-4 mr-2" />
                    手机友好图片
                  </>
                )}
              </DropdownMenuItem>
              
              <DropdownMenuItem 
                onClick={() => handleCopyImageToClipboard('desktop')}
                disabled={isCopyingDesktop || isLoading || (!vditor && !beautifiedHtml)}
              >
                {isCopyingDesktop ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    处理中...
                  </>
                ) : (
                  <>
                    <Copy className="h-4 w-4 mr-2" />
                    桌面友好图片
                  </>
                )}
              </DropdownMenuItem>
              
              <DropdownMenuSeparator />
              
              <DropdownMenuLabel className="text-xs text-muted-foreground">导出为文件</DropdownMenuLabel>
              
              {/* 保留其他导出选项不变 */}
              <DropdownMenuItem onClick={handleDownloadMarkdown}>
                <FileText className="h-4 w-4 mr-2" />
                Markdown文件
              </DropdownMenuItem>
              
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
        ) : showSimpleBeautifier ? (
          // New simple beautified content
          <div ref={contentRef} className="relative h-full p-4">
            <MarkdownBeautifier markdown={lastContent || content} theme="mobile" />
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