import { API_CONFIG } from "../api"

interface ApiResponse<T> {
  status: string
  message: string
  timestamp: string
  data: T
}

interface NowApiItem {
  ticker: string
  name: string
  currentPrice: number
  previousClose: number
  dailyRate: number
  dailyChange: number
  marketCap: number
}

interface NowApiData {
  marketStatus: {
    isOpen: boolean
    session: string
    nextClose: string
  }
  data: NowApiItem[]
}

export interface CurrentPriceResult {
  symbol: string
  name?: string
  price: number
  changePercent: number
}

export async function fetchCurrentPriceByCode(code: string): Promise<CurrentPriceResult | null> {
  if (!code || !code.trim()) {
    return null
  }

  const apiUrl = `${API_CONFIG.baseUrl}/api/stocks/now?code=${encodeURIComponent(code)}`

  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), API_CONFIG.timeout)

  try {
    const response = await fetch(apiUrl, {
      method: "GET",
      headers: API_CONFIG.headers,
      signal: controller.signal,
    })

    clearTimeout(timeoutId)

    if (!response.ok) {
      // Log and fail soft
      try {
        const text = await response.text()
        console.error("[StockNow] Error Response:", text)
      } catch (_) {
        // ignore
      }
      return null
    }

    const result: ApiResponse<NowApiData> = await response.json()
    if (result.status !== "success") {
      return null
    }

    const first = result.data?.data?.[0]
    if (!first) return null

    return {
      symbol: first.ticker,
      name: first.name,
      price: first.currentPrice,
      changePercent: first.dailyRate,
    }
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      console.error("[StockNow] Request timeout after", API_CONFIG.timeout, "ms")
    } else {
      console.error("[StockNow] fetch error:", error)
    }
    return null
  }
}
