"use client"

import { useEffect, useState } from "react"
import { useRouter, usePathname } from "next/navigation"
import useAuth from "@/hooks/use-auth"

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user } = useAuth()
  const router = useRouter()
  const pathname = usePathname()
  const [isChecking, setIsChecking] = useState(true)

  useEffect(() => {
    // 检查是否存在 token
    const token = localStorage.getItem("token")
    
    if (!token) {
      // 没有 token，需要登录
      console.log("需要登录，正在重定向到登录页面")
      sessionStorage.setItem("redirectAfterLogin", pathname)
      router.push("/login")
    }
    
    setIsChecking(false)
  }, [router, pathname])

  // 正在检查或没有用户时不显示内容
  if (isChecking || !user) {
    return null
  }

  // 用户已认证，显示受保护的内容
  return <>{children}</>
} 