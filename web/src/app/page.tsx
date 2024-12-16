import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ArrowRight, FileText, Zap, Shield } from "lucide-react"

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen">
      {/* Hero Section */}
      <section className="space-y-6 pb-8 pt-6 md:pb-12 md:pt-10 lg:py-32">
        <div className="container flex max-w-[64rem] flex-col items-center gap-4 text-center">
          <h1 className="font-bold text-3xl sm:text-5xl md:text-6xl lg:text-7xl">
            将群聊记录转换为
            <span className="text-primary">结构化文档</span>
          </h1>
          <p className="max-w-[42rem] leading-normal text-muted-foreground sm:text-xl sm:leading-8">
            利用 AI 技术，自动将微信群聊记录整理成清晰的文档。告别手动整理，提升效率。
          </p>
          <div className="space-x-4">
            <Link href="/workspace">
              <Button size="lg" className="gap-2">
                开始使用 <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <Link href="/features">
              <Button variant="outline" size="lg">
                了解更多
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="container space-y-6 py-8 md:py-12 lg:py-24">
        <div className="mx-auto grid justify-center gap-4 sm:grid-cols-2 md:max-w-[64rem] md:grid-cols-3">
          <div className="relative overflow-hidden rounded-lg border bg-background p-6">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
              <FileText className="h-6 w-6 text-primary" />
            </div>
            <div className="mt-4 space-y-2">
              <h3 className="font-bold">智能整理</h3>
              <p className="text-sm text-muted-foreground">
                自动识别关键信息，生成结构化文档
              </p>
            </div>
          </div>
          <div className="relative overflow-hidden rounded-lg border bg-background p-6">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
              <Zap className="h-6 w-6 text-primary" />
            </div>
            <div className="mt-4 space-y-2">
              <h3 className="font-bold">快速处理</h3>
              <p className="text-sm text-muted-foreground">
                秒级处理大量聊天记录，节省时间
              </p>
            </div>
          </div>
          <div className="relative overflow-hidden rounded-lg border bg-background p-6">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
              <Shield className="h-6 w-6 text-primary" />
            </div>
            <div className="mt-4 space-y-2">
              <h3 className="font-bold">隐私保护</h3>
              <p className="text-sm text-muted-foreground">
                本地处理数据，确保信息安全
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="container py-8 md:py-12 lg:py-24">
        <div className="flex flex-col items-center justify-center gap-4 text-center">
          <h2 className="font-bold text-3xl sm:text-4xl">
            立即开始使用
          </h2>
          <p className="max-w-[42rem] leading-normal text-muted-foreground sm:text-xl sm:leading-8">
            快速、智能、安全地处理您的群聊记录
          </p>
          <Link href="/workspace">
            <Button size="lg" className="gap-2">
              免费试用 <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>
      </section>
    </div>
  )
}