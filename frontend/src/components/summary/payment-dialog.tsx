"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { addCoins } from "@/components/summary/coin-service"
import Image from "next/image"

interface PaymentDialogProps {
  isOpen: boolean
  onClose: () => void
  coinAmount: number
  price: number
  onCoinsAdded: (amount: number) => void
}

export default function PaymentDialog({ isOpen, onClose, coinAmount, price, onCoinsAdded }: PaymentDialogProps) {
  const [isPaying, setIsPaying] = useState(false)
  const [isComplete, setIsComplete] = useState(false)

  // 模拟支付过程
  const simulatePayment = () => {
    setIsPaying(true)

    // 模拟支付延迟
    setTimeout(() => {
      setIsPaying(false)
      setIsComplete(true)

      // 添加硬币到用户账户
      addCoins(coinAmount)

      // 通知父组件硬币已添加
      onCoinsAdded(coinAmount)

      // 3秒后关闭对话框
      setTimeout(() => {
        setIsComplete(false)
        onClose()
      }, 3000)
    }, 2000)
  }

  // 取消支付
  const cancelPayment = () => {
    onClose()
  }

  // 计算价格显示
  const priceDisplay = price.toFixed(2)

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>支付 ¥{priceDisplay}</DialogTitle>
        </DialogHeader>

        <div className="flex flex-col items-center justify-center py-6">
          {!isPaying && !isComplete ? (
            <>
              <div className="bg-white p-4 rounded-lg mb-4 border">
                <Image
                  src="/qrcode.jpg"
                  alt="支付二维码"
                  width={192}
                  height={192}
                  className="object-contain"
                />
              </div>
              <p className="text-sm text-center mb-4">请使用微信扫描二维码完成支付</p>
              <div className="flex w-full gap-3">
                <Button onClick={cancelPayment} variant="outline" className="flex-1">
                  取消支付
                </Button>
                <Button onClick={simulatePayment} className="flex-1 bg-blue-600 hover:bg-blue-700">
                  完成支付
                </Button>
              </div>
            </>
          ) : isPaying ? (
            <div className="flex flex-col items-center py-8">
              <div className="h-12 w-12 rounded-full border-4 border-t-blue-500 border-blue-200 animate-spin mb-4"></div>
              <p>处理中，请稍候...</p>
            </div>
          ) : (
            <div className="flex flex-col items-center py-8">
              <div className="h-12 w-12 bg-green-100 text-green-600 rounded-full flex items-center justify-center mb-4">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  className="h-6 w-6"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <p className="text-green-600 font-medium">支付成功！</p>
              <p className="text-sm text-gray-500 mt-1">已添加 {coinAmount} 枚硬币到您的账户</p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
