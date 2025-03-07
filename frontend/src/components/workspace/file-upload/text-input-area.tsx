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
  const [fileName, setFileName] = useState("pasted-content.txt")
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
    <div className="space-y-4 mt-6 border rounded-lg p-4">
      <div className="flex items-center gap-2">
        <FileText className="h-5 w-5 text-gray-500" />
        <h3 className="font-medium">粘贴文本内容</h3>
      </div>
      
      <div className="grid gap-3">
        <div className="grid grid-cols-12 gap-2">
          <div className="col-span-4">
            <input
              type="text"
              value={fileName}
              onChange={(e) => setFileName(e.target.value)}
              className="w-full px-3 py-2 border rounded-md text-sm"
              placeholder="文件名称"
            />
          </div>
          <div className="col-span-8 flex justify-end">
            <Button 
              onClick={handleSubmit}
              disabled={isSubmitting || !text.trim()}
              className="px-4"
            >
              {isSubmitting ? "处理中..." : "创建文件"}
            </Button>
          </div>
        </div>
        
        <Textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="在此粘贴或输入文本内容..."
          className="min-h-[200px] resize-y"
        />
        
        <p className="text-xs text-gray-500">
          输入的内容将被转换为TXT文件并上传
        </p>
      </div>
    </div>
  )
} 