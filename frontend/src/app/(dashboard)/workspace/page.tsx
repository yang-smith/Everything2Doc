"use client"

import { useState, useCallback } from "react"
import { UploadSection } from "@/components/workspace/upload-section"
import { OutlineEditor } from "@/components/workspace/outline-editor"
import { ProcessingStatus } from "@/components/workspace/processing-status"
import { DocumentPreview } from "@/components/workspace/document-preview"
import { Project, Outline } from "@/types/workspace"

// 简化为纯流程状态
type WorkspaceStatus = "upload" | "outline" | "processing" | "preview"

// 统一管理项目数据
interface WorkspaceData {
  projectId?: string;
  outline?: Outline;
  documentId?: string;
}

export default function WorkspacePage() {
  const [status, setStatus] = useState<WorkspaceStatus>("upload")
  const [data, setData] = useState<WorkspaceData>({})

  const updateWorkspace = useCallback((
    newStatus: WorkspaceStatus, 
    newData: Partial<WorkspaceData>
  ) => {
    // 使用单个 setState 调用来确保原子性更新
    Promise.resolve().then(() => {
      console.log('Updating state:', {
        currentStatus: status,
        currentData: data,
        newStatus,
        newData
      });
      
      setData(prev => ({ ...prev, ...newData }));
      setStatus(newStatus);
    });
  }, [status, data])

  return (
    <div className="space-y-5">
      {status === "upload" && (
        <UploadSection 
          onComplete={(projectId) => {
            console.log('Upload complete with projectId:', projectId);
            updateWorkspace("outline", { projectId });
          }}
        />
      )}

      {status === "outline" && data.projectId && (
        <OutlineEditor
          projectId={data.projectId}
          onComplete={(projectId) => 
            updateWorkspace("processing", {projectId})}
          onBack={(projectId) => 
            updateWorkspace("upload", {projectId})}
        />
      )}

      {status === "processing" && data.projectId && (
        <ProcessingStatus
          projectId={data.projectId}
          onComplete={(projectId) => updateWorkspace("preview", { projectId })}
          onBack={(projectId) => updateWorkspace("outline", { projectId })}
        />
      )}

      {status === "preview" && data.projectId && (
        <DocumentPreview
          projectId={data.projectId}
          onBack={(projectId) => 
            updateWorkspace("processing", { projectId })}
        />
      )}
    </div>
  )
}