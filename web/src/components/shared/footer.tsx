import Link from "next/link"
import { Github, Twitter } from "lucide-react"

export function Footer() {
  return (
    <footer className="border-t bg-background">
      <div className="container py-6 md:py-8">
        <div className="flex flex-col items-center justify-between gap-4 md:flex-row">
          {/* 左侧：版权信息 */}
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span>© {new Date().getFullYear()} Everything2Doc</span>
            <span className="hidden md:inline">·</span>
            <Link 
              href="/privacy" 
              className="hover:text-foreground transition-colors"
            >
              隐私政策
            </Link>
            <span className="hidden md:inline">·</span>
            <Link 
              href="/terms" 
              className="hover:text-foreground transition-colors"
            >
              服务条款
            </Link>
          </div>

          {/* 右侧：社交链接 */}
          <div className="flex items-center gap-4">
            <Link 
              href="https://twitter.com" 
              target="_blank"
              className="text-muted-foreground hover:text-foreground transition-colors"
              aria-label="Twitter"
            >
              <Twitter className="h-4 w-4" />
            </Link>
            <Link 
              href="https://github.com" 
              target="_blank"
              className="text-muted-foreground hover:text-foreground transition-colors"
              aria-label="GitHub"
            >
              <Github className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </div>
    </footer>
  )
}