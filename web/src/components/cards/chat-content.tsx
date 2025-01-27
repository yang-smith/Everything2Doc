import { useEffect, useState } from 'react'
import { parseChatContent, ChatMessage } from '@/lib/chat-parser'
import { cn } from '@/lib/utils'
import { Image, Quote, ListOrdered } from 'lucide-react'
import { VirtualMessageList } from '@/components/chat/message-list'
import { useChatActions, useChatState, useProjectStore } from '@/stores/project'
import { useRef } from 'react'
import { api } from '@/lib/api'

export function ChatContent({ messageId }: { messageId: string }) {
  const containerRef = useRef<HTMLDivElement>(null)
  const { 
    setChatMessages,
    setChatError
  } = useChatActions()

  const projectId = useProjectStore(state => state.currentProjectId)
  const targetMessageTime = useProjectStore(state => state.uiState.targetMessageTime)
  const [isReady, setIsReady] = useState(false)

  if (!projectId) return null
  const chatState = useChatState(projectId)

  useEffect(() => {
    // 如果已经加载过，标记为ready
    if (chatState?.isLoaded) {
      setIsReady(true)
      return
    }

    // 加载文件内容
    async function loadContent() {
      try {
        if (!projectId) return

        const content = await api.getProjectContent(projectId)
        const messages = parseChatContent(content)
        setChatMessages(projectId, messages)
        setIsReady(true)
      } catch (error) {
        console.error('Failed to load chat content:', error)
      }
    }

    loadContent()
  }, [projectId, chatState?.isLoaded, setChatMessages])

  // 确保组件和消息都准备好后再渲染VirtualMessageList
  if (!chatState?.isLoaded || !isReady) {
    return <div>Loading...</div>
  }

  return (
    <div 
      ref={containerRef} 
      className="h-full w-full"
    >
      <VirtualMessageList
        messages={chatState.messages}
        key={`${isReady}-${targetMessageTime}`}
      />
    </div>
  )
}