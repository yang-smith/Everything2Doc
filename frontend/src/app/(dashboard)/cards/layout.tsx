import type { Metadata } from 'next'
import { Sidebar } from '@/components/layout/sidebar'

export const metadata: Metadata = {
  title: 'Chat Interface',
  description: 'A sophisticated chat interface with timeline and knowledge cards',
}

export default function CardsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex h-[calc(100vh-theme(spacing.12))]">
      <Sidebar />
      <div className="flex flex-1 min-w-0 gap-4 p-4 overflow-hidden">
        {children}
      </div>
    </div>
  )
}

