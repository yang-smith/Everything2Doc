"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Check, Tag, X } from "lucide-react"
import { addCoins, activateMonthlyPackage } from "@/components/summary/coin-service"
import Image from "next/image"

interface SubscriptionDialogProps {
  isOpen: boolean
  onClose: () => void
  onSubscribed: () => void
}

// 简单的优惠码配置
const COUPON_CODES = {
  EVERYTHING2DOC: { type: "discount", value: 0.6, description: "限时60%折扣" },
  ZR8N4W6T: { type: "discount", value: 0.8, description: "超级80%折扣" },
}

export default function SubscriptionDialog({ isOpen, onClose, onSubscribed }: SubscriptionDialogProps) {
  const [isPaying, setIsPaying] = useState(false)
  const [isComplete, setIsComplete] = useState(false)
  const [couponCode, setCouponCode] = useState("")
  const [appliedCoupon, setAppliedCoupon] = useState<any>(null)
  const [couponError, setCouponError] = useState("")

  // 原始价格
  const originalPrice = 49

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

  // 计算最终价格
  const finalPrice = appliedCoupon?.type === "discount" ? originalPrice * (1 - appliedCoupon.value) : originalPrice

  // 模拟订阅过程
  const simulateSubscription = () => {
    setIsPaying(true)

    // 模拟支付延迟
    setTimeout(() => {
      setIsPaying(false)
      setIsComplete(true)

      // 激活月度套餐
      activateMonthlyPackage()

      // 通知父组件订阅成功
      onSubscribed()

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

  // 取消订阅
  const cancelSubscription = () => {
    setAppliedCoupon(null)
    setCouponCode("")
    setCouponError("")
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && cancelSubscription()}>
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            月度套餐
            <Button variant="ghost" size="sm" onClick={cancelSubscription} className="h-6 w-6 p-0">
              <X className="h-4 w-4" />
            </Button>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {!isPaying && !isComplete ? (
            <>
              {/* 套餐特权 - 更新描述 */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <div className="flex items-center gap-2 mb-2">
                  <div className="bg-blue-600 text-white text-xs px-2 py-1 rounded">特权</div>
                  <span className="text-sm font-medium">随心使用，上限200硬币</span>
                </div>
                <div className="text-xs text-blue-700">支持优惠码，最高可享8折优惠</div>
              </div>

              {/* 优惠码区域 - 简化版 */}
              <div className="space-y-2">
                {!appliedCoupon ? (
                  <div className="flex gap-2">
                    <Input
                      placeholder="优惠码（可选）"
                      value={couponCode}
                      onChange={(e) => setCouponCode(e.target.value)}
                      className="flex-1 h-8 text-sm"
                    />
                    <Button onClick={applyCoupon} variant="outline" size="sm" disabled={!couponCode.trim()} className="h-8 px-3 text-xs">
                      应用
                    </Button>
                  </div>
                ) : (
                  <div className="bg-green-50 border border-green-200 rounded p-2 flex items-center justify-between">
                    <div className="text-xs">
                      <span className="font-medium text-green-800">{appliedCoupon.code}</span>
                      <span className="text-green-600 ml-1">{appliedCoupon.description}</span>
                    </div>
                    <Button onClick={removeCoupon} variant="ghost" size="sm" className="h-6 w-6 p-0 text-green-700">
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                )}
                {couponError && <div className="text-xs text-red-500">{couponError}</div>}
              </div>

              {/* 价格信息 - 更新描述 */}
              <div className="bg-gray-50 rounded p-3 space-y-1">
                <div className="flex justify-between text-sm">
                  <span>月度套餐</span>
                  <span className={appliedCoupon ? "line-through text-gray-500" : ""}>¥{originalPrice}</span>
                </div>
                {appliedCoupon && (
                  <div className="flex justify-between text-sm text-green-600">
                    <span>优惠价格</span>
                    <span>¥{finalPrice.toFixed(2)}</span>
                  </div>
                )}
                <hr className="border-gray-300" />
                <div className="flex justify-between font-medium">
                  <span>总计</span>
                  <span className="text-blue-600">¥{finalPrice.toFixed(2)}</span>
                </div>
              </div>

              {/* 支付二维码 - 缩小版 */}
              <div className="flex flex-col items-center space-y-2">
                <div className="bg-white p-2 rounded border">
                  <Image
                    src="/qrcode.jpg"
                    alt="支付二维码"
                    width={120}
                    height={120}
                    className="object-contain"
                  />
                </div>
                <p className="text-xs text-gray-600 text-center">微信扫码支付</p>
              </div>

              {/* 按钮区域 */}
              <div className="flex gap-3 pt-2">
                <Button onClick={cancelSubscription} variant="outline" className="flex-1 h-9">
                  取消
                </Button>
                <Button onClick={simulateSubscription} className="flex-1 h-9 bg-blue-600 hover:bg-blue-700">
                  确认购买
                </Button>
              </div>
            </>
          ) : isPaying ? (
            <div className="flex flex-col items-center py-8">
              <div className="h-8 w-8 rounded-full border-4 border-t-blue-500 border-blue-200 animate-spin mb-3"></div>
              <p className="text-sm">处理中，请稍候...</p>
            </div>
          ) : (
            <div className="flex flex-col items-center py-6">
              <div className="h-10 w-10 bg-green-100 text-green-600 rounded-full flex items-center justify-center mb-3">
                <Check className="h-5 w-5" />
              </div>
              <p className="text-green-600 font-medium">购买成功！</p>
              <p className="text-sm text-gray-500 mt-1">月度套餐已激活</p>
              {appliedCoupon && <p className="text-xs text-green-600 mt-1">优惠码已生效</p>}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
