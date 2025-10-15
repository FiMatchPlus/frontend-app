import type { StockSearchResult } from "@/types/stock"
import { API_CONFIG } from "../api"

interface ApiResponse<T> {
  status: string
  message: string
  timestamp: string
  data: T
}

export interface StockSearchAPIResponse {
  status: string
  message: string
  timestamp: string
  data: {
    results: StockSearchResult[]
    total: number
  }
}

export async function searchStocks(query: string): Promise<StockSearchResult[]> {
  if (!query.trim()) {
    return []
  }

  try {
    console.log("[StockSearch] Searching stocks for:", query)

    const apiUrl = `${API_CONFIG.baseUrl}/api/stocks/search?keyword=${encodeURIComponent(query)}`
    console.log("[StockSearch] API URL:", apiUrl)

    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), API_CONFIG.timeout)

    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: API_CONFIG.headers,
      signal: controller.signal,
    })

    clearTimeout(timeoutId)

    console.log("[StockSearch] Response Status:", response.status)
    console.log("[StockSearch] Response OK:", response.ok)

    if (!response.ok) {
      const errorText = await response.text()
      console.error("[StockSearch] Error Response:", errorText)
      throw new Error(`HTTP ${response.status}: ${response.statusText}`)
    }

    const data: StockSearchAPIResponse = await response.json()
    
    if (data.status !== 'success') {
      throw new Error(data.message || 'API 요청이 실패했습니다.')
    }
    
    const sanitized = (data.data.results || []).map(r => ({
      symbol: r.symbol,
      name: r.name,
      sector: r.sector,
    }))
    return sanitized
  } catch (error) {
    if (error instanceof TypeError) {
      console.error("[StockSearch] Network connection failed - Mixed Content or CORS issue")
      console.error("[StockSearch] Server URL:", API_CONFIG.baseUrl)
      console.error("[StockSearch] Client Origin:", typeof window !== "undefined" ? window.location.origin : "unknown")
    } else if (error instanceof Error && error.name === "AbortError") {
      console.error("[StockSearch] Request timeout after", API_CONFIG.timeout, "ms")
    } else {
      console.error("[StockSearch] Stock search API error:", error)
    }
    
    return []
  }
}

export async function getPopularStocks(): Promise<StockSearchResult[]> {
  try {
    console.log("[StockSearch] Fetching popular stocks")

    const apiUrl = `${API_CONFIG.baseUrl}/api/stocks/popular`
    console.log("[StockSearch] API URL:", apiUrl)

    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), API_CONFIG.timeout)

    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: API_CONFIG.headers,
      signal: controller.signal,
    })

    clearTimeout(timeoutId)

    console.log("[StockSearch] Response Status:", response.status)
    console.log("[StockSearch] Response OK:", response.ok)

    if (!response.ok) {
      const errorText = await response.text()
      console.error("[StockSearch] Error Response:", errorText)
      throw new Error(`HTTP ${response.status}: ${response.statusText}`)
    }

    const data: StockSearchAPIResponse = await response.json()
    
    if (data.status !== 'success') {
      throw new Error(data.message || 'API 요청이 실패했습니다.')
    }
    
    const sanitized = (data.data.results || []).map(r => ({
      symbol: r.symbol,
      name: r.name,
      sector: r.sector,
    }))
    return sanitized
  } catch (error) {
    if (error instanceof TypeError) {
      console.error("[StockSearch] Network connection failed - Mixed Content or CORS issue")
      console.error("[StockSearch] Server URL:", API_CONFIG.baseUrl)
      console.error("[StockSearch] Client Origin:", typeof window !== "undefined" ? window.location.origin : "unknown")
    } else if (error instanceof Error && error.name === "AbortError") {
      console.error("[StockSearch] Request timeout after", API_CONFIG.timeout, "ms")
    } else {
      console.error("[StockSearch] Popular stocks API error:", error)
    }
    
    return []
  }
}
