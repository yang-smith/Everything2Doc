"use client"

import { useCallback } from "react"
import { useDropzone } from "react-dropzone"
import { UploadCloud } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { FileError } from 'react-dropzone'

interface UploadAreaProps {
  onFilesSelected: (files: File[]) => void
  accept?: string
  multiple?: boolean
}

export function UploadArea({ onFilesSelected, accept, multiple }: UploadAreaProps) {
  const { toast } = useToast()

  const onDrop = useCallback((acceptedFiles: File[], rejectedFiles: any[]) => {
    // 处理被拒绝的文件
    if (rejectedFiles.length > 0) {
      rejectedFiles.forEach(({ file, errors }) => {
        const errorMessages = errors.map((error: FileError) => {
          if (error.code === 'file-too-large') {
            return '文件大小超过限制(50MB)'
          }
          if (error.code === 'file-invalid-type') {
            return '仅支持 .txt 格式文件'
          }
          return error.message
        })
        
        toast({
          title: `${file.name} 上传失败`,
          description: errorMessages.join(', '),
          variant: "destructive",
        })
      })
    }

    // 处理接受的文件
    if (acceptedFiles.length > 0) {
      onFilesSelected(acceptedFiles)
    }
  }, [onFilesSelected, toast])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'text/plain': ['.txt']
    },
    maxSize: 50 * 1024 * 1024,
    multiple: multiple
  })

  return (
    <div
      {...getRootProps()}
      className={`
        border-2 border-dashed rounded-lg p-8
        ${isDragActive 
          ? 'border-primary bg-primary/5' 
          : 'border-gray-200 hover:border-primary/50 hover:bg-gray-50'
        }
        transition-all duration-200 ease-in-out
        cursor-pointer
      `}
    >
      <input {...getInputProps()} />
      <div className="flex flex-col items-center justify-center gap-4">
        <UploadCloud 
          className={`h-12 w-12 ${
            isDragActive ? 'text-primary' : 'text-gray-400'
          }`} 
        />
        <div className="text-center">
          <p className="text-sm text-gray-600">
            {isDragActive
              ? "松开以上传文件"
              : "拖拽文件到这里，或点击选择"}
          </p>
          <p className="text-xs text-gray-500 mt-1">
            支持 .txt 格式，单个文件最大 50MB
          </p>
        </div>
      </div>
    </div>
  )
}