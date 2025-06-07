"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { addCoins } from "@/components/summary/coin-service"
import Image from "next/image"
import { Tag } from "lucide-react"

interface PaymentDialogProps {
  isOpen: boolean
  onClose: () => void
  coinAmount: number
  price: number
  onCoinsAdded: (amount: number) => void
}

// 简单的优惠码配置
const COUPON_CODES = {
  EVERYTHING2DOC: { type: "discount", value: 0.5, description: "限时50%折扣" },
  ZR8N4W6T: { type: "discount", value: 0.8, description: "超级80%折扣" },
}

export default function PaymentDialog({ isOpen, onClose, coinAmount, price, onCoinsAdded }: PaymentDialogProps) {
  const [isPaying, setIsPaying] = useState(false)
  const [isComplete, setIsComplete] = useState(false)
  const [couponCode, setCouponCode] = useState("")
  const [appliedCoupon, setAppliedCoupon] = useState<any>(null)
  const [couponError, setCouponError] = useState("")

  // 应用优惠码
  const applyCoupon = () => {
    const coupon = COUPON_CODES[couponCode.toUpperCase() as keyof typeof COUPON_CODES]
    if (coupon) {
      setAppliedCoupon({ code: couponCode.toUpperCase(), ...coupon })
      setCouponError("")
    } else {
      setCouponError("优惠码无效")
      setAppliedCoupon(null)
    }
  }

  // 移除优惠码
  const removeCoupon = () => {
    setAppliedCoupon(null)
    setCouponCode("")
    setCouponError("")
  }

  // 计算最终价格和硬币数量
  const finalPrice = appliedCoupon?.type === "discount" ? price * (1 - appliedCoupon.value) : price
  const finalCoins = appliedCoupon?.type === "bonus" ? coinAmount + appliedCoupon.value : coinAmount

  // 模拟支付过程
  const simulatePayment = () => {
    setIsPaying(true)

    // 模拟支付延迟
    setTimeout(() => {
      setIsPaying(false)
      setIsComplete(true)

      // 添加硬币到用户账户（包含优惠码奖励）
      addCoins(finalCoins)

      // 通知父组件硬币已添加
      onCoinsAdded(finalCoins)

      // 3秒后关闭对话框
      setTimeout(() => {
        setIsComplete(false)
        setAppliedCoupon(null)
        setCouponCode("")
        setCouponError("")
        onClose()
      }, 3000)
    }, 2000)
  }

  // 取消支付
  const cancelPayment = () => {
    setAppliedCoupon(null)
    setCouponCode("")
    setCouponError("")
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && cancelPayment()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>支付 ¥{finalPrice.toFixed(2)}</DialogTitle>
        </DialogHeader>

        <div className="flex flex-col items-center justify-center py-6">
          {!isPaying && !isComplete ? (
            <>
              {/* 优惠码输入区域 */}
              <div className="w-full mb-4 space-y-3">
                <div className="flex items-center gap-2">
                  <Tag className="h-4 w-4 text-gray-500" />
                  <span className="text-sm font-medium">优惠码</span>
                </div>

                {!appliedCoupon ? (
                  <div className="flex gap-2">
                    <Input
                      placeholder="输入优惠码"
                      value={couponCode}
                      onChange={(e) => setCouponCode(e.target.value)}
                      className="flex-1"
                    />
                    <Button onClick={applyCoupon} variant="outline" size="sm" disabled={!couponCode.trim()}>
                      应用
                    </Button>
                  </div>
                ) : (
                  <div className="bg-green-50 border border-green-200 rounded-md p-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-sm font-medium text-green-800">{appliedCoupon.code} 已应用</div>
                        <div className="text-xs text-green-600">{appliedCoupon.description}</div>
                      </div>
                      <Button onClick={removeCoupon} variant="ghost" size="sm" className="text-green-700">
                        移除
                      </Button>
                    </div>
                  </div>
                )}

                {couponError && <div className="text-xs text-red-500">{couponError}</div>}
              </div>

              {/* 价格摘要 */}
              <div className="w-full mb-4 p-3 bg-gray-50 rounded-md">
                <div className="flex justify-between text-sm">
                  <span>硬币数量:</span>
                  <span>{coinAmount} 枚</span>
                </div>
                {appliedCoupon?.type === "bonus" && (
                  <div className="flex justify-between text-sm text-green-600">
                    <span>优惠码奖励:</span>
                    <span>+{appliedCoupon.value} 枚</span>
                  </div>
                )}
                <div className="flex justify-between text-sm">
                  <span>原价:</span>
                  <span className={appliedCoupon?.type === "discount" ? "line-through text-gray-500" : ""}>
                    ¥{price.toFixed(2)}
                  </span>
                </div>
                {appliedCoupon?.type === "discount" && (
                  <div className="flex justify-between text-sm text-green-600">
                    <span>折扣价:</span>
                    <span>¥{finalPrice.toFixed(2)}</span>
                  </div>
                )}
                <hr className="my-2" />
                <div className="flex justify-between font-medium">
                  <span>总计:</span>
                  <span>
                    {finalCoins} 枚硬币 / ¥{finalPrice.toFixed(2)}
                  </span>
                </div>
              </div>

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
              <p className="text-sm text-gray-500 mt-1">已添加 {finalCoins} 枚硬币到您的账户</p>
              {appliedCoupon && <p className="text-xs text-green-600 mt-1">优惠码 {appliedCoupon.code} 已生效</p>}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
