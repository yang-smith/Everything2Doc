// 项目状态
export type ProjectStatus = 
  | 'draft'      // 初始状态，可以上传文件
  | 'processing' // 正在处理
  | 'completed'  // 处理完成

// 项目
export interface Project {
  id: string
  name: string
  status: ProjectStatus
  createdAt: string
  updatedAt: string
  user_id: string
}

// 输入文档
export interface InputDocument {
  id: string
  projectId: string
  filename: string
  fileSize: number
  status: 'uploaded' | 'processed'
  createdAt: string
}

// 大纲章节
export interface OutlineSection {
  id: string
  title: string
  content?: string
}

// 大纲
export interface Outline {
  id: string
  projectId: string
  title: string
  sections: OutlineSection[]
  status: 'generating' | 'generated'
  createdAt: string
  updatedAt: string
}

// 输出文档
export interface OutputDocument {
  id: string
  projectId: string
  title: string
  content: string
  status: 'generating' | 'completed'
  createdAt: string
  updatedAt: string
}
