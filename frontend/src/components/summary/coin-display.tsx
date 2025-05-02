"use client"

import { useState } from "react"
import { Coins, Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"

interface CoinDisplayProps {
  coinBalance: number
  onPurchase?: (amount: number) => void
}

interface CoinPackage {
  amount: number
  price: number
  isPopular?: boolean
  isBestValue?: boolean
}

export default function CoinDisplay({ coinBalance, onPurchase }: CoinDisplayProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false)

  // 硬币套餐配置
  const coinPackages: CoinPackage[] = [
    { amount: 3, price: 3 },
    { amount: 10, price: 8, isPopular: true },
    { amount: 25, price: 20 },
    { amount: 60, price: 50 },
    { amount: 100, price: 80, isPopular: true },
    { amount: 300, price: 199, isBestValue: true },
  ]

  // 处理购买硬币
  const handlePurchase = (amount: number, price: number) => {
    if (onPurchase) {
      onPurchase(amount)
      setIsDialogOpen(false)
    }
  }

  return (
    <div className="flex items-center">
      <div className="flex items-center bg-amber-50 text-amber-800 rounded-full px-3 py-1 text-sm">
        <Coins className="h-4 w-4 mr-1.5 text-amber-500" />
        <span>{coinBalance}</span>
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogTrigger asChild>
          <Button variant="ghost" size="icon" className="ml-1 h-7 w-7">
            <Plus className="h-4 w-4" />
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>购买硬币</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <p className="text-sm text-muted-foreground">选择您想要购买的硬币数量：</p>
            <div className="space-y-4">
              {/* 第一行 - 小额套餐 */}
              <div className="grid grid-cols-3 gap-3">
                {coinPackages.slice(0, 3).map((pkg) => (
                  <Button
                    key={pkg.amount}
                    onClick={() => handlePurchase(pkg.amount, pkg.price)}
                    className={`flex flex-col h-auto py-3 px-4 ${pkg.isPopular ? "bg-blue-600 hover:bg-blue-700" : ""}`}
                  >
                    <span className="font-bold text-lg">{pkg.amount}</span>
                    <div className="flex items-center mt-1">
                      <span className="text-sm">¥{pkg.price}</span>
                      {pkg.isPopular && (
                        <span className="ml-2 text-[10px] bg-yellow-400 text-yellow-800 px-1 rounded">热门</span>
                      )}
                    </div>
                  </Button>
                ))}
              </div>

              {/* 第二行 - 大额套餐 */}
              <div className="grid grid-cols-3 gap-3">
                {coinPackages.slice(3).map((pkg) => (
                  <Button
                    key={pkg.amount}
                    onClick={() => handlePurchase(pkg.amount, pkg.price)}
                    className={`flex flex-col h-auto py-3 px-4 ${
                      pkg.isBestValue
                        ? "bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700"
                        : pkg.isPopular
                          ? "bg-blue-600 hover:bg-blue-700"
                          : ""
                    }`}
                  >
                    <span className="font-bold text-lg">{pkg.amount}</span>
                    <div className="flex items-center mt-1">
                      <span className="text-sm">¥{pkg.price}</span>
                      {pkg.isPopular && (
                        <span className="ml-2 text-[10px] bg-yellow-400 text-yellow-800 px-1 rounded">热门</span>
                      )}
                      {pkg.isBestValue && (
                        <span className="ml-2 text-[10px] bg-green-400 text-green-800 px-1 rounded">最划算</span>
                      )}
                    </div>
                  </Button>
                ))}
              </div>
            </div>
            <p className="text-xs text-center text-muted-foreground mt-4">每月自动获得1枚免费硬币</p>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
