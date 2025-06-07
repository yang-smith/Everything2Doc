// 硬币管理服务

// 硬币相关常量
export const COINS_PER_MONTH = 3
export const CHARS_PER_COIN = 12000
export const MONTHLY_PACKAGE_LIMIT = 200
export const STORAGE_KEY = "everything2doc_coins"
export const LAST_REFILL_KEY = "everything2doc_last_refill"
export const MONTHLY_PACKAGE_KEY = "everything2doc_monthly_package"
export const USED_CODES_KEY = "everything2doc_used_codes"

// 硬币数据接口
export interface CoinData {
  balance: number
  lastRefill: string // ISO日期字符串
}

// 月度套餐数据接口
export interface MonthlyPackageData {
  isActive: boolean
  usedCoins: number
  activatedAt: string // ISO日期字符串
}

// 兑换码使用记录接口
export interface UsedCodesData {
  codes: string[]
  lastUpdated: string
}

// 初始化硬币数据
export function initCoinData(): CoinData {
  const now = new Date().toISOString()
  return {
    balance: COINS_PER_MONTH,
    lastRefill: now,
  }
}

// 获取当前硬币数据
export function getCoinData(): CoinData {
  if (typeof window === "undefined") {
    return initCoinData()
  }

  try {
    const storedData = localStorage.getItem(STORAGE_KEY)
    if (!storedData) {
      const initialData = initCoinData()
      localStorage.setItem(STORAGE_KEY, JSON.stringify(initialData))
      return initialData
    }
    return JSON.parse(storedData)
  } catch (error) {
    console.error("获取硬币数据失败:", error)
    return initCoinData()
  }
}

// 保存硬币数据
export function saveCoinData(data: CoinData): void {
  if (typeof window === "undefined") return

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
  } catch (error) {
    console.error("保存硬币数据失败:", error)
  }
}

// 检查并执行月度硬币补充
export function checkAndRefillCoins(): CoinData {
  const coinData = getCoinData()
  const now = new Date()
  const lastRefill = new Date(coinData.lastRefill)

  // 检查是否是新的月份
  if (now.getMonth() !== lastRefill.getMonth() || now.getFullYear() !== lastRefill.getFullYear()) {
    coinData.balance += COINS_PER_MONTH
    coinData.lastRefill = now.toISOString()
    saveCoinData(coinData)
  }

  return coinData
}

// 计算文本需要消耗的硬币数
export function calculateRequiredCoins(text: string): number {
  if (!text) return 0
  const charCount = text.length
  return Math.max(1, Math.ceil(charCount / CHARS_PER_COIN))
}

// 获取月度套餐数据
export function getMonthlyPackageData(): MonthlyPackageData {
  if (typeof window === "undefined") {
    return { isActive: false, usedCoins: 0, activatedAt: "" }
  }

  try {
    const storedData = localStorage.getItem(MONTHLY_PACKAGE_KEY)
    if (!storedData) {
      return { isActive: false, usedCoins: 0, activatedAt: "" }
    }
    return JSON.parse(storedData)
  } catch (error) {
    console.error("获取月度套餐数据失败:", error)
    return { isActive: false, usedCoins: 0, activatedAt: "" }
  }
}

// 保存月度套餐数据
export function saveMonthlyPackageData(data: MonthlyPackageData): void {
  if (typeof window === "undefined") return

  try {
    localStorage.setItem(MONTHLY_PACKAGE_KEY, JSON.stringify(data))
  } catch (error) {
    console.error("保存月度套餐数据失败:", error)
  }
}

// 检查月度套餐是否过期
export function checkMonthlyPackageExpiry(): void {
  const packageData = getMonthlyPackageData()
  
  if (!packageData.isActive) return

  const now = new Date()
  const activatedAt = new Date(packageData.activatedAt)
  
  // 检查是否已经过了一个月
  const nextMonth = new Date(activatedAt)
  nextMonth.setMonth(nextMonth.getMonth() + 1)
  
  if (now >= nextMonth) {
    // 月度套餐已过期，重置状态
    saveMonthlyPackageData({
      isActive: false,
      usedCoins: 0,
      activatedAt: ""
    })
  }
}

// 获取已使用的兑换码
export function getUsedCodes(): UsedCodesData {
  if (typeof window === "undefined") {
    return { codes: [], lastUpdated: "" }
  }

  try {
    const storedData = localStorage.getItem(USED_CODES_KEY)
    if (!storedData) {
      return { codes: [], lastUpdated: "" }
    }
    return JSON.parse(storedData)
  } catch (error) {
    console.error("获取已使用兑换码失败:", error)
    return { codes: [], lastUpdated: "" }
  }
}

// 保存已使用的兑换码
export function saveUsedCodes(data: UsedCodesData): void {
  if (typeof window === "undefined") return

  try {
    localStorage.setItem(USED_CODES_KEY, JSON.stringify(data))
  } catch (error) {
    console.error("保存已使用兑换码失败:", error)
  }
}

// 检查兑换码是否已使用
export function isCodeUsed(code: string): boolean {
  const usedCodes = getUsedCodes()
  return usedCodes.codes.includes(code.toUpperCase())
}

// 标记兑换码为已使用
export function markCodeAsUsed(code: string): void {
  const usedCodes = getUsedCodes()
  const upperCode = code.toUpperCase()
  
  if (!usedCodes.codes.includes(upperCode)) {
    usedCodes.codes.push(upperCode)
    usedCodes.lastUpdated = new Date().toISOString()
    saveUsedCodes(usedCodes)
  }
}

// 激活月度套餐（修改版，支持兑换码）
export function activateMonthlyPackage(redemptionCode?: string): void {
  const now = new Date().toISOString()
  saveMonthlyPackageData({
    isActive: true,
    usedCoins: 0,
    activatedAt: now
  })

  // 如果提供了兑换码，标记为已使用
  if (redemptionCode) {
    markCodeAsUsed(redemptionCode)
  }
}

// 检查是否可以使用硬币（月度套餐或普通硬币）
export function canUseCoins(amount: number): boolean {
  if (amount <= 0) return true

  // 先检查月度套餐是否过期
  checkMonthlyPackageExpiry()
  
  const packageData = getMonthlyPackageData()
  
  if (packageData.isActive) {
    // 有月度套餐，检查是否超过限额
    return (packageData.usedCoins + amount) <= MONTHLY_PACKAGE_LIMIT
  } else {
    // 没有月度套餐，检查普通硬币余额
    const coinData = getCoinData()
    return coinData.balance >= amount
  }
}

// 消费硬币（修改版）
export function consumeCoins(amount: number): boolean {
  if (amount <= 0) return true

  // 先检查月度套餐是否过期
  checkMonthlyPackageExpiry()
  
  const packageData = getMonthlyPackageData()
  
  if (packageData.isActive) {
    // 有月度套餐，从月度限额中扣除
    if ((packageData.usedCoins + amount) > MONTHLY_PACKAGE_LIMIT) {
      return false // 超过月度限额
    }
    
    packageData.usedCoins += amount
    saveMonthlyPackageData(packageData)
    return true
  } else {
    // 没有月度套餐，从普通硬币中扣除
    const coinData = getCoinData()
    
    if (coinData.balance < amount) {
      return false // 硬币不足
    }
    
    coinData.balance -= amount
    saveCoinData(coinData)
    return true
  }
}

// 获取当前可用硬币信息
export function getAvailableCoinsInfo(): {
  hasMonthlyPackage: boolean
  remainingCoins?: number
  usedCoins?: number
  totalLimit?: number
} {
  // 先检查月度套餐是否过期
  checkMonthlyPackageExpiry()
  
  const packageData = getMonthlyPackageData()
  
  if (packageData.isActive) {
    return {
      hasMonthlyPackage: true,
      usedCoins: packageData.usedCoins,
      remainingCoins: MONTHLY_PACKAGE_LIMIT - packageData.usedCoins,
      totalLimit: MONTHLY_PACKAGE_LIMIT
    }
  } else {
    const coinData = getCoinData()
    return {
      hasMonthlyPackage: false,
      remainingCoins: coinData.balance
    }
  }
}

// 获取当前硬币余额（兼容性保持）
export function getCoinBalance(): number {
  const info = getAvailableCoinsInfo()
  return info.remainingCoins || 0
}

// 添加硬币
export function addCoins(amount: number): void {
  if (amount <= 0) return

  const coinData = getCoinData()
  coinData.balance += amount
  saveCoinData(coinData)
}
