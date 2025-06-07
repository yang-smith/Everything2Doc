"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { Upload, ImageDown, AlertCircle, CreditCard } from "lucide-react"
import { streamingConvertChatToReport } from "@/components/summary/ai_service"
import DocumentParser from "@/components/summary/parser"
import { toPng } from "html-to-image"
import CoinDisplay from "@/components/summary/coin-display"
import PaymentDialog from "@/components/summary/payment-dialog"
import SubscriptionDialog from "@/components/summary/subscription-dialog"
import { checkAndRefillCoins, calculateRequiredCoins, consumeCoins, getCoinBalance, canUseCoins, getAvailableCoinsInfo, checkMonthlyPackageExpiry } from "@/components/summary/coin-service"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

// 硬币套餐配置
const COIN_PACKAGES = [
  { amount: 3, price: 3 },
  { amount: 10, price: 8 },
  { amount: 25, price: 20 },
  { amount: 60, price: 50 },
  { amount: 100, price: 80 },
  { amount: 300, price: 199 },
]

export default function ChatToReport() {
  const [chatContent, setChatContent] = useState("")
  const [reportContent, setReportContent] = useState("")
  const [isGenerating, setIsGenerating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [coinBalance, setCoinBalance] = useState(0)
  const [requiredCoins, setRequiredCoins] = useState(0)
  const [showPaymentDialog, setShowPaymentDialog] = useState(false)
  const [showSubscriptionDialog, setShowSubscriptionDialog] = useState(false)
  const [purchaseAmount, setPurchaseAmount] = useState(0)
  const [purchasePrice, setPurchasePrice] = useState(0)
  const [insufficientCoins, setInsufficientCoins] = useState(false)
  const [isSubscribed, setIsSubscribed] = useState(false)
  const [isClient, setIsClient] = useState(false)

  const fileInputRef = useRef<HTMLInputElement>(null)
  const chatInputRef = useRef<HTMLDivElement>(null)
  const reportRef = useRef<HTMLDivElement>(null)

  // Determine if we're in "report mode" (after generation)
  const isReportMode = reportContent !== ""

  // 更新硬币余额和订阅状态
  const updateCoinBalance = () => {
    if (typeof window === "undefined") return
    
    checkMonthlyPackageExpiry() // 检查月度套餐是否过期
    const info = getAvailableCoinsInfo()
    setCoinBalance(info.remainingCoins || 0)
    setIsSubscribed(info.hasMonthlyPackage)
  }

  // 初始化并检查硬币余额
  useEffect(() => {
    setIsClient(true)
    checkAndRefillCoins() // 检查是否需要月度补充
    updateCoinBalance()

    // 设置定期检查，以防用户长时间保持页面打开
    const intervalId = setInterval(
      () => {
        checkAndRefillCoins()
        updateCoinBalance()
      },
      60 * 60 * 1000,
    ) // 每小时检查一次

    return () => clearInterval(intervalId)
  }, [])

  // 当输入内容变化时，计算所需硬币
  useEffect(() => {
    if (!isClient) return
    
    const coins = calculateRequiredCoins(chatContent)
    setRequiredCoins(coins)

    // 检查是否可以使用硬币
    setInsufficientCoins(!canUseCoins(coins))
  }, [chatContent, coinBalance, isSubscribed, isClient])

  const handleGenerateReport = async () => {
    if (!chatContent.trim()) return

    // 检查硬币是否足够
    const coinsNeeded = calculateRequiredCoins(chatContent)
    if (!canUseCoins(coinsNeeded)) {
      setInsufficientCoins(true)
      return
    }

    setIsGenerating(true)
    setError(null)
    setReportContent("")

    try {
      // 消费硬币
      const success = consumeCoins(coinsNeeded)
      if (!success) {
        throw new Error("硬币不足，无法生成报告")
      }

      // 更新硬币余额显示
      updateCoinBalance()

      // 使用流式API，逐步更新UI
      await streamingConvertChatToReport(chatContent, (chunk) => {
        setReportContent((prev) => prev + chunk)
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : "生成日报时发生错误")
    } finally {
      setIsGenerating(false)
    }
  }

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (e) => {
      const content = e.target?.result as string
      setChatContent(content)
    }
    reader.readAsText(file)

    // Reset the file input
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  const triggerFileUpload = () => {
    fileInputRef.current?.click()
  }

  const downloadReportAsImage = async () => {
    if (!reportRef.current) return

    try {
      const dataUrl = await toPng(reportRef.current, {
        quality: 0.95,
        pixelRatio: 2,
        cacheBust: true,
      })

      const link = document.createElement("a")
      link.download = `聊天日报_${new Date().toLocaleDateString().replace(/\//g, "-")}.png`
      link.href = dataUrl
      link.click()
    } catch (err) {
      console.error("下载图片失败:", err)
    }
  }

  const resetAll = () => {
    setReportContent("")
    setError(null)
  }

  // 处理购买硬币
  const handlePurchase = (amount: number) => {
    // 查找对应的价格
    const packageInfo = COIN_PACKAGES.find((pkg) => pkg.amount === amount)
    const price = packageInfo ? packageInfo.price : amount // 如果找不到套餐，则使用数量作为价格

    setPurchaseAmount(amount)
    setPurchasePrice(price)
    setShowPaymentDialog(true)
  }

  // 支付完成后的回调
  const handlePaymentComplete = () => {
    setShowPaymentDialog(false)
  }

  // 硬币添加后的回调
  const handleCoinsAdded = (amount: number) => {
    console.log(`添加了 ${amount} 枚硬币`)
    updateCoinBalance()
  }

  // 添加键盘快捷键支持
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // 检测 Cmd+Enter 或 Ctrl+Enter
      if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
        if (chatContent.trim() && !isGenerating && !insufficientCoins) {
          handleGenerateReport()
        }
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [chatContent, isGenerating, insufficientCoins])

  // 添加拖放文件支持
  useEffect(() => {
    const chatInputElement = chatInputRef.current
    if (!chatInputElement) return

    const handleDragOver = (e: DragEvent) => {
      e.preventDefault()
      e.stopPropagation()
      chatInputElement.classList.add("border-black")
    }

    const handleDragLeave = (e: DragEvent) => {
      e.preventDefault()
      e.stopPropagation()
      chatInputElement.classList.remove("border-black")
    }

    const handleDrop = (e: DragEvent) => {
      e.preventDefault()
      e.stopPropagation()
      chatInputElement.classList.remove("border-black")

      if (e.dataTransfer?.files && e.dataTransfer.files.length > 0) {
        const file = e.dataTransfer.files[0]
        if (file.type === "text/plain") {
          const reader = new FileReader()
          reader.onload = (e) => {
            const content = e.target?.result as string
            setChatContent(content)
          }
          reader.readAsText(file)
        }
      }
    }

    chatInputElement.addEventListener("dragover", handleDragOver)
    chatInputElement.addEventListener("dragleave", handleDragLeave)
    chatInputElement.addEventListener("drop", handleDrop)

    return () => {
      chatInputElement.removeEventListener("dragover", handleDragOver)
      chatInputElement.removeEventListener("dragleave", handleDragLeave)
      chatInputElement.removeEventListener("drop", handleDrop)
    }
  }, [])

  // 处理月度套餐购买
  const handleSubscribe = () => {
    setShowSubscriptionDialog(true)
  }

  // 订阅完成后的回调
  const handleSubscriptionComplete = () => {
    updateCoinBalance() // 这会自动更新订阅状态
  }

  // 如果还在服务端渲染，显示加载状态
  if (!isClient) {
    return (
      <div className="min-h-screen bg-white">
        <div className="max-w-5xl mx-auto px-4 py-6 sm:py-12">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h1 className="text-2xl font-medium text-black mb-1 text-center sm:text-left">聊天日报</h1>
              <p className="text-gray-500 text-sm">将杂乱的聊天记录转化为结构化的社群日报</p>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center bg-amber-50 text-amber-800 rounded-full px-3 py-1 text-sm">
                <span>加载中...</span>
              </div>
            </div>
          </div>
          {/* 其他内容保持不变，但不显示交互功能 */}
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-5xl mx-auto px-4 py-6 sm:py-12">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-medium text-black mb-1 text-center sm:text-left">聊天日报</h1>
            <p className="text-gray-500 text-sm">将杂乱的聊天记录转化为结构化的社群日报</p>
          </div>
          <div className="flex items-center gap-3">
            <CoinDisplay coinBalance={coinBalance} onPurchase={handlePurchase} />
            {isSubscribed ? (
              <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full flex items-center">
                <CreditCard className="h-3 w-3 mr-1" />
                月度套餐
              </span>
            ) : (
              <Button onClick={handleSubscribe} variant="outline" size="sm" className="text-xs h-7">
                <CreditCard className="h-3 w-3 mr-1" />
                月度套餐
              </Button>
            )}
          </div>
        </div>

        {insufficientCoins && (
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>硬币不足</AlertTitle>
            <AlertDescription className="flex items-center justify-between">
              <span>
                您当前的硬币余额不足以处理这么多文字。需要 {requiredCoins} 枚硬币，您有 {coinBalance} 枚。
              </span>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePurchase(Math.max(3, requiredCoins - coinBalance))}
                  className="h-7 text-xs"
                >
                  购买硬币
                </Button>
                <Button
                  variant="default"
                  size="sm"
                  onClick={handleSubscribe}
                  className="h-7 text-xs bg-blue-600 hover:bg-blue-700"
                >
                  月度套餐
                </Button>
              </div>
            </AlertDescription>
          </Alert>
        )}

        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 sm:gap-6 transition-all duration-300">
          {/* Input Section - dynamically sized */}
          <div
            ref={chatInputRef}
            className={`space-y-3 sm:space-y-4 ${isReportMode ? "md:col-span-5" : "md:col-span-7"}`}
          >
            <div className="flex items-center justify-between">
              <label className="block text-sm font-medium text-gray-700">聊天记录</label>
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-500">消耗 {requiredCoins} 枚硬币</span>
                <input type="file" accept=".txt" className="hidden" ref={fileInputRef} onChange={handleFileUpload} />
                <button
                  onClick={triggerFileUpload}
                  className="flex items-center text-xs text-gray-500 hover:text-gray-700"
                >
                  <Upload className="h-3 w-3 mr-1" />
                  上传文本文件
                </button>
              </div>
            </div>
            <div className="relative">
              <Textarea
                placeholder="粘贴你的聊天记录，或拖放文本文件到这里..."
                className="min-h-[300px] sm:min-h-[400px] resize-none border-gray-200 rounded-md transition-all duration-200"
                value={chatContent}
                onChange={(e) => setChatContent(e.target.value)}
              />
              {!chatContent && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="text-gray-400 text-sm text-center px-4">
                    <p>拖放 .txt 文件到这里</p>
                    <p className="text-xs mt-1">或粘贴聊天记录</p>
                  </div>
                </div>
              )}
            </div>
            <div className="text-xs text-gray-400 text-right">提示: 每月自动获得 3 枚免费硬币</div>
          </div>

          {/* Output Section - dynamically sized */}
          <div className={`space-y-3 sm:space-y-4 ${isReportMode ? "md:col-span-7" : "md:col-span-5"}`}>
            <div className="flex items-center justify-between">
              <label className="block text-sm font-medium text-gray-700">日报摘要</label>
            </div>

            <div className="min-h-[300px] sm:min-h-[400px] overflow-auto">
              {reportContent ? (
                <div ref={reportRef}>
                  <DocumentParser inputText={reportContent} />
                </div>
              ) : isGenerating ? (
                <div className="bg-gray-50 rounded-md p-4 relative h-[300px] sm:h-[400px] flex items-center justify-center">
                  <div className="h-5 w-5 bg-black rounded-full animate-pulse"></div>
                </div>
              ) : error ? (
                <div className="bg-gray-50 rounded-md p-4 relative h-[300px] sm:h-[400px]">
                  <div className="text-red-500 text-sm p-4">错误: {error}</div>
                </div>
              ) : (
                <div className="bg-gray-50 rounded-md p-4 relative h-[300px] sm:h-[400px] flex items-center justify-center">
                  <div className="text-gray-400 text-sm">生成的日报将显示在这里</div>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="mt-4 sm:mt-6 flex justify-end">
          {reportContent ? (
            <div className="flex space-x-3">
              <Button
                onClick={handleGenerateReport}
                disabled={!chatContent.trim() || isGenerating || insufficientCoins}
                variant="outline"
                className="text-gray-700 border-gray-300 text-sm"
              >
                重新生成
              </Button>
              <Button
                onClick={downloadReportAsImage}
                className="bg-blue-600 hover:bg-blue-700 text-white rounded-md px-4 py-2 text-sm flex items-center"
              >
                <ImageDown className="h-4 w-4 mr-1.5" />
                下载图片
              </Button>
            </div>
          ) : (
            <Button
              onClick={handleGenerateReport}
              disabled={!chatContent.trim() || isGenerating || insufficientCoins}
              className="bg-black hover:bg-black/90 text-white rounded-md px-4 py-2 text-sm"
            >
              {isGenerating ? "生成中..." : "生成日报"}
            </Button>
          )}
        </div>
      </div>

      {/* 支付对话框 */}
      <PaymentDialog
        isOpen={showPaymentDialog}
        onClose={handlePaymentComplete}
        coinAmount={purchaseAmount}
        price={purchasePrice}
        onCoinsAdded={handleCoinsAdded}
      />

      {/* 订阅对话框 */}
      <SubscriptionDialog
        isOpen={showSubscriptionDialog}
        onClose={() => setShowSubscriptionDialog(false)}
        onSubscribed={handleSubscriptionComplete}
      />
    </div>
  )
}
