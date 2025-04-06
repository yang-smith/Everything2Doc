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
  
