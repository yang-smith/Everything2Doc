import { useState } from 'react'

  
export function useProjectData(projectId: string) {
 
  const [loading] = useState(false)  // Changed default to false since we're not loading
  const [error] = useState<string | null>(null)


  return {
    loading,
    error
  }
} 