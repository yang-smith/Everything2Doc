"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Check, X, Gift } from "lucide-react"
import { activateMonthlyPackage } from "@/components/summary/coin-service"

interface SubscriptionDialogProps {
  isOpen: boolean
  onClose: () => void
  onSubscribed: () => void
}

// 兑换码配置 - 6位随机字母
const REDEMPTION_CODES = {
  ABEVER: { type: "monthly", description: "月度会员兑换码" },
  XYZABC: { type: "monthly", description: "限时月度会员" },
  QWERTY: { type: "monthly", description: "30天会员体验" },
  MNOPQR: { type: "monthly", description: "测试兑换码" },
  UVWXYZ: { type: "monthly", description: "特殊兑换码" },
}

export default function SubscriptionDialog({ isOpen, onClose, onSubscribed }: SubscriptionDialogProps) {
  const [isRedeeming, setIsRedeeming] = useState(false)
  const [isComplete, setIsComplete] = useState(false)
  const [redemptionCode, setRedemptionCode] = useState("")
  const [redemptionError, setRedemptionError] = useState("")

  // 兑换码验证和激活
  const handleRedemption = () => {
    if (!redemptionCode.trim()) {
      setRedemptionError("请输入兑换码")
      return
    }

    // 验证格式：6位字母
    const codePattern = /^[A-Za-z]{6}$/
    if (!codePattern.test(redemptionCode.trim())) {
      setRedemptionError("兑换码格式错误，请输入6位字母")
      return
    }

    const code = REDEMPTION_CODES[redemptionCode.toUpperCase() as keyof typeof REDEMPTION_CODES]
    if (!code) {
      setRedemptionError("兑换码无效或已过期")
      return
    }

    setIsRedeeming(true)
    setRedemptionError("")

    // 模拟兑换延迟
    setTimeout(() => {
      setIsRedeeming(false)
      setIsComplete(true)

      // 激活月度套餐
      activateMonthlyPackage(redemptionCode.toUpperCase())

      // 通知父组件订阅成功
      onSubscribed()

      // 3秒后关闭对话框
      setTimeout(() => {
        setIsComplete(false)
        setRedemptionCode("")
        setRedemptionError("")
        onClose()
      }, 3000)
    }, 1500)
  }

  // 取消兑换
  const cancelRedemption = () => {
    setRedemptionCode("")
    setRedemptionError("")
    onClose()
  }

  // 格式化输入：只允许字母，自动转大写，最多6位
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/[^A-Za-z]/g, '').toUpperCase().slice(0, 6)
    setRedemptionCode(value)
    setRedemptionError("")
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && cancelRedemption()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            兑换月度会员
            <Button variant="ghost" size="sm" onClick={cancelRedemption} className="h-6 w-6 p-0">
              <X className="h-4 w-4" />
            </Button>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {!isRedeeming && !isComplete ? (
            <>
              {/* 会员特权说明 */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Gift className="h-5 w-5 text-blue-600" />
                  <span className="font-medium text-blue-800">月度会员特权</span>
                </div>
                <ul className="space-y-2 text-sm text-blue-700">
                  <li className="flex items-start">
                    <Check className="h-4 w-4 text-blue-600 mr-2 flex-shrink-0 mt-0.5" />
                    <span>随心使用，每月最多200硬币</span>
                  </li>
                  <li className="flex items-start">
                    <Check className="h-4 w-4 text-blue-600 mr-2 flex-shrink-0 mt-0.5" />
                    <span>无需担心硬币余额，专注内容创作</span>
                  </li>
                  <li className="flex items-start">
                    <Check className="h-4 w-4 text-blue-600 mr-2 flex-shrink-0 mt-0.5" />
                    <span>会员身份标识，尊享体验</span>
                  </li>
                </ul>
              </div>

              {/* 兑换码输入 */}
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    兑换码（6位字母）
                  </label>
                  <Input
                    placeholder="ABCDEF"
                    value={redemptionCode}
                    onChange={handleInputChange}
                    className="text-center font-mono tracking-[0.3em] text-lg uppercase"
                    maxLength={6}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        handleRedemption()
                      }
                    }}
                  />
                  {redemptionError && (
                    <p className="text-xs text-red-500 mt-1">{redemptionError}</p>
                  )}
                  <p className="text-xs text-gray-500 mt-1">
                    请输入6位字母组成的兑换码
                  </p>
                </div>
              </div>

              {/* 按钮区域 */}
              <div className="flex gap-3 pt-2">
                <Button onClick={cancelRedemption} variant="outline" className="flex-1">
                  取消
                </Button>
                <Button 
                  onClick={handleRedemption} 
                  className="flex-1 bg-blue-600 hover:bg-blue-700"
                  disabled={redemptionCode.length !== 6}
                >
                  兑换
                </Button>
              </div>
            </>
          ) : isRedeeming ? (
            <div className="flex flex-col items-center py-8">
              <div className="h-8 w-8 rounded-full border-4 border-t-blue-500 border-blue-200 animate-spin mb-3"></div>
              <p className="text-sm">正在验证兑换码...</p>
            </div>
          ) : (
            <div className="flex flex-col items-center py-8">
              <div className="h-12 w-12 bg-green-100 text-green-600 rounded-full flex items-center justify-center mb-4">
                <Check className="h-6 w-6" />
              </div>
              <p className="text-green-600 font-medium text-lg">兑换成功！</p>
              <p className="text-sm text-gray-500 mt-1">月度会员已激活</p>
              <p className="text-xs text-gray-400 mt-2">现在您可以随心使用，每月最多200硬币</p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
