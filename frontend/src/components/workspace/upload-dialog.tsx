"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { UploadSection } from "@/components/workspace/upload-section"
import { useProjectStore } from "@/stores/project"

interface UploadDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function UploadDialog({ open, onOpenChange }: UploadDialogProps) {
  const setCurrentProject = useProjectStore(state => state.setCurrentProject)
  const fetchProjects = useProjectStore(state => state.fetchProjects)

  const handleUploadComplete = async (projectId: string) => {
    // Update global project state
    setCurrentProject(projectId)
    
    // Refresh projects list
    await fetchProjects()
    
    // Close dialog
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>上传文件</DialogTitle>
        </DialogHeader>
        <UploadSection onComplete={handleUploadComplete} />
      </DialogContent>
    </Dialog>
  )
} 