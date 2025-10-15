import type { BacktestResponse, PortfolioMainData } from "@/types/portfolio"

export const API_CONFIG = {
  baseUrl: "https://fi-match.shop",
  timeout: 10000,
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
}

const TIMEFRAME_MAPPING: Record<string, string> = {
  "1D": "1d",
}

interface ApiResponse<T> {
  status: string
  message: string
  timestamp: string
  data: T
}

interface ChartDataResponse {
  timestamp: string
  open: number
  close: number
  high: number
  low: number
  volume: number
}

export async function fetchChartData(
  symbol: string, 
  timeFrame: string, 
  startDate?: string, 
  endDate?: string
): Promise<ChartDataResponse[]> {
  try {
    console.log("Fetching chart data for:", symbol, "timeframe:", timeFrame, "range:", startDate, "~", endDate)

    const mappedInterval = TIMEFRAME_MAPPING[timeFrame] || timeFrame.toLowerCase()
    
    const params = new URLSearchParams({
      stockId: symbol,
      interval: mappedInterval
    })
    
    if (startDate) params.append('startDate', startDate)
    if (endDate) params.append('endDate', endDate)
    
    const apiUrl = `${API_CONFIG.baseUrl}/api/stocks/chart?${params.toString()}`
    console.log("API URL:", apiUrl)

    console.log("Request headers:", API_CONFIG.headers)

    let response: Response
    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), API_CONFIG.timeout)

      response = await fetch(apiUrl, {
        method: "GET",
        headers: API_CONFIG.headers,
        signal: controller.signal,
      })

      clearTimeout(timeoutId)
    } catch (fetchError: unknown) {
      if (fetchError instanceof TypeError) {
        console.error("Network connection failed - Mixed Content or CORS issue")
        console.error("HTTPS environment cannot connect to HTTP localhost")
        console.error("Server URL:", API_CONFIG.baseUrl)
        console.error("Client Origin:", typeof window !== "undefined" ? window.location.origin : "unknown")
        throw new Error("네트워크 연결 실패: HTTPS 환경에서 HTTP localhost 연결 불가")
      } else if (
        typeof fetchError === "object" &&
        fetchError !== null &&
        "name" in fetchError &&
        (fetchError as { name?: string }).name === "AbortError"
      ) {
        console.error("Request timeout after", API_CONFIG.timeout, "ms")
        throw new Error("요청 시간 초과")
      } else {
        console.error("Unexpected fetch error:", fetchError)
        throw new Error("네트워크 요청 실패")
      }
    }

    console.log("=== COMPLETE API RESPONSE ===")
    console.log("Response Status:", response.status)
    console.log("Response Status Text:", response.statusText)
    console.log("Response URL:", response.url)
    console.log("Response Type:", response.type)
    console.log("Response Redirected:", response.redirected)
    console.log("Response OK:", response.ok)

    const responseHeaders = Object.fromEntries(response.headers.entries())
    console.log("All Response Headers:", responseHeaders)

    const corsHeaders = {
      "access-control-allow-origin": response.headers.get("access-control-allow-origin"),
      "access-control-allow-methods": response.headers.get("access-control-allow-methods"),
      "access-control-allow-headers": response.headers.get("access-control-allow-headers"),
      "access-control-allow-credentials": response.headers.get("access-control-allow-credentials"),
    }
    console.log("CORS Headers:", corsHeaders)

    if (!response.ok) {
      const errorText = await response.text()
      console.log("Response Body:", errorText)
      console.log("=== END API RESPONSE ===")
      throw new Error(`HTTP ${response.status}: ${response.statusText}`)
    }

    const result: ApiResponse<ChartDataResponse[]> = await response.json()
    console.log("Response Body:", result)

    if (result.status !== "success") {
      throw new Error(result.message || "데이터 조회에 실패했습니다.")
    }

    return result.data
  } catch (error: unknown) {
    console.log("=== API ERROR DETAILS ===")
    if (error instanceof Error) {
      console.log("Error Type:", error.constructor.name)
      console.log("Error Message:", error.message)
      if (!(error instanceof TypeError)) {
        console.log("Error Stack:", error.stack)
      }
    } else {
      console.log("Non-Error thrown:", String(error))
    }
    console.log("=== END ERROR DETAILS ===")

    throw error as unknown as Error
  }
}

export function transformChartData(apiData: ChartDataResponse[]) {
  return apiData.map((item) => ({
    timestamp: new Date(item.timestamp).getTime(),
    open: item.open,
    high: item.high,
    low: item.low,
    close: item.close,
    volume: item.volume,
  }))
}

interface CreatePortfolioResponse {
  id: string
  name: string
  description: string
  totalValue: number
  stockHoldings: any[]
  rule: any
  createdAt: string
  updatedAt: string
}

export async function createPortfolio(portfolioData: any): Promise<CreatePortfolioResponse> {
  try {
    console.log("[API] Creating portfolio:", portfolioData)

    const apiUrl = `${API_CONFIG.baseUrl}/api/portfolios`
    console.log("[API] API URL:", apiUrl)

    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), API_CONFIG.timeout)

    const requestBody = {
      ...portfolioData,
      holdings: portfolioData.stockHoldings,
      rules: portfolioData.rule,
    }
    delete (requestBody as any).stockHoldings
    delete (requestBody as any).rule

    const response = await fetch(apiUrl, {
      method: "POST",
      headers: API_CONFIG.headers,
      body: JSON.stringify(requestBody),
      signal: controller.signal,
    })

    clearTimeout(timeoutId)

    console.log("[API] Response Status:", response.status)
    console.log("[API] Response OK:", response.ok)

    if (!response.ok) {
      const errorText = await response.text()
      console.error("[API] Error Response:", errorText)
      throw new Error(`HTTP ${response.status}: ${response.statusText}`)
    }

    const result: ApiResponse<CreatePortfolioResponse> = await response.json()
    console.log("[API] Response Body:", result)

    if (result.status !== "success") {
      throw new Error(result.message || "포트폴리오 생성에 실패했습니다.")
    }

    return result.data
  } catch (error) {
    console.error("[API] Portfolio creation error:", error)
    throw error
  }
}

export async function fetchPortfolioBacktests(portfolioId: string): Promise<BacktestResponse[]> {
  try {
    console.log("[API] Fetching backtests for portfolio:", portfolioId)

    const apiUrl = `${API_CONFIG.baseUrl}/api/backtests/portfolio/${portfolioId}`
    console.log("[API] API URL:", apiUrl)

    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), API_CONFIG.timeout)

    const response = await fetch(apiUrl, {
      method: "GET",
      headers: {
        ...API_CONFIG.headers,
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      },
      signal: controller.signal,
    })

    clearTimeout(timeoutId)

    console.log("[API] Response Status:", response.status)
    console.log("[API] Response OK:", response.ok)

    if (!response.ok) {
      const errorText = await response.text()
      console.error("[API] Error Response:", errorText)
      throw new Error(`HTTP ${response.status}: ${response.statusText}`)
    }

    const result: ApiResponse<BacktestResponse[]> = await response.json()
    console.log("[API] Response Body:", result)

    if (result.status !== "success") {
      throw new Error(result.message || "백테스트 내역 조회에 실패했습니다.")
    }

    return result.data
  } catch (error) {
    console.error("[API] Backtest fetch error:", error)
    throw error
  }
}

export async function fetchPortfolioMain(): Promise<PortfolioMainData> {
  try {
    console.log("[API] Fetching main portfolio data")

    const apiUrl = `${API_CONFIG.baseUrl}/api/portfolios/main`
    console.log("[API] API URL:", apiUrl)

    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), API_CONFIG.timeout)

    const response = await fetch(apiUrl, {
      method: "GET",
      headers: API_CONFIG.headers,
      signal: controller.signal,
    })

    clearTimeout(timeoutId)

    console.log("[API] Response Status:", response.status)
    console.log("[API] Response OK:", response.ok)

    if (!response.ok) {
      const errorText = await response.text()
      console.error("[API] Error Response:", errorText)
      throw new Error(`HTTP ${response.status}: ${response.statusText}`)
    }

    const result: ApiResponse<PortfolioMainData> = await response.json()
    console.log("[API] Response Body:", result)

    if (result.status !== "success") {
      throw new Error(result.message || "포트폴리오 정보 조회에 실패했습니다.")
    }

    return result.data
  } catch (error) {
    throw error
  }
}

export async function executeBacktest(backtestId: number): Promise<{ success: boolean; message?: string; backtestId?: string }> {
  try {
    console.log("[API] Executing backtest:", backtestId)

    const apiUrl = `${API_CONFIG.baseUrl}/api/backtests/${backtestId}/execute`
    console.log("[API] API URL:", apiUrl)

    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), API_CONFIG.timeout)

    const response = await fetch(apiUrl, {
      method: "POST",
      headers: API_CONFIG.headers,
      signal: controller.signal,
    })

    clearTimeout(timeoutId)

    console.log("[API] Response Status:", response.status)
    console.log("[API] Response OK:", response.ok)

    if (!response.ok) {
      const errorText = await response.text()
      console.error("[API] Error Response:", errorText)
      throw new Error(`HTTP ${response.status}: ${response.statusText}`)
    }

    const result = await response.json()
    console.log("[API] Execute backtest result:", result)

    return { 
      success: true, 
      message: result.message || "백테스트 실행이 시작되었습니다",
      backtestId: result.data 
    }
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      console.error("[API] Execute backtest request timeout")
      throw new Error("백테스트 실행 요청 시간이 초과되었습니다.")
    } else {
      console.error("[API] Execute backtest error:", error)
      throw error instanceof Error ? error : new Error("백테스트 실행 요청에 실패했습니다.")
    }
  }
}

export interface StockMultiData {
  ticker: string
  name: string
  currentPrice: number
  dailyRate: number
  dailyChange: number
  marketCap: number
  sign: string
}

export interface StockMultiResponse {
  status: string
  message: string
  timestamp: string
  data: {
    marketStatus: {
      isOpen: boolean
      session: string
      nextClose: string
    }
    data: StockMultiData[]
  }
}

export async function fetchMultiStockPrices(codes: string[]): Promise<StockMultiData[]> {
  try {
    console.log("[API] Fetching multi stock prices for:", codes)

    const params = codes.map(code => `codes=${code}`).join('&')
    const apiUrl = `${API_CONFIG.baseUrl}/api/stocks/multi?${params}`
    console.log("[API] API URL:", apiUrl)

    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), API_CONFIG.timeout)

    const response = await fetch(apiUrl, {
      method: "GET",
      headers: API_CONFIG.headers,
      signal: controller.signal,
    })

    clearTimeout(timeoutId)

    console.log("[API] Response Status:", response.status)
    console.log("[API] Response OK:", response.ok)

    if (!response.ok) {
      const errorText = await response.text()
      console.error("[API] Error Response:", errorText)
      throw new Error(`HTTP ${response.status}: ${response.statusText}`)
    }

    const result: StockMultiResponse = await response.json()
    console.log("[API] Response Body:", result)

    if (result.status !== "success") {
      throw new Error(result.message || "주식 데이터 조회에 실패했습니다.")
    }

    console.log("[API] Stock data array:", result.data.data)
    return result.data.data
  } catch (error) {
    console.error("[API] Multi stock fetch error:", error)
    throw error
  }
}
