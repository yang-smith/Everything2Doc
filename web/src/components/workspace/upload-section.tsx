import { useState } from "react"
import { Button } from "@/components/ui/button"
import { UploadArea } from "./file-upload/upload-area"
import { FileList } from "./file-upload/file-list"
import { useToast } from "@/hooks/use-toast"
import { api } from "@/lib/api"
import { Input } from "@/components/ui/input"

interface UploadSectionProps {
  onComplete: (projectId: string) => void;
}

interface FileStatus {
  file: File;
  progress: number;
  status: 'pending' | 'uploading' | 'completed' | 'error';
  error?: string;
}

export function UploadSection({ onComplete }: UploadSectionProps) {
  const [files, setFiles] = useState<FileStatus[]>([]);
  const [projectName, setProjectName] = useState<string>("");
  const [uploading, setUploading] = useState(false);
  const { toast } = useToast();

  const handleFilesSelected = (newFiles: File[]) => {
    const fileStatuses = newFiles.map(file => ({
      file,
      progress: 0,
      status: 'pending' as const
    }));
    setFiles(prev => [...prev, ...fileStatuses]);
  };

  const updateFileStatus = (file: File, updates: Partial<FileStatus>) => {
    setFiles(prev => prev.map(status => 
      status.file === file ? { ...status, ...updates } : status
    ));
  };

  const handleUpload = async () => {
    if (!files.length) return;
    
    setUploading(true);
    try {
    // 1. 创建项目
    const name = projectName || files[0].file.name.replace(/\.[^/.]+$/, "");
    const projectId = await api.createProject(name);
    console.log('Got project ID:', projectId);

    // 2. 逐个上传文件
    let allSuccessful = true;
    for (const fileStatus of files) {
      if (fileStatus.status === 'completed') continue;

      try {
        updateFileStatus(fileStatus.file, { status: 'uploading' });
        
        await api.uploadFile(
          projectId, 
          fileStatus.file,
          (progress) => updateFileStatus(fileStatus.file, { progress })
        );

        console.log('File uploaded:', fileStatus.file.name);

        updateFileStatus(fileStatus.file, { 
          status: 'completed', 
          progress: 100 
        });
      } catch (error) {
        allSuccessful = false;
        updateFileStatus(fileStatus.file, { 
          status: 'error',
          error: error instanceof Error ? error.message : '上传失败'
        });
        
        toast({
          title: `文件 ${fileStatus.file.name} 上传失败`,
          description: "请重试",
          variant: "destructive",
        });
      }
    }

    // 3. 如果所有文件都上传成功，调用完成回调
    if (allSuccessful) {
      console.log('All files uploaded successfully');
      onComplete(projectId);
      console.log('Called onComplete');
    }
    } catch (error) {
      toast({
        title: "创建项目失败",
        description: "请稍后重试",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="rounded-lg border bg-card p-6">
        <h2 className="text-lg font-semibold mb-4">上传文件</h2>
        
        <div className="space-y-4">
          <Input
            placeholder="你想生成什么类型的文档？"
            value={projectName}
            onChange={(e) => setProjectName(e.target.value)}
          />
          
          <UploadArea 
            onFilesSelected={handleFilesSelected}
            accept=".txt"
            multiple={true}
          />
        </div>
        
        {files.length > 0 && (
          <>
            <FileList 
              files={files.map(f => f.file)}
              onRemove={(file) => {
                setFiles(prev => prev.filter(f => f.file !== file));
              }}
            />
            
            <div className="mt-4 flex justify-end">
              <Button
                onClick={handleUpload}
                disabled={uploading}
              >
                {uploading ? "上传中..." : "开始上传"}
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}