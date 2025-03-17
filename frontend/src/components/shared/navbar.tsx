"use client"

import { useEffect, useState } from "react"
import { cn } from "@/lib/utils"
import { motion } from "framer-motion"
import Link from "next/link"
import { User } from "lucide-react"
import useAuth from "@/hooks/use-auth"
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu"
import { LogOut, Settings } from "lucide-react"

export function Navbar() {
  const [isVisible, setIsVisible] = useState(true)
  const [isTop, setIsTop] = useState(true)
  const [lastScrollY, setLastScrollY] = useState(0)
  const { user, logout } = useAuth()

  useEffect(() => {
    const controlNavbar = () => {
      const currentScrollY = window.scrollY
      
      // 顶部状态 - 完全透明
      setIsTop(currentScrollY < 20)
      
      // 智能显示/隐藏逻辑
      if (currentScrollY < 20) {
        setIsVisible(true)
      } else if (currentScrollY > lastScrollY && currentScrollY > 200) {
        // 向下滚动且超过阈值时隐藏
        setIsVisible(false)
      } else if (currentScrollY < lastScrollY - 20) {
        // 明显向上滚动时显示
        setIsVisible(true)
      }
      
      setLastScrollY(currentScrollY)
    }

    const throttledControl = throttle(controlNavbar, 100)
    window.addEventListener('scroll', throttledControl)
    return () => window.removeEventListener('scroll', throttledControl)
  }, [lastScrollY])

  return (
    <motion.nav
      initial={false}
      animate={{
        y: isVisible ? 0 : -48,
        opacity: isVisible ? 1 : 0,
      }}
      transition={{
        type: "spring",
        stiffness: 260,
        damping: 20
      }}
      className={cn(
        "fixed top-0 left-0 right-0 h-12 z-50",
        "transition-all duration-300",
        isTop 
          ? "bg-transparent" 
          : "bg-background/80 backdrop-blur-md border-b border-border/5",
      )}
    >
      <div className="container h-full mx-auto">
        <div className="flex h-full items-center justify-between px-4">
          {/* Logo - 保持极简 */}
          <Link 
            href="/"
            className={cn(
              "text-lg font-medium transition-opacity",
              isTop ? "opacity-60 hover:opacity-100" : "opacity-90"
            )}
          >
            E2D
          </Link>

          {/* 核心功能区 - 最小化显示 */}
          <div className="flex items-center gap-4">
            {user ? (
              // User is logged in - show profile dropdown
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    className={cn(
                      "w-8 h-8 flex items-center justify-center rounded-full",
                      "transition-colors duration-200",
                      "hover:bg-accent/50",
                      isTop ? "opacity-60 hover:opacity-100" : "opacity-90"
                    )}
                  >
                    <User className="w-4 h-4" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <div className="px-2 py-1.5 text-sm font-medium">
                    {user.email}
                  </div>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link href="/settings" className="cursor-pointer">
                      <Settings className="mr-2 h-4 w-4" />
                      <span>设置</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={logout} className="cursor-pointer">
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>退出</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              // User is NOT logged in - show login/register links
              <div className="flex items-center gap-2">
                <Link href="/login">
                  <button className="text-sm font-medium hover:text-primary">
                    登录
                  </button>
                </Link>
                <Link href="/register">
                  <button className="bg-primary text-primary-foreground rounded-md px-3 py-1.5 text-sm font-medium">
                    注册
                  </button>
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </motion.nav>
  )
}

// 节流函数
function throttle(func: Function, limit: number) {
  let inThrottle: boolean
  return function(this: any, ...args: any[]) {
    if (!inThrottle) {
      func.apply(this, args)
      inThrottle = true
      setTimeout(() => inThrottle = false, limit)
    }
  }
}