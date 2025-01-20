import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowLeft, Loader2, CheckCircle, AlertCircle } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { api } from "@/lib/api"

interface ProcessingStatusProps {
  projectId: string
  onComplete: (projectId: string) => void
  onBack: (projectId: string) => void
}

export function ProcessingStatus({
  projectId,
  onComplete,
  onBack
}: ProcessingStatusProps) {
  const [status, setStatus] = useState<'pending' | 'processing' | 'completed' | 'error'>('pending')
  const [progress, setProgress] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const { toast } = useToast()
  console.log("ProcessingStatus rendered:", { projectId, status, progress })
  
  useEffect(() => {
    const checkStatus = async () => {
      try {
        const result = await api.getStatus(projectId)
        setStatus(result.status)
        setProgress(result.progress)
        
        if (result.status === 'error') {
          setError('error')
          toast({
            title: "error",
            description: 'processing error',
            variant: "destructive",
          })
        } else if (result.status === 'completed') {
          onComplete(projectId)
        }
      } catch (error) {
        console.error('Error checking status:', error)
      }
    }

    checkStatus()
    const interval = setInterval(checkStatus, 3000)
    return () => clearInterval(interval)
  }, [projectId, onComplete, toast])

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-lg font-medium">文档处理</CardTitle>
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={() => onBack(projectId)}
          disabled={status === 'processing'}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          返回
        </Button>
      </CardHeader>
      
      <CardContent>
        <div className="space-y-4">
          {/* 进度条和状态 */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                {status === 'processing' && (
                  <Loader2 className="h-4 w-4 animate-spin text-blue-500" />
                )}
                {status === 'completed' && (
                  <CheckCircle className="h-4 w-4 text-green-500" />
                )}
                {status === 'error' && (
                  <AlertCircle className="h-4 w-4 text-red-500" />
                )}
                <span>
                  {status === 'pending' && "准备处理..."}
                  {status === 'processing' && "正在处理文档..."}
                  {status === 'completed' && "处理完成！"}
                  {status === 'error' && error}
                </span>
              </div>
              <span className="font-medium">{progress.toFixed(1)}%</span>
            </div>
            
            <Progress 
              value={progress} 
              className="h-2"
              // 根据状态改变颜色
              variant={
                status === 'error' ? 'destructive' : 
                status === 'completed' ? 'success' : 
                'default'
              }
            />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}