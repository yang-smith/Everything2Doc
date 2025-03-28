"use client";

import { useEffect, useState, useRef } from 'react'
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { ChevronLeft, Loader2, FileDown, AlertTriangle, FileText, Sparkles } from "lucide-react"
import { useProjectStore } from "@/stores/project"
import Vditor from 'vditor'
import 'vditor/dist/index.css'
import { api } from '@/lib/api'

// AIInlineHtmlRenderer组件
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
  
  // Update content when it changes externally
  useEffect(() => {
    if (vditor && content !== vditor.getValue() && !showBeautified) {
      vditor.setValue(content)
      setLastContent(content) 
    }
  }, [content, vditor, showBeautified])

  // Handle download as Markdown
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

  // Handle beautify document
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

  // Toggle between beautified and original view
  const toggleBeautifiedView = () => {
    if (showBeautified) {
      // 从美化视图切回原始视图
      setShowBeautified(false);
      
      // 强制清理可能存在的Vditor实例
      if (vditor) {
        try {
          vditor.destroy();
        } catch (e) {
          console.error("清理Vditor实例时出错:", e);
        }
        setVditor(undefined);
      }
      
      // 确保DOM已更新
      setTimeout(() => {
        // 检查vditor-preview元素是否存在
        const vditorElement = document.getElementById("vditor-preview");
        if (!vditorElement) {
          console.error("找不到vditor-preview元素");
          return;
        }
        
        // 清空容器内容
        vditorElement.innerHTML = '';
        
        // 完全重新初始化vditor
        console.log("正在重建Vditor，内容长度:", (lastContent || content).length);
        
        try {
          const vditorInstance = new Vditor("vditor-preview", {
            after: () => {
              // 确保有内容可用
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

  // 完全重写PDF导出函数
  const handleDownloadPDF = async () => {
    if (isPdfGenerating) return;
    
    try {
      setIsPdfGenerating(true);
      
      // 动态导入html2pdf.js
      const html2pdf = (await import('html2pdf.js')).default;
      
      // 动态导入DOMPurify - 关键点1：使用DOMPurify处理HTML
      const DOMPurify = require('dompurify');
      
      // 清理HTML配置
      const sanitizeConfig = {
        ADD_TAGS: ['style', 'link', 'meta'],
        ADD_ATTR: ['style', 'charset', 'integrity', 'crossorigin', 'referrerpolicy', 'href', 'rel'],
        WHOLE_DOCUMENT: true,
        ALLOW_UNKNOWN_PROTOCOLS: true
      };
      
      // 创建临时容器 - 关键点2：添加内联样式
      const container = document.createElement('div');
      container.style.width = '800px';
      container.style.padding = '20px';
      container.style.backgroundColor = 'white';
      container.style.fontFamily = 'Arial, sans-serif';
      container.style.lineHeight = '1.6';
      container.style.color = '#333';
      container.style.margin = '0 auto';
      document.body.appendChild(container);

      // 根据当前视图采用不同处理方式
      if (showBeautified) {
        // 处理美化HTML视图 - 关键点3：使用DOMPurify清理HTML
        const sanitizedHtml = DOMPurify.sanitize(beautifiedHtml, sanitizeConfig);
        container.innerHTML = sanitizedHtml;
        
        // 在容器内部为字体图标添加样式
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

        // 添加表格专用样式，增加行高和单元格高度
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
        // 处理Vditor视图
        if (!vditor) {
          throw new Error("Vditor编辑器未初始化");
        }
        
        // 添加Vditor样式内联
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
        
        // 创建div并添加类名
        const vditorContent = document.createElement('div');
        vditorContent.className = 'vditor-reset';
        vditorContent.innerHTML = vditor.getHTML();
        container.appendChild(vditorContent);
      }
      
      // 等待渲染
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // PDF配置选项
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
      
      // 生成PDF
      await html2pdf().from(container).set(opt).save();
      
      // 清理临时元素
      document.body.removeChild(container);
      
    } catch (error) {
      console.error('PDF生成失败:', error);
      alert('PDF生成失败: ' + (error instanceof Error ? error.message : String(error)));
    } finally {
      setIsPdfGenerating(false);
    }
  };

  // Simplified print function
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

  // 在组件卸载时清理
  useEffect(() => {
    return () => {
      if (vditor) {
        vditor.destroy();
      }
    };
  }, []);

  // 修改useEffect，确保在组件挂载和content变化时正确设置vditor内容
  useEffect(() => {
    // 只有在非美化视图时才操作vditor
    if (!showBeautified) {
      if (vditor) {
        // 如果vditor已存在，更新内容
        if (content !== vditor.getValue()) {
          vditor.setValue(content);
          setLastContent(content);
        }
      } else {
        // 初始化vditor
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
          {showBeautified ? (
            // 美化视图中只显示返回原始视图的按钮
            <Button
              variant="outline"
              size="sm"
              onClick={toggleBeautifiedView}
              className="gap-1"
            >
              <FileText className="h-4 w-4" />
              查看原始版本
            </Button>
          ) : (
            // 原始视图中的按钮
            <>
              {beautifiedHtml === "" ? (
                // 没有美化过，显示美化文档按钮
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleBeautifyDocument}
                  disabled={isBeautifying || isLoading || !vditor || !content}
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
                      美化文档
                    </>
                  )}
                </Button>
              ) : (
                // 已经美化过，显示查看美化版本和重新美化两个按钮
                <>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={toggleBeautifiedView}
                    className="gap-1"
                  >
                    <Sparkles className="h-4 w-4" />
                    查看美化版本
                  </Button>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleBeautifyDocument}
                    disabled={isBeautifying || isLoading || !vditor || !content}
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
                        重新美化
                      </>
                    )}
                  </Button>
                </>
              )}
            </>
          )}
          
          <Button
            variant="ghost"
            size="sm"
            onClick={handleDownloadMarkdown}
            className="gap-1"
            disabled={isLoading || !content}
          >
            <FileText className="h-4 w-4" />
            Markdown
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleDownloadPDF}
            disabled={isPdfGenerating || isLoading || !content}
            className="gap-1"
          >
            {isPdfGenerating ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-1" />
                生成中...
              </>
            ) : (
              <>
                <FileDown className="h-4 w-4" />
                PDF
              </>
            )}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={handlePrint}
            disabled={isLoading || !content}
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