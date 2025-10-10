/**
 * API configuration and service functions
 */

import type { BacktestResponse, PortfolioMainData } from "@/types/portfolio"

// API 기본 설정
export const API_CONFIG = {
  baseUrl: "https://fi-match.shop",
  timeout: 10000,
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
}

const TIMEFRAME_MAPPING: Record<string, string> = {
  "1m": "1m",
  "1D": "1d",
  "1W": "1w",
  "1M": "1M",
  "1Y": "1y",
}

// API 응답 타입 정의
interface ApiResponse<T> {
  status: string
  message: string
  timestamp: string
  data: T
}

// 차트 데이터 API 응답 타입
interface ChartDataResponse {
  timestamp: string
  open: number
  close: number
  high: number
  low: number
  volume: number
}

/**
 * 차트 데이터를 서버에서 가져오는 함수
 */
export async function fetchChartData(
  symbol: string, 
  timeFrame: string, 
  startDate?: string, 
  endDate?: string
): Promise<ChartDataResponse[]> {
  try {
    console.log("[v0] Fetching chart data for:", symbol, "timeframe:", timeFrame, "range:", startDate, "~", endDate)

    const mappedInterval = TIMEFRAME_MAPPING[timeFrame] || timeFrame.toLowerCase()
    
    // 기본 URL에 파라미터 추가
    const params = new URLSearchParams({
      stockId: symbol,
      interval: mappedInterval
    })
    
    if (startDate) params.append('startDate', startDate)
    if (endDate) params.append('endDate', endDate)
    
    const apiUrl = `${API_CONFIG.baseUrl}/api/stocks/chart?${params.toString()}`
    console.log("[v0] API URL:", apiUrl)

    console.log("[v0] Request headers:", API_CONFIG.headers)

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
        console.error("[v0] Network connection failed - Mixed Content or CORS issue")
        console.error("[v0] HTTPS environment cannot connect to HTTP localhost")
        console.error("[v0] Server URL:", API_CONFIG.baseUrl)
        console.error("[v0] Client Origin:", typeof window !== "undefined" ? window.location.origin : "unknown")
        throw new Error("네트워크 연결 실패: HTTPS 환경에서 HTTP localhost 연결 불가")
      } else if (
        typeof fetchError === "object" &&
        fetchError !== null &&
        "name" in fetchError &&
        (fetchError as { name?: string }).name === "AbortError"
      ) {
        console.error("[v0] Request timeout after", API_CONFIG.timeout, "ms")
        throw new Error("요청 시간 초과")
      } else {
        console.error("[v0] Unexpected fetch error:", fetchError)
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

    // CORS 관련 헤더들 개별 확인
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

/**
 * API 응답 데이터를 차트 데이터 형식으로 변환
 */
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

// 포트폴리오 생성 API 응답 타입
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

/**
 * 포트폴리오를 생성하는 함수
 */
export async function createPortfolio(portfolioData: any): Promise<CreatePortfolioResponse> {
  try {
    console.log("[API] Creating portfolio:", portfolioData)

    const apiUrl = `${API_CONFIG.baseUrl}/api/portfolios`
    console.log("[API] API URL:", apiUrl)

    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), API_CONFIG.timeout)

    // Map client keys to server-expected keys
    const requestBody = {
      ...portfolioData,
      holdings: portfolioData.stockHoldings,
      rules: portfolioData.rule,
    }
    // Remove client-only keys to avoid ambiguity
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

/**
 * 포트폴리오의 백테스트 내역을 가져오는 함수
 */
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

/**
 * 메인 포트폴리오 정보를 가져오는 함수
 */
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
    // Silenced detailed console error for portfolio main fetch
    throw error
  }
}

/**
 * 백테스트를 실행하는 함수 (비동기 작업 큐 방식)
 * 즉시 응답을 받고 백테스트는 백그라운드에서 실행됨
 */
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

    // 비동기 작업 큐 방식: 즉시 응답 받음
    // 응답 형태: { "status": "success", "message": "백테스트 실행이 시작되었습니다", "data": "123" }
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
