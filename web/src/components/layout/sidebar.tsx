"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { 
  LayoutDashboard, 
  FileText, 
  Settings,
  PanelLeftClose,
  PanelLeftOpen,
  FolderOpen,
  ChevronLeft,
  ChevronRight
} from "lucide-react"
import * as React from 'react'

// 模拟项目数据，实际应该从API获取
const projects = [
  { id: '1', name: '草稿1', createdAt: '2024-01-01' },
  { id: '2', name: '会议记录整理', createdAt: '2024-01-02' },
  { id: '3', name: '产品反馈汇总', createdAt: '2024-01-03' },
]

export function Sidebar() {
  const [collapsed, setCollapsed] = React.useState(false)
  const pathname = usePathname()

  const items = [
    {
      title: "工作区",
      href: "/workspace",
      icon: LayoutDashboard
    },
    {
      title: "文档",
      href: "/documents",
      icon: FileText
    },
    {
      title: "设置",
      href: "/settings",
      icon: Settings
    }
  ]

  return (
    <div className={cn(
      "h-full bg-background border-r transition-all duration-300 ease-in-out",
      collapsed ? "w-16" : "w-64"
    )}>
      <div className="flex h-full flex-col">
        {/* Header with collapse button */}
        <div className="flex items-center justify-between p-4 border-b">
          {!collapsed && <span className="font-semibold">导航菜单</span>}
          <Button
            variant="ghost"
            size="icon"
            className="ml-auto"
            onClick={() => setCollapsed(!collapsed)}
          >
            {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </Button>
        </div>

        <ScrollArea className="flex-1">
          <div className="p-2">
            {/* Main navigation */}
            <nav className="grid gap-1 mb-4">
              {items.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground",
                    pathname === item.href ? "bg-accent text-accent-foreground" : "text-muted-foreground",
                    collapsed && "justify-center px-2"
                  )}
                >
                  <item.icon className="h-4 w-4" />
                  {!collapsed && <span>{item.title}</span>}
                </Link>
              ))}
            </nav>

            {!collapsed && (
              <>
                <Separator className="my-4" />
                {/* Projects section - only show when not collapsed */}
                <div className="px-3 mb-2">
                  <h2 className="mb-2 text-lg font-semibold tracking-tight">项目</h2>
                  <div className="grid gap-1">
                    {projects.map((project) => (
                      <Link
                        key={project.id}
                        href={`/workspace/${project.id}`}
                        className={cn(
                          "flex items-center gap-3 rounded-lg px-3 py-2 text-sm hover:bg-accent hover:text-accent-foreground",
                          pathname === `/workspace/${project.id}` 
                            ? "bg-accent text-accent-foreground" 
                            : "text-muted-foreground"
                        )}
                      >
                        <FolderOpen className="h-4 w-4" />
                        <span className="truncate">{project.name}</span>
                      </Link>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>
        </ScrollArea>
      </div>
    </div>
  )
}