'use client'

import * as React from 'react'
import { Separator } from '@/components/ui/separator'
import { cn } from "@/lib/utils"

interface Message {
  id: string
  content: string
  timestamp: string
  hasQuote?: boolean
}

interface ChatDay {
  date: string
  messages: Message[]
}

interface ChatContentProps {
  data: ChatDay[]
}

export function ChatContent({ data }: ChatContentProps) {
  const messageRefs = React.useRef<{ [key: string]: HTMLDivElement | null }>({})

  React.useEffect(() => {
    const handleScrollToContent = (event: CustomEvent<{ nodeId: string }>) => {
      const { nodeId } = event.detail
      const element = messageRefs.current[nodeId]
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' })
        // Add highlight effect
        element.classList.add('bg-slate-100/50', 'dark:bg-slate-800/50')
        setTimeout(() => {
          element.classList.remove('bg-slate-100/50', 'dark:bg-slate-800/50')
        }, 2000)
      }
    }

    window.addEventListener('scrollToContent', handleScrollToContent as EventListener)
    return () => {
      window.removeEventListener('scrollToContent', handleScrollToContent as EventListener)
    }
  }, [])

  return (
    <div className="max-w-3xl mx-auto p-6 space-y-8">
      {data.map((day, index) => (
        <div key={day.date}>
          {index > 0 && (
            <Separator className="my-8 bg-slate-200/50 dark:bg-slate-800/50" />
          )}
          <div className="space-y-6">
            <div className="text-sm text-muted-foreground">{day.date}</div>
            {day.messages.map((message) => (
              <div
                key={message.id}
                ref={el => { messageRefs.current[message.id] = el }}
                className={cn(
                  "p-4 rounded-xl transition-colors duration-300",
                  message.hasQuote 
                    ? "bg-slate-100/50 dark:bg-slate-800/50" 
                    : "hover:bg-slate-50 dark:hover:bg-slate-800/30"
                )}
              >
                <div className="text-sm text-muted-foreground mb-1">
                  {message.timestamp}
                </div>
                <div className="text-sm">{message.content}</div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}

