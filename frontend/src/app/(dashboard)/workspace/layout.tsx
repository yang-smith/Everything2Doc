"use client"

import { Sidebar } from "@/components/layout/sidebar"

export default function WorkspaceLayout({
  children,
}: {
  children: React.ReactNode
}) {

  return (
    <div className="flex min-h-[calc(100vh-3.5rem)]">
      <Sidebar />
      <div className="flex-1">
        <main className="container">
          {children}
        </main>
      </div>
    </div>
  )
}