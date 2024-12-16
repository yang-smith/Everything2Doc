"use client"

import { useState } from "react"
import { Sidebar } from "@/components/layout/sidebar"

interface DashboardLayoutProps {
  children: React.ReactNode
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(true)

  return (
    <div className="flex min-h-[calc(100vh-3.5rem)]">
      <Sidebar open={sidebarOpen} onOpenChange={setSidebarOpen} />
      <div className={`flex-1 ${sidebarOpen ? 'ml-64' : 'ml-0'} transition-all duration-300`}>
        <main className="container py-6">
          {children}
        </main>
      </div>
    </div>
  )
}