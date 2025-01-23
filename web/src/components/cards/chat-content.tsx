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
  if (!projectId) return null
  const chatState = useChatState(projectId)

  useEffect(() => {
    // 如果已经加载过，直接返回
    if (chatState?.isLoaded) return

    // 加载文件内容
    async function loadContent() {
      try {
        if (!projectId) return

        const content = await api.getProjectContent(projectId)
        console.log(content)
        const messages = parseChatContent(content)
        console.log(messages)
        setChatMessages(projectId, messages)
      } catch (error) {
        console.error('Failed to load chat content:', error)
      }
    }

    loadContent()
  }, [projectId, chatState?.isLoaded, setChatMessages])

  if (!chatState?.isLoaded) {
    return <div>Loading...</div>
  }

  return (
    <div 
      ref={containerRef} 
      className="h-full w-full"
    >
      <VirtualMessageList
        messages={chatState.messages}
      />
    </div>
  )
}