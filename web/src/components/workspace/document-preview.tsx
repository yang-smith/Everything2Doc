import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import { OutputDocument } from "@/types/workspace"
import { api } from "@/lib/api"
import { useToast } from "@/hooks/use-toast"
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { vs } from 'react-syntax-highlighter/dist/esm/styles/prism'

interface DocumentPreviewProps {
  projectId: string;
  onBack: (projectId: string) => void;
}

export function DocumentPreview({
  projectId,
  onBack
}: DocumentPreviewProps) {
  const [document, setDocument] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    const loadDocument = async () => {
      try {
        const doc = await api.getOutputContent(projectId);
        setDocument(doc);
      } catch (error) {
        toast({
          title: "加载失败",
          description: "无法加载文档",
          variant: "destructive",
        });
      }
    };

    loadDocument();
  }, [projectId]);

  if (!document) {
    return <div>加载中...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Button variant="ghost" size="sm" onClick={() => onBack(projectId)}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          返回
        </Button>
        
        <div className="flex gap-2">
          <Button variant="outline">
            导出 PDF
          </Button>
          <Button variant="outline">
            导出 Word
          </Button>
        </div>
      </div>

      <div className="rounded-lg border bg-card p-6">
        <div className="prose prose-neutral max-w-none dark:prose-invert 
          prose-h1:text-2xl prose-h1:font-bold prose-h1:mb-4
          prose-h2:text-xl prose-h2:font-semibold prose-h2:mb-3
          prose-h3:text-lg prose-h3:font-medium prose-h3:mb-2
          prose-p:text-base prose-p:leading-7 prose-p:my-2
          prose-ul:my-2 prose-li:my-0
          prose-code:px-1 prose-code:py-0.5 prose-code:bg-muted prose-code:rounded-md
          prose-pre:p-0 prose-pre:bg-transparent prose-pre:my-2"
        >
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            components={{
              code({node, inline, className, children, ...props}) {
                const match = /language-(\w+)/.exec(className || '')
                return !inline && match ? (
                  <SyntaxHighlighter
                    {...props}
                    style={vs}
                    language={match[1]}
                    PreTag="div"
                    className="rounded-md border"
                  >
                    {String(children).replace(/\n$/, '')}
                  </SyntaxHighlighter>
                ) : (
                  <code {...props} className="bg-muted px-1 py-0.5 rounded-md">
                    {children}
                  </code>
                )
              },
              // 自定义其他 Markdown 元素的样式
              h1: ({node, ...props}) => <h1 {...props} className="text-2xl font-bold mb-4 mt-6" />,
              h2: ({node, ...props}) => <h2 {...props} className="text-xl font-semibold mb-3 mt-5" />,
              h3: ({node, ...props}) => <h3 {...props} className="text-lg font-medium mb-2 mt-4" />,
              p: ({node, ...props}) => <p {...props} className="text-base leading-7 my-2" />,
              ul: ({node, ...props}) => <ul {...props} className="list-disc list-inside my-2 space-y-1" />,
              li: ({node, ...props}) => <li {...props} className="my-1 ml-4" />,
              blockquote: ({node, ...props}) => (
                <blockquote {...props} className="border-l-4 border-muted pl-4 my-2 text-muted-foreground" />
              ),
            }}
          >
            {document}
          </ReactMarkdown>
        </div>
      </div>
    </div>
  )
}