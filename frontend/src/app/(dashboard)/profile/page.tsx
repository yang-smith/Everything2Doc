"use client"

import { Navbar } from "@/components/shared/navbar"
import { Button } from "@/components/ui/button"
import { Construction, ArrowLeft } from "lucide-react"
import Link from "next/link"
import { motion } from "framer-motion"

export default function ProfilePage() {
  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      
      <div className="flex-1 flex items-center justify-center p-4">
        <motion.div 
          className="max-w-md w-full mx-auto text-center space-y-6 p-8 rounded-lg border shadow-sm"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Construction className="h-16 w-16 mx-auto text-primary" />
          
          <h1 className="text-2xl font-bold tracking-tight">页面建设中</h1>
          
          <p className="text-muted-foreground">
            我们正在努力为您完善更多功能。此页面即将推出，敬请期待！
          </p>
          
          <div className="pt-4">
            <Button asChild variant="outline">
              <Link href="/workspace" className="gap-2">
                <ArrowLeft className="h-4 w-4" />
                返回工作台
              </Link>
            </Button>
          </div>
        </motion.div>
      </div>
    </div>
  )
}
