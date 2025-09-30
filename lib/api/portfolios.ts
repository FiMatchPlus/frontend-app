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

// 포트폴리오 상세 정보 인터페이스
export interface PortfolioDetailData {
  portfolioId: number
  holdings: Array<{
    name: string
    weight: number
    value: number
    dailyRate: number
  }>
  ruleId: string
  rules: {
    id: string
    memo: string
    basicBenchmark: string
    benchmark: {
      code: string
      name: string
      description: string
    }
    rebalance: Array<{
      category: string
      threshold: string
      description: string
    }>
    stopLoss: Array<{
      category: string
      threshold: string
      description: string
    }>
    takeProfit: Array<{
      category: string
      threshold: string
      description: string
    }>
    createdAt: string
    updatedAt: string
  }
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

// 포트폴리오 상세 정보를 가져오는 함수
export async function fetchPortfolioDetail(portfolioId: string): Promise<PortfolioDetailData | null> {
  const apiUrl = `${API_CONFIG.baseUrl}/api/portfolios/${portfolioId}/long`

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
        console.error("[PortfolioDetail] Error Response:", text)
      } catch (_) {
        // ignore
      }
      return null
    }

    const result: ApiResponse<PortfolioDetailData> = await response.json()
    if (result.status !== "success") {
      return null
    }

    return result.data
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      console.error("[PortfolioDetail] Request timeout after", API_CONFIG.timeout, "ms")
    } else {
      console.error("[PortfolioDetail] fetch error:", error)
    }
    return null
  }
}
