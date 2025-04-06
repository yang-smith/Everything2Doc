import { OutputDocument } from "@/types/workspace";
import { Project } from '@/types/workspace'

export const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
// const API_BASE = 'https://e2dserver.fly.dev';

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

export const api = {
  // 创建项目
  async createProject(name: string): Promise<string> {
    const token = localStorage.getItem("token");
    if (!token) {
      throw new Error("Token is missing, please login first");
    }
    const response = await fetch(`${API_BASE}/api/projects`, {
      method: 'POST',
      headers: {
        "Authorization": `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
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
    formData.append('project_id', projectId);

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


  async getProjectRecommendation(projectId: string): Promise<string[]> {
    // const response = await fetch(`${API_BASE}/api/projects/${projectId}/recommendation`);
    // if (!response.ok) {
    //   throw new Error('Failed to fetch project recommendation');
    // }
    // const rawData = await response.json();

    // const recommendations = Array.isArray(rawData) ? rawData : [rawData];

    // const decodeUnicode = (str: string) => 
    //   str.replace(/\\u([\dA-Fa-f]{4})/g, (_, grp) => 
    //     String.fromCharCode(parseInt(grp, 16))
    //   );

    // const result =  recommendations
    //   .flatMap((item: string) => 
    //     decodeUnicode(item)
    //       .split('\n')
    //       .map(line => line
    //         .replace(/^[\d\u4e00-\u9fa5]+[、.．]\s*/, '')
    //         .trim()
    //       )
    //       .filter(line => line.length > 0)
    //   )
    //   .slice(1, 4);
      // return [...result, '最近一个月的总结'];
      return ['常见问答文档', '干货文档', '总结文档']
  },

  async getProjects(): Promise<Project[]> {
    const token = localStorage.getItem("token");
    if (!token) {
      throw new Error("Token is missing, please login first");
    }
    const response = await fetch(`${API_BASE}/api/projects`, {
      headers: {
        "Authorization": `Bearer ${token}`,
      },
    });
    if (!response.ok) {
      if (response.status === 403) {
        localStorage.removeItem('token');
        window.location.reload();
        return [];
      }
      throw new Error('Failed to fetch projects');
    }
    const data = await response.json();
    return data;
  },

  async renameProject(projectId: string, newName: string): Promise<Project> {
    const token = localStorage.getItem("token");
    if (!token) {
      throw new Error("Token is missing, please login first");
    }
    const response = await fetch(`${API_BASE}/api/projects/${projectId}`, {
      method: 'PATCH',
      headers: {
        "Authorization": `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ name: newName })
    });
  
    if (!response.ok) throw new Error('Failed to rename project');
    return response.json();
  },

  async getProjectContent(projectId: string): Promise<string> {
    const response = await fetch(`${API_BASE}/api/projects/${projectId}/content`)
    if (!response.ok) {
      throw new Error('Failed to fetch project content')
    }
    const data = await response.json()
    return data.content
  },

  async chat(message: string, model?: string): Promise<{message: string, model: string}> {
    if (!model) {
        model = 'google/gemini-1.5-flash';
    }
      
    const url = new URL(`${API_BASE}/api/chat`);
    
    // 构建查询参数
    const params = new URLSearchParams();
    params.append('message', message);
    params.append('model', model);
    
    const response = await fetch(`${url}?${params.toString()}`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || '聊天请求失败');
    }

    return response.json();
  },


  createChatStream(message: string, model?: string) {
    if(!model){
      model = 'deepseek/deepseek-r1-distill-llama-70b'
    }
    const eventSource = new EventSource(`${API_BASE}/api/chat/stream?message=${encodeURIComponent(message)}&model=${encodeURIComponent(model)}`, {
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

  createDocStream(projectId: string, docType: string, model: string): EventSource {
    let encodedDocType = encodeURIComponent(docType);
    if (docType == '常见问答文档'){
      encodedDocType = 'QA';
    }
    if (docType == '干货文档'){
      encodedDocType = 'knowledge';
    }
    if (docType == '总结文档'){
      encodedDocType = 'summary';
    }
    const eventSource = new EventSource(
      `${API_BASE}/api/chat/${projectId}/doc_stream?doc_type=${encodedDocType}&model=${model}`
    );
    return eventSource;
  },

 
  async Document2HTML(
    document: string, 
    model?: string
  ): Promise<{result: string, model: string}> {
    
    const response = await fetch(`${API_BASE}/api/chat/document-to-html`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify({
        document,
        model
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || '文档处理请求失败');
    }

    const data = await response.json();
    
    // 清理可能存在的HTML代码框
    if (data.result) {
      // 检查是否包含HTML代码框
      const htmlMatch = data.result.match(/```html\s*([\s\S]*?)\s*```/);
      if (htmlMatch) {
        // 如果有HTML代码框，只保留其中的内容
        data.result = htmlMatch[1];
      } else {
        // 检查是否有不带语言标识的代码框
        const noLangMatch = data.result.match(/```\s*([\s\S]*?)\s*```/);
        if (noLangMatch) {
          data.result = noLangMatch[1];
        }
        // 没有代码框的情况下保留原内容
      }
    }

    return data;
  },

  async deleteProject(projectId: string): Promise<{success: boolean, message: string}> {
    const token = localStorage.getItem("token");
    if (!token) {
      throw new Error("Token is missing, please login first");
    }
    const response = await fetch(`${API_BASE}/api/projects/${projectId}`, {
      method: 'DELETE',
      headers: {
        "Authorization": `Bearer ${token}`
      }
    });
  
    if (!response.ok) throw new Error('Failed to delete project');
    return response.json();
  },
} 