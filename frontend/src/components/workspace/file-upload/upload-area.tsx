"use client"

import { useCallback, useState } from "react"
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
  const [isUploading, setIsUploading] = useState(false)

  const onDrop = useCallback(async (acceptedFiles: File[], rejectedFiles: any[]) => {
    // 处理被拒绝的文件
    if (rejectedFiles.length > 0) {
      rejectedFiles.forEach(({ file, errors }) => {
        const errorMessages = errors.map((error: FileError) => {
          if (error.code === 'file-too-large') {
            return '文件大小超过限制(50MB)'
          }
          if (error.code === 'file-invalid-type') {
            return '仅支持 .txt 和 .csv 格式文件'
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
      try {
        const processedFiles = await Promise.all(
          acceptedFiles.map(async (file) => {
            // 如果是CSV文件，转换为文本
            if (file.type === 'text/csv' || file.name.endsWith('.csv')) {
              return await convertCsvToText(file);
            }
            return file;
          })
        );
        
        onFilesSelected(processedFiles);
      } catch (error) {
        console.error('文件处理失败:', error);
      }
    }
  }, [onFilesSelected, toast])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'text/plain': ['.txt'],
      'text/csv': ['.csv']
    },
    maxSize: 50 * 1024 * 1024,
    multiple: multiple,
    disabled: isUploading
  })

  const convertCsvToText = async (file: File): Promise<File> => {
    try {
      setIsUploading(true);
      toast({
        title: `正在处理CSV文件`,
        description: "请稍候...",
      });
      
      // 读取CSV文件内容
      const text = await file.text();
      const lines = text.split('\n');
      
      // 跳过CSV表头
      if (lines.length <= 1) {
        throw new Error("CSV文件格式不正确或为空");
      }
      
      // 解析CSV并转换为自定义文本格式
      let outputText = '';
      const headerLine = lines[0];
      const headers = headerLine.split(',');
      
      // 查找关键列的索引
      const createTimeIndex = headers.findIndex(h => h.trim() === 'CreateTime');
      const talkerIndex = headers.findIndex(h => h.trim() === 'talker');
      const msgIndex = headers.findIndex(h => h.trim() === 'msg');
      
      if (createTimeIndex === -1 || talkerIndex === -1 || msgIndex === -1) {
        throw new Error("CSV文件缺少必要的列(CreateTime, talker或msg)");
      }
      
      // 处理每一行数据
      for (let i = 1; i < lines.length; i++) {
        if (!lines[i].trim()) continue;
        
        // 正确处理CSV中的引号和逗号
        const values = parseCSVLine(lines[i]);
        
        if (values.length <= Math.max(createTimeIndex, talkerIndex, msgIndex)) {
          continue; // 跳过格式不正确的行
        }
        
        const createTime = values[createTimeIndex].replace(/^"|"$/g, '');
        const talker = values[talkerIndex].replace(/^"|"$/g, '');
        let msg = values[msgIndex].replace(/^"|"$/g, '');
        
        // 移除HTML标签和引用标记等
        msg = msg.replace(/<[^>]*>/g, '').replace(/\[引用\].*:/g, '');
        
        // 构建输出行
        if (talker && msg && createTime) {
          outputText += `${createTime} ${talker}\n${msg}\n\n`;
        }
      }
      
      // 创建新的文本文件
      const textBlob = new Blob([outputText], { type: 'text/plain' });
      const textFile = new File(
        [textBlob], 
        file.name.replace('.csv', '.txt'), 
        { type: 'text/plain' }
      );
      
      toast({
        title: `CSV处理完成`,
        description: "已转换为文本格式",
      });

      return textFile;
    } catch (error) {
      console.error('CSV转换失败:', error);
      toast({
        title: `CSV处理失败`,
        description: error instanceof Error ? error.message : "未知错误",
        variant: "destructive",
      });
      throw error;
    } finally {
      setIsUploading(false);
    }
  };

  // 辅助函数：正确解析CSV行（处理引号内的逗号）
  function parseCSVLine(line: string): string[] {
    const result = [];
    let current = '';
    let inQuotes = false;
    
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      
      if (char === '"' && (i === 0 || line[i-1] !== '\\')) {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        result.push(current);
        current = '';
      } else {
        current += char;
      }
    }
    
    if (current) {
      result.push(current);
    }
    
    return result;
  }

  return (
    <div
      {...getRootProps()}
      className={`
        border-2 border-dashed rounded-lg p-8
        ${isDragActive 
          ? 'border-primary bg-primary/5' 
          : isUploading
            ? 'border-gray-300 bg-gray-100 cursor-wait'
            : 'border-gray-200 hover:border-primary/50 hover:bg-gray-50'
        }
        transition-all duration-200 ease-in-out
        ${isUploading ? 'cursor-wait' : 'cursor-pointer'}
      `}
    >
      <input {...getInputProps()} disabled={isUploading} />
      <div className="flex flex-col items-center justify-center gap-4">
        <UploadCloud 
          className={`h-12 w-12 ${
            isDragActive 
              ? 'text-primary' 
              : isUploading
                ? 'text-gray-300'
                : 'text-gray-400'
          }`} 
        />
        <div className="text-center">
          <p className="text-sm text-gray-600">
            {isDragActive
              ? "松开以上传文件"
              : "拖拽文件到这里，或点击选择"}
          </p>
          <p className="text-xs text-gray-500 mt-1">
            支持 .txt 和 .csv 格式，单个文件最大 50MB
          </p>
        </div>
      </div>
    </div>
  )
}