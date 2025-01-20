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