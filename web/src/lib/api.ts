import { Outline } from "@/types/workspace";
import { OutputDocument } from "@/types/workspace";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

export type ProcessingStatus = 'pending' | 'processing' | 'completed' | 'error'

export interface OutlineData {
  title: string;
  sections: {
    title: string;
    content?: string;
  }[];
}

export interface ProcessingResult {
  id: string;
  status: ProcessingStatus
  progress: number
  result?: {
    title: string
    content: string
  }
  error?: string;
}

export interface OutlineResult {
  id: string;
  status: 'pending' | 'processing' | 'completed' | 'error';
  outline?: OutlineData;
  error?: string;
}

export const api = {
  // 创建项目
  async createProject(name: string): Promise<string> {
    const response = await fetch(`${API_BASE}/api/projects`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name })
    });

    if (!response.ok) throw new Error('Failed to create project');
    const data = await response.json();
    console.log('Created project:', data);
    return data.id;
  },
 // 上传单个文件
 async uploadFile(projectId: string, file: File, onProgress?: (progress: number) => void): Promise<void> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('projectId', projectId);

    const xhr = new XMLHttpRequest();
    
    await new Promise((resolve, reject) => {
      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable && onProgress) {
          const progress = (event.loaded / event.total) * 100;
          onProgress(progress);
        }
      };

      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          resolve(xhr.response);
        } else {
          reject(new Error('Upload failed'));
        }
      };

      xhr.onerror = () => reject(new Error('Upload failed'));
      
      xhr.open('POST', `${API_BASE}/api/documents`);
      xhr.send(formData);
    });
  },

  // Get processing status
  async getStatus(id: string): Promise<ProcessingResult> {
    const response = await fetch(`${API_BASE}/api/status/${id}`)
    if (!response.ok) {
      throw new Error('Failed to get status')
    }
    return response.json()
  },

  // 开始生成大纲
  async generateOutline(projectId: string): Promise<string> {
    const response = await fetch(`${API_BASE}/api/projects/${projectId}/outline`, {
      method: 'POST',
    });
    
    if (!response.ok) {
      throw new Error('Failed to generate outline');
    }
    
    const data = await response.json();
    if(data.outline) {
      return data.outline;
    } else {
      throw new Error('no outline');
    }
  },

  // 获取大纲生成状态
  async getOutlineStatus(taskId: string): Promise<OutlineResult> {
    const response = await fetch(`${API_BASE}/api/tasks/${taskId}`);
    
    if (!response.ok) {
      throw new Error('Failed to get outline status');
    }
    
    return response.json();
  },

  async updateOutline(projectId: string, content: string): Promise<void> {
    const response = await fetch(`${API_BASE}/api/projects/${projectId}/outline`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to update outline');
    }
  },
  // 获取文档
  async getDocument(documentId: string): Promise<OutputDocument> {
    const response = await fetch(`${API_BASE}/api/documents/${documentId}`);
    if (!response.ok) {
      throw new Error('Failed to get document');
    }
    return response.json();
  }

} 