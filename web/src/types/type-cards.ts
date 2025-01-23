export interface Message {
    id: string
    content: string
    timestamp: string
    hasQuote?: boolean
  }
  
  export interface ChatDay {
    date: string
    messages: Message[]
  }
  
  export interface TimelineNode {
    id: string
    type: 'major' | 'minor'
    content: string
    category: 'concept' | 'code' | 'reference'
    timestamp: string
    preview: string
    fullContent: string
  }

export type SegmentStatus = 'pending' | 'processing' | 'completed' | 'error'

export interface Segment {
  id: string
  project_id: string
  document_id: string
  segment_index: number
  start_time: string
  end_time: string
  status: SegmentStatus
  error?: string
  content?: string
}

export interface Card {
  id: string
  project_id: string
  document_id: string
  segment_id: string
  summary: string
  details: string
  tags: string[]
  timestamp: string
  category: 'concept' | 'code' | 'reference'
  type: 'major' | 'minor'
}

export interface ProjectOverview {
  totalTime: string
  messageCount: number
  description?: string
}