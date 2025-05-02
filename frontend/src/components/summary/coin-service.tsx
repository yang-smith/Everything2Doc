// 硬币管理服务

// 硬币相关常量
export const COINS_PER_MONTH = 1
export const CHARS_PER_COIN = 6000
export const STORAGE_KEY = "everything2doc_coins"
export const LAST_REFILL_KEY = "everything2doc_last_refill"

// 硬币数据接口
export interface CoinData {
  balance: number
  lastRefill: string // ISO日期字符串
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

// 消费硬币
export function consumeCoins(amount: number): boolean {
  if (amount <= 0) return true

  const coinData = getCoinData()

  if (coinData.balance < amount) {
    return false // 硬币不足
  }

  coinData.balance -= amount
  saveCoinData(coinData)
  return true
}

// 添加硬币
export function addCoins(amount: number): void {
  if (amount <= 0) return

  const coinData = getCoinData()
  coinData.balance += amount
  saveCoinData(coinData)
}

// 获取当前硬币余额
export function getCoinBalance(): number {
  return getCoinData().balance
}
