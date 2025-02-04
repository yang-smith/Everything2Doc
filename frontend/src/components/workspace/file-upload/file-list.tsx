import { FileText } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { X } from "lucide-react"


interface FileListProps {
    files: File[]
    onRemove: (file: File) => void
    uploadProgress?: Record<string, number>
  }
  
  export function FileList({ files, onRemove, uploadProgress = {} }: FileListProps) {
    return (
      <div className="mt-6 space-y-4">
        {files.map((file, index) => (
          <div
            key={index}
            className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
          >
            <div className="flex items-center gap-3">
              <FileText className="h-6 w-6 text-blue-500" />
              <div>
                <p className="text-sm font-medium">{file.name}</p>
                <p className="text-xs text-gray-500">
                  {(file.size / 1024).toFixed(2)} KB
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              {uploadProgress[file.name] !== undefined && (
                <Progress value={uploadProgress[file.name]} className="w-24" />
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onRemove(file)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        ))}
      </div>
    )
  }