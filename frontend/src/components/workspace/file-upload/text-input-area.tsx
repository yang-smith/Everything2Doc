"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"
import { Textarea } from "@/components/ui/textarea"
import { FileText } from "lucide-react"

interface TextInputAreaProps {
  onTextSubmit: (file: File) => void
}

export function TextInputArea({ onTextSubmit }: TextInputAreaProps) {
  const [text, setText] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { toast } = useToast()

  const handleSubmit = () => {
    if (!text.trim()) {
      toast({
        title: "内容不能为空",
        description: "请输入或粘贴文本内容",
        variant: "destructive",
      })
      return
    }

    try {
      setIsSubmitting(true)
      
      // 自动生成文件名 - 使用当前日期时间
      const now = new Date()
      const fileName = `content-${now.getFullYear()}${(now.getMonth()+1).toString().padStart(2, '0')}${now.getDate().toString().padStart(2, '0')}-${now.getHours().toString().padStart(2, '0')}${now.getMinutes().toString().padStart(2, '0')}.txt`
      
      // 创建文本文件
      const blob = new Blob([text], { type: "text/plain" })
      const file = new File([blob], fileName, { type: "text/plain" })
      
      // 调用回调函数
      onTextSubmit(file)
      
      // 成功提示
      toast({
        title: "文本已转换为文件",
        description: `已创建文件: ${fileName}`,
      })
      
      // 重置输入
      setText("")
    } catch (error) {
      console.error("文本转换失败:", error)
      toast({
        title: "文本处理失败",
        description: error instanceof Error ? error.message : "未知错误",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="space-y-3 mt-4 border rounded-lg p-3">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <FileText className="h-5 w-5 text-gray-500" />
          <h3 className="font-medium">粘贴文本内容</h3>
        </div>
        
        <Button 
          onClick={handleSubmit}
          disabled={isSubmitting || !text.trim()}
          size="sm"
          className="px-3"
        >
          {isSubmitting ? "处理中..." : "创建文件"}
        </Button>
      </div>
      
      <div className="grid gap-2">
        <Textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="在此粘贴或输入文本内容..."
          className="min-h-[120px] max-h-[150px] resize-y"
        />
        
        <p className="text-xs text-gray-500">
          输入的内容将被自动命名并转换为TXT文件上传
        </p>
      </div>
    </div>
  )
} 