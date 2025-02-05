import { OutputDocument } from "@/types/workspace";
import { Segment, Card, ProjectOverview } from '@/types/type-cards'
import { Project } from '@/types/workspace'

// const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
const API_BASE = 'https://docapi.autumnriver.chat';

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

export interface ProjectCardsResponse {
  cards: Card[];
  status: 'completed' | 'processing';
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

  // 获取文档处理状态
  async getStatus(id: string): Promise<ProcessingResult> {
    const response = await fetch(`${API_BASE}/api/projects/${id}/processing_status`)
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

  async startProcessing(projectId: string): Promise<void> {
    const response = await fetch(`${API_BASE}/api/projects/${projectId}/start_processing`, {
      method: 'POST',
    });
    if (!response.ok) {
      throw new Error('Failed to start processing');
    }
  },
  // 获取文档
  async getDocument(documentId: string): Promise<OutputDocument> {
    const response = await fetch(`${API_BASE}/api/documents/${documentId}`);
    if (!response.ok) {
      throw new Error('Failed to get document');
    }
    return response.json();
  },

  // 获取输出文档内容
  async getOutputContent(projectId: string): Promise<string> {
    const response = await fetch(`${API_BASE}/api/projects/${projectId}/output_content`)
    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Failed to get output content')
    }
    const data = await response.json()
    return data.content
  },

  //cards部分

  async getProjectSegments(projectId: string): Promise<Segment[]> {
    const response = await fetch(`${API_BASE}/api/projects/${projectId}/segments`)
    if (!response.ok) {
      throw new Error('Failed to fetch segments')
    }
    return response.json()
  },

  async getSegmentStatus(segmentId: string): Promise<Segment> {
    const response = await fetch(`${API_BASE}/api/segments/${segmentId}/status`)
    if (!response.ok) {
      throw new Error('Failed to fetch segment status')
    }
    return response.json()
  },

  async getSegmentCards(segmentId: string): Promise<Card[]> {
    const response = await fetch(`${API_BASE}/api/segments/${segmentId}/cards`)
    if (!response.ok) {
      throw new Error('Failed to fetch segment cards')
    }
    const data = await response.json()
    return data.cards
  },

  async getProjectCards(projectId: string): Promise<ProjectCardsResponse> {
    const response = await fetch(`${API_BASE}/api/projects/${projectId}/cards`)
    if (!response.ok) {
      throw new Error('Failed to fetch project cards')
    }
    const data = await response.json()
    return {
      cards: data.cards,
      status: data.status
    }
  },

  async getProjectOverview(projectId: string): Promise<ProjectOverview> {
    const response = await fetch(`${API_BASE}/api/projects/${projectId}/overview`)
    if (!response.ok) {
      throw new Error('Failed to fetch project overview')
    }
    const data = await response.json()
    return data
  },

  async getProjectRecommendation(projectId: string): Promise<string[]> {
    const response = await fetch(`${API_BASE}/api/projects/${projectId}/recommendation`);
    if (!response.ok) {
      throw new Error('Failed to fetch project recommendation');
    }
    const rawData = await response.json();

    const recommendations = Array.isArray(rawData) ? rawData : [rawData];

    const decodeUnicode = (str: string) => 
      str.replace(/\\u([\dA-Fa-f]{4})/g, (_, grp) => 
        String.fromCharCode(parseInt(grp, 16))
      );

    const result =  recommendations
      .flatMap((item: string) => 
        decodeUnicode(item)
          .split('\n')
          .map(line => line
            .replace(/^[\d\u4e00-\u9fa5]+[、.．]\s*/, '')
            .trim()
          )
          .filter(line => line.length > 0)
      )
      .slice(1, 4);
      return [...result, '最近一个月的总结'];
  },

  async getProjects(): Promise<Project[]> {
    const response = await fetch(`${API_BASE}/api/all_projects`)
    if (!response.ok) {
      throw new Error('Failed to fetch projects')
    }
    const data = await response.json()
    return data
  },

  async getProjectContent(projectId: string): Promise<string> {
    const response = await fetch(`${API_BASE}/api/projects/${projectId}/content`)
    if (!response.ok) {
      throw new Error('Failed to fetch project content')
    }
    const data = await response.json()
    return data.content
  },

  createChatStream(message: string) {
    const eventSource = new EventSource(`${API_BASE}/api/chat/stream?message=${encodeURIComponent(message)}`, {
      withCredentials: true
    });
    
    return eventSource;
  }, 
  createMonthSummaryStream(projectId: string, params: {
    start_date?: string;
    end_date?: string;
  }) {
    const url = new URL(`${API_BASE}/api/projects/${projectId}/month_summary_stream`);
    
    // 添加查询参数
    if (params.start_date) {
      url.searchParams.append('start_date', params.start_date);
    }
    if (params.end_date) {
      url.searchParams.append('end_date', params.end_date);
    }

    return new EventSource(url.toString(), {
      withCredentials: true
    });
  },

  createDocStream(projectId: string, docType: string): EventSource {
    const encodedDocType = encodeURIComponent(docType);
    const eventSource = new EventSource(
      `${API_BASE}/api/projects/${projectId}/doc_stream?doc_type=${encodedDocType}`
    );
    return eventSource;
  },
} 