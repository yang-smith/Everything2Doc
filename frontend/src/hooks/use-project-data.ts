import { useState, useEffect } from 'react'
import { api } from '@/lib/api'
import { Card } from '@/types/type-cards'

  
export function useProjectData(projectId: string) {
  // const [cards, setCards] = useState<Card[]>([])
  // const [loading, setLoading] = useState(true)
  // const [error, setError] = useState<string | null>(null)

  const [cards] = useState<Card[]>([])
  const [loading] = useState(false)  // Changed default to false since we're not loading
  const [error] = useState<string | null>(null)


  // useEffect(() => {
  //   let mounted = true
  //   const pollInterval = 2000 // 3秒轮询一次

  //   const fetchCards = async () => {
  //     try {
  //       const { cards, status } = await api.getProjectCards(projectId)
  //       if (mounted) {
  //         setCards(cards.map(card => ({
  //           ...card,
  //           type: 'major' as const
  //         })))
  //         console.log(cards)
  //         setLoading(true)
  //       }
  //       if (status === 'completed') {
  //           clearInterval(intervalId)
  //           setLoading(false)
  //       }
  //     } catch (err) {
  //       if (mounted) {
  //       //   setError(err instanceof Error ? err.message : 'Failed to fetch cards')
  //       //   setLoading(false)
  //       console.log(err)
  //       }
  //     }
  //   }

  //   // 初始加载
  //   fetchCards()

  //   // 设置轮询
  //   const intervalId = setInterval(fetchCards, pollInterval)

  //   return () => {
  //     mounted = false
  //     clearInterval(intervalId)
  //   }
  // }, [projectId])

  return {
    cards,
    loading,
    error
  }
} 