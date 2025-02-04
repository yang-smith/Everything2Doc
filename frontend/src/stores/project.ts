import { create } from 'zustand'
// import { shallow } from 'zustand/shallow'
import { ChatMessage } from '@/lib/chat-parser'
import { api } from '@/lib/api'

interface ChatState {
  messages: ChatMessage[]
  isLoaded: boolean
  error?: string
}

interface ProjectState {
  currentProjectId: string | null
  setCurrentProject: (id: string) => void
  
  chatStates: Record<string, ChatState>
  
  setChatMessages: (projectId: string, messages: ChatMessage[]) => void
  clearChatMessages: (projectId: string) => void
  setChatError: (projectId: string, error: string) => void
  getChatState: (projectId: string) => ChatState | undefined
  
  uiState: {
    chatVisible: boolean
    targetMessageTime?: string
    timelineWidth: string
  }
  
  showChat: () => void
  hideChat: () => void
  toggleChat: () => void
  scrollToMessage: (timestamp: string) => void
  clearTargetMessage: () => void
  
  recommendations: Record<string, string[]>
  setRecommendations: (projectId: string, recommendations: string[]) => void
  setTimelineWidth: (width: string) => void
}

const initialChatState: ChatState = {
  messages: [],
  isLoaded: false
}

// 将 actions 提取为常量
const chatActions = {
  setChatMessages: (state: ProjectState) => state.setChatMessages,
  clearChatMessages: (state: ProjectState) => state.clearChatMessages,
  setChatError: (state: ProjectState) => state.setChatError,
} as const

export const useProjectStore = create<ProjectState>((set, get) => ({
  currentProjectId: null,
  setCurrentProject: (id) => set({ currentProjectId: id }),
  
  chatStates: {},
  
  setChatMessages: (projectId, messages) => 
    set((state) => ({
      chatStates: {
        ...state.chatStates,
        [projectId]: {
          messages,
          isLoaded: true,
          error: undefined
        }
      }
    })),
    
  clearChatMessages: (projectId) => 
    set((state) => {
      const newChatStates = { ...state.chatStates }
      delete newChatStates[projectId]
      return { chatStates: newChatStates }
    }),
    
  setChatError: (projectId, error) =>
    set((state) => ({
      chatStates: {
        ...state.chatStates,
        [projectId]: {
          ...initialChatState,
          error
        }
      }
    })),
    
  getChatState: (projectId) => get().chatStates[projectId],
  
  // UI 状态初始化
  uiState: {
    chatVisible: false,
    targetMessageTime: undefined,
    timelineWidth: '55%'
  },
  
  // UI 控制方法
  showChat: () => set(state => ({
    uiState: {
      ...state.uiState,
      chatVisible: true
    }
  })),
  
  hideChat: () => set(state => ({
    uiState: {
      ...state.uiState,
      chatVisible: false
    }
  })),
  
  toggleChat: () => set(state => ({
    uiState: {
      ...state.uiState,
      chatVisible: !state.uiState.chatVisible
    }
  })),
  
  scrollToMessage: (timestamp: string) => {
    set(state => ({
      uiState: {
        ...state.uiState,
        chatVisible: true,
        targetMessageTime: timestamp
      }
    }))
  },
  
  clearTargetMessage: () => {
    set(state => ({
      uiState: {
        ...state.uiState,
        targetMessageTime: undefined
      }
    }))
  },
  
  recommendations: {},
  setRecommendations: (projectId, recommendations) => {
    set(state => ({
      recommendations: {
        ...state.recommendations,
        [projectId]: recommendations
      }
    }))
  },
  
  setTimelineWidth: (width) => set(state => ({
    uiState: {
      ...state.uiState,
      timelineWidth: width
    }
  }))
}))

// 便捷的选择器
export const useChatState = (projectId: string) => 
  useProjectStore((state) => state.chatStates[projectId])

// 修改后的 actions 选择器
export const useChatActions = () => ({
  setChatMessages: useProjectStore(chatActions.setChatMessages),
  clearChatMessages: useProjectStore(chatActions.clearChatMessages),
  setChatError: useProjectStore(chatActions.setChatError),
}) 