import { API_CONFIG } from "../api"

interface ApiResponse<T> {
  status: string
  message: string
  timestamp: string
  data: T
}

interface PortfolioSummaryData {
  totalAssets: number
  dailyTotalReturn: number
  dailyTotalChange: number
}

interface HoldingStock {
  ticker: string
  name: string
  weight: number
  value: number
  dailyRate: number
}

interface Portfolio {
  id: number
  name: string
  description: string
  holdingStocks: HoldingStock[]
  totalAssets: number
  dailyRate: number
  dailyChange: number
}

interface PortfolioListData {
  portfolios: Portfolio[]
}

export interface PortfolioSummary {
  totalAssets: number
  dailyTotalReturn: number
  dailyTotalChange: number
}

export interface PortfolioWithDetails {
  id: number
  name: string
  description: string
  holdingStocks: HoldingStock[]
  totalAssets: number
  dailyRate: number
  dailyChange: number
}

export async function fetchPortfolioSummary(): Promise<PortfolioSummary | null> {
  const apiUrl = `${API_CONFIG.baseUrl}/api/portfolios/summary`

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
      try {
        const text = await response.text()
        console.error("[PortfolioSummary] Error Response:", text)
      } catch (_) {
        // ignore
      }
      return null
    }

    const result: ApiResponse<PortfolioSummaryData> = await response.json()
    if (result.status !== "success") {
      return null
    }

    return {
      totalAssets: result.data.totalAssets,
      dailyTotalReturn: result.data.dailyTotalReturn,
      dailyTotalChange: result.data.dailyTotalChange,
    }
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      console.error("[PortfolioSummary] Request timeout after", API_CONFIG.timeout, "ms")
    } else {
      console.error("[PortfolioSummary] fetch error:", error)
    }
    return null
  }
}

export async function fetchPortfolioList(): Promise<PortfolioWithDetails[]> {
  const apiUrl = `${API_CONFIG.baseUrl}/api/portfolios`

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
      try {
        const text = await response.text()
        console.error("[PortfolioList] Error Response:", text)
      } catch (_) {
        // ignore
      }
      return []
    }

    const result: ApiResponse<PortfolioListData> = await response.json()
    if (result.status !== "success") {
      return []
    }

    return result.data.portfolios.map((portfolio) => ({
      id: portfolio.id,
      name: portfolio.name,
      description: portfolio.description,
      holdingStocks: portfolio.holdingStocks,
      totalAssets: portfolio.totalAssets,
      dailyRate: portfolio.dailyRate,
      dailyChange: portfolio.dailyChange,
    }))
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      console.error("[PortfolioList] Request timeout after", API_CONFIG.timeout, "ms")
    } else {
      console.error("[PortfolioList] fetch error:", error)
    }
    return []
  }
}
