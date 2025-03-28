'use client'

import Link from "next/link"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Navbar } from "@/components/shared/navbar"
import { 
  ArrowRight, 
  Brain, 
  Zap, 
  BookOpen,
  Shield,
} from "lucide-react"

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
}

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 }
}

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="container flex max-w-[64rem] flex-col items-center gap-4 text-center pt-28 pb-20"
        >
          <h1 className="font-bold text-4xl sm:text-5xl md:text-6xl lg:text-7xl bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text text-transparent">
            从碎片信息到知识文档
            {/* <br />
            一键完成 */}
          </h1>
          <p className="max-w-[42rem] leading-normal text-muted-foreground sm:text-xl sm:leading-8">
            基于 AI 技术，自动分析微信聊天记录、随手笔记，提取关键信息，生成结构化文档。
            让零碎的信息都成为有价值的知识资产。
          </p>
          <motion.div 
            className="space-x-4"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Link href="/workspace">
              <Button size="lg" className="gap-2 bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary">
                开始使用 <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <Link href="#features">
              <Button variant="outline" size="lg" className="bg-background/50 backdrop-blur-sm">
                了解更多
              </Button>
            </Link>
          </motion.div>
        </motion.div>
      </section>

      {/* Features Section */}
      <section id="features" className="container py-24 sm:py-32">
        <motion.div
          variants={container}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true }}
          className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4"
        >
          <motion.div variants={item} className="group relative overflow-hidden rounded-lg border bg-background/50 p-6 backdrop-blur-sm transition-shadow hover:shadow-lg">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 transition-transform group-hover:scale-110">
              <Brain className="h-6 w-6 text-primary" />
            </div>
            <h3 className="mt-4 font-semibold">智能分析</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              自动识别关键信息，提取重要观点，让群聊内容一目了然
            </p>
          </motion.div>

          <motion.div variants={item} className="group relative overflow-hidden rounded-lg border bg-background/50 p-6 backdrop-blur-sm transition-shadow hover:shadow-lg">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 transition-transform group-hover:scale-110">
              <Zap className="h-6 w-6 text-primary" />
            </div>
            <h3 className="mt-4 font-semibold">即时转换</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              实时处理群聊记录，快速生成文档，告别手动整理
            </p>
          </motion.div>

          <motion.div variants={item} className="group relative overflow-hidden rounded-lg border bg-background/50 p-6 backdrop-blur-sm transition-shadow hover:shadow-lg">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 transition-transform group-hover:scale-110">
              <BookOpen className="h-6 w-6 text-primary" />
            </div>
            <h3 className="mt-4 font-semibold">知识沉淀</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              将零散对话转化为系统知识，助力团队协作与经验传承
            </p>
          </motion.div>

          <motion.div variants={item} className="group relative overflow-hidden rounded-lg border bg-background/50 p-6 backdrop-blur-sm transition-shadow hover:shadow-lg">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 transition-transform group-hover:scale-110">
              <Shield className="h-6 w-6 text-primary" />
            </div>
            <h3 className="mt-4 font-semibold">隐私保护</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              本地处理数据，确保信息安全，让您放心使用
            </p>
          </motion.div>
        </motion.div>
      </section>

      {/* CTA Section */}
      <section className="border-t">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="container flex flex-col items-center gap-4 py-24 sm:py-32 text-center"
        >
          <h2 className="font-bold text-3xl sm:text-4xl md:text-5xl bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text text-transparent">
            开启智能群聊新体验
          </h2>
          <p className="max-w-[42rem] leading-normal text-muted-foreground sm:text-xl sm:leading-8">
            让群聊不再是碎片化信息的集合，而是有价值的知识资产
          </p>
          <motion.div
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Link href="/workspace">
              <Button size="lg" className="mt-6 gap-2 bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary">
                免费开始使用 <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </motion.div>
        </motion.div>
      </section>
    </div>
  )
}