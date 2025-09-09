/**
 * API configuration and service functions
 */

// API 기본 설정
const API_CONFIG = {
  baseUrl: process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8081",
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
export async function fetchChartData(symbol: string, timeFrame: string): Promise<ChartDataResponse[]> {
  try {
    console.log("[v0] Fetching chart data for:", symbol, "timeframe:", timeFrame)

    const mappedInterval = TIMEFRAME_MAPPING[timeFrame] || timeFrame.toLowerCase()
    const apiUrl = `${API_CONFIG.baseUrl}/api/stocks/chart?stockId=${symbol}&interval=${mappedInterval}`
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
    } catch (fetchError) {
      if (fetchError instanceof TypeError) {
        console.error("[v0] Network connection failed - Mixed Content or CORS issue")
        console.error("[v0] HTTPS environment cannot connect to HTTP localhost")
        console.error("[v0] Server URL:", API_CONFIG.baseUrl)
        console.error("[v0] Client Origin:", typeof window !== "undefined" ? window.location.origin : "unknown")
        throw new Error("네트워크 연결 실패: HTTPS 환경에서 HTTP localhost 연결 불가")
      } else if (fetchError.name === "AbortError") {
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
  } catch (error) {
    console.log("=== API ERROR DETAILS ===")
    console.log("Error Type:", error.constructor.name)
    console.log("Error Message:", error.message)

    if (!(error instanceof TypeError)) {
      console.log("Error Stack:", error.stack)
    }
    console.log("=== END ERROR DETAILS ===")

    throw error
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

    const response = await fetch(apiUrl, {
      method: "POST",
      headers: API_CONFIG.headers,
      body: JSON.stringify(portfolioData),
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
