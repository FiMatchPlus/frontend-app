import { API_CONFIG } from "../api"

interface BatchStockResponse {
  status: string
  message: string
  timestamp: string
  data: {
    marketStatus: {
      isOpen: boolean
      session: string
      nextClose: string
    }
    data: BatchStockItem[]
  }
}

interface BatchStockItem {
  ticker: string
  name: string
  currentPrice: number
  dailyRate: number
  dailyChange: number
  marketCap: number
  sign: "PLUS" | "MINUS" | "ZERO"
}

export interface StockPriceData {
  symbol: string
  name: string
  price: number
  change: number
  changePercent: number
  marketCap: number
  lastUpdated: number
}

export async function fetchMultipleStockPrices(codes: string[]): Promise<StockPriceData[]> {
  if (!codes.length) {
    return []
  }

  try {
    console.log("[BatchStock] Fetching prices for codes:", codes)

    const codesParam = codes.join(',')
    const apiUrl = `${API_CONFIG.baseUrl}/api/stocks?codes=${encodeURIComponent(codesParam)}`
    console.log("[BatchStock] API URL:", apiUrl)

    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), API_CONFIG.timeout)

    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: API_CONFIG.headers,
      signal: controller.signal,
    })

    clearTimeout(timeoutId)

    console.log("[BatchStock] Response Status:", response.status)
    console.log("[BatchStock] Response OK:", response.ok)

    if (!response.ok) {
      const errorText = await response.text()
      console.error("[BatchStock] Error Response:", errorText)
      throw new Error(`HTTP ${response.status}: ${response.statusText}`)
    }

    const result: BatchStockResponse = await response.json()
    console.log("[BatchStock] Response Body:", result)

    if (result.status !== 'success') {
      throw new Error(result.message || 'API 요청이 실패했습니다.')
    }

    const stockData: StockPriceData[] = result.data.data.map(item => ({
      symbol: item.ticker,
      name: item.name,
      price: item.currentPrice,
      change: item.dailyChange,
      changePercent: item.dailyRate,
      marketCap: item.marketCap,
      lastUpdated: Date.now()
    }))

    return stockData
  } catch (error) {
    if (error instanceof TypeError) {
      console.error("[BatchStock] Network connection failed - Mixed Content or CORS issue")
      console.error("[BatchStock] Server URL:", API_CONFIG.baseUrl)
      console.error("[BatchStock] Client Origin:", typeof window !== "undefined" ? window.location.origin : "unknown")
    } else if (error instanceof Error && error.name === "AbortError") {
      console.error("[BatchStock] Request timeout after", API_CONFIG.timeout, "ms")
    } else {
      console.error("[BatchStock] Batch stock API error:", error)
    }
    
    return []
  }
}

export async function fetchSingleStockPrice(code: string): Promise<StockPriceData | null> {
  const results = await fetchMultipleStockPrices([code])
  return results.length > 0 ? results[0] : null
}

