"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Plus, FolderOpen, ChevronLeft, ChevronRight, Settings, FileText } from "lucide-react"
import { UploadDialog } from "@/components/workspace/upload-dialog"
import { useProjectStore } from "@/stores/project"
import { Project } from "@/types/workspace"
import { api } from "@/lib/api"
import { Separator } from "@/components/ui/separator"

const navigationItems = [
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

export function Sidebar() {
  const [collapsed, setCollapsed] = React.useState(false)
  const [uploadOpen, setUploadOpen] = React.useState(false)
  const currentProjectId = useProjectStore(state => state.currentProjectId)
  const setCurrentProject = useProjectStore(state => state.setCurrentProject)
  const [projects, setProjects] = React.useState<Project[]>([])
  const pathname = usePathname()
  
  React.useEffect(() => {
    api.getProjects().then(setProjects)
  }, [])


  return (
    <>
      <div className={cn(
        "relative h-full bg-background border-r transition-all duration-300 ease-in-out flex flex-col",
        collapsed ? "w-16" : "w-64"
      )}>
        <Button
          variant="ghost"
          size="icon"
          className="absolute right-[-12px] top-3 h-6 w-6 rounded-full border bg-background"
          onClick={() => setCollapsed(!collapsed)}
        >
          {collapsed ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <ChevronLeft className="h-4 w-4" />
          )}
        </Button>

        <ScrollArea className="flex-1">
          <div className="p-4 space-y-4">
            {/* Projects Section */}
            {!collapsed && (
              <div className="flex items-center justify-between mb-2">
                <h2 className="text-lg font-semibold tracking-tight">项目</h2>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setUploadOpen(true)}
                  className="h-8 w-8"
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            )}

            {collapsed && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setUploadOpen(true)}
                className="w-8 h-8 mx-auto"
              >
                <Plus className="h-4 w-4" />
              </Button>
            )}

            <div className="space-y-1">
              {projects.map((project) => (
                <Link
                  key={project.id}
                  href={`/workspace?id=${project.id}`}
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors",
                    "hover:bg-accent hover:text-accent-foreground",
                    project.id === currentProjectId
                      ? "bg-accent text-accent-foreground"
                      : "text-muted-foreground"
                  )}
                  onClick={() => setCurrentProject(project.id)}
                  title={collapsed ? project.name : undefined}
                >
                  <FolderOpen className="h-4 w-4 flex-shrink-0" />
                  {!collapsed && <span className="truncate">{project.name}</span>}
                </Link>
              ))}
            </div>
          </div>
        </ScrollArea>

        {/* Navigation Items at Bottom */}
        <div className="p-4 mt-auto">
          <Separator className="mb-4" />
          <nav className="space-y-1">
            {navigationItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors",
                  "hover:bg-accent hover:text-accent-foreground",
                  pathname === item.href
                    ? "bg-accent text-accent-foreground"
                    : "text-muted-foreground"
                )}
                title={collapsed ? item.title : undefined}
              >
                <item.icon className="h-4 w-4 flex-shrink-0" />
                {!collapsed && <span className="truncate">{item.title}</span>}
              </Link>
            ))}
          </nav>
        </div>
      </div>

      <UploadDialog 
        open={uploadOpen}
        onOpenChange={setUploadOpen}
      />
    </>
  )
}