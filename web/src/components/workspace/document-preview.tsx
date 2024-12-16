import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import { OutputDocument } from "@/types/workspace"
import { api } from "@/lib/api"
import { useToast } from "@/hooks/use-toast"

interface DocumentPreviewProps {
  documentId: string;
  onBack: () => void;
}

export function DocumentPreview({
  documentId,
  onBack
}: DocumentPreviewProps) {
  const [document, setDocument] = useState<OutputDocument | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    const loadDocument = async () => {
      try {
        const doc = await api.getDocument(documentId);
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
  }, [documentId]);

  if (!document) {
    return <div>加载中...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Button variant="ghost" size="sm" onClick={onBack}>
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
        <h1 className="text-2xl font-bold mb-6">{document.title}</h1>
        
        <div className="prose prose-sm max-w-none">
          {document.content}
        </div>
      </div>
    </div>
  )
}