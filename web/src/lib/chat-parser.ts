export interface ChatMessage {
  timestamp: string
  username: string
  content: string
  type: 'text' | 'image' | 'quote' | 'chain' | 'revoke'
  quotedContent?: string
  chainItems?: string[]
}

export function parseChatContent(rawText: string): ChatMessage[] {
  const messages: ChatMessage[] = []
  const lines = rawText.split('\n').filter(line => line.trim())
  
  let currentMessage: Partial<ChatMessage> | null = null
  let chainItems: string[] = []
  
  for (let line of lines) {
    // 匹配时间戳开头的新消息
    const timestampMatch = line.match(/^(\d{4}-\d{2}-\d{2}\s+\d{2}:\d{2}:\d{2})\s+(.+)$/)
    
    if (timestampMatch) {
      // 保存之前的消息
      if (currentMessage?.timestamp) {
        messages.push(currentMessage as ChatMessage)
        chainItems = []
      }
      
      const [_, timestamp, rest] = timestampMatch
      
      // 处理撤回消息
      if (rest.includes('<revokemsg>')) {
        const revokeMatch = rest.match(/<revokemsg>"(.+)" 撤回了一条消息<\/revokemsg>/)
        currentMessage = {
          timestamp,
          username: revokeMatch ? revokeMatch[1] : '',
          content: '撤回了一条消息',
          type: 'revoke'
        }
        continue
      }
      
      // 处理普通消息：分离用户名和内容
      const spaceIndex = rest.indexOf(' ')
      if (spaceIndex === -1) {
        currentMessage = {
          timestamp,
          username: rest,
          content: '',
          type: 'text'
        }
        continue
      }
      
      const username = rest.slice(0, spaceIndex)
      const content = rest.slice(spaceIndex + 1)
      
      currentMessage = {
        timestamp,
        username,
        content,
        type: 'text'
      }
      
      // 处理特殊消息类型
      if (content === '[图片]') {
        currentMessage.type = 'image'
      } else if (content.startsWith('引用:')) {
        currentMessage.type = 'quote'
        const quoteMatch = content.match(/引用:(.+?)：(.+)/)
        if (quoteMatch) {
          currentMessage.quotedContent = quoteMatch[2]
          currentMessage.content = content.substring(content.indexOf('：') + 1)
        }
      } else if (content.includes('#接龙')) {
        currentMessage.type = 'chain'
        chainItems = []
      }
    } else if (currentMessage) {
      // 非时间戳开头的行，追加到当前消息内容
      if (currentMessage.type === 'chain' && line.trim().match(/^\d+\.\s*.+/)) {
        // 处理接龙项目
        chainItems.push(line.trim())
        currentMessage.chainItems = chainItems
      } else {
        // 追加到现有内容
        currentMessage.content = currentMessage.content 
          ? `${currentMessage.content}\n${line.trim()}`
          : line.trim()
      }
    }
  }
  
  // 添加最后一条消息
  if (currentMessage?.timestamp) {
    messages.push(currentMessage as ChatMessage)
  }
  
  return messages
} 