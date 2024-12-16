import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { ArrowLeft, Loader2, CheckCircle, AlertCircle } from "lucide-react"
import { Outline } from "@/types/workspace"
import { api } from "@/lib/api"
import { useToast } from "@/hooks/use-toast"

interface ProcessingStatusProps {
  projectId: string
  outline: Outline
  onComplete: (documentId: string) => void
  onBack: () => void
}

interface ProcessingResult {
  status: 'pending' | 'processing' | 'completed' | 'error'
  progress: number
  error?: string
  documentId?: string
}

export function ProcessingStatus({
  projectId,
  outline,
  onComplete,
  onBack
}: ProcessingStatusProps) {
  const [result, setResult] = useState<ProcessingResult>({
    status: 'pending',
    progress: 0
  })
  const { toast } = useToast()

  useEffect(() => {
    const startProcessing = async () => {
      try {
        const result = await api.generateOutline(projectId)
        setResult({status: 'completed', progress: 100, documentId: result})
      } catch (error) {
        setResult(prev => ({
          ...prev,
          status: 'error',
          error: '处理失败'
        }))
        toast({
          title: "处理失败",
          description: "请稍后重试",
          variant: "destructive"
        })
      }
    }

    startProcessing()
  }, [projectId, outline])

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Button variant="ghost" size="sm" onClick={onBack}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          返回
        </Button>
      </div>

      <div className="rounded-lg border bg-card p-6">
        <h2 className="text-lg font-semibold mb-4">处理进度</h2>

        <div className="space-y-4">
          <div className="flex items-center gap-4">
            {result.status === 'processing' && (
              <Loader2 className="h-5 w-5 animate-spin text-blue-500" />
            )}
            {result.status === 'completed' && (
              <CheckCircle className="h-5 w-5 text-green-500" />
            )}
            {result.status === 'error' && (
              <AlertCircle className="h-5 w-5 text-red-500" />
            )}
            
            <div className="flex-1">
              <Progress value={result.progress} />
            </div>
            
            <div className="text-sm font-medium">
              {result.progress}%
            </div>
          </div>

          {result.error && (
            <p className="text-sm text-red-500">{result.error}</p>
          )}

          <p className="text-sm text-muted-foreground">
            {result.status === 'pending' && "准备处理..."}
            {result.status === 'processing' && "正在处理文档..."}
            {result.status === 'completed' && "处理完成！"}
            {result.status === 'error' && "处理出错"}
          </p>
        </div>
      </div>
    </div>
  )
}