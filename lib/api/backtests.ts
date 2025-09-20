import { CreateBacktestData } from '@/types/portfolio'
import { API_CONFIG } from '@/lib/api'

// API 요청 타입 정의
export interface CreateBacktestRequest {
  title: string
  description?: string
  startAt: string // ISO 8601 datetime string
  endAt: string   // ISO 8601 datetime string
  rules: RulesRequest
}

export interface RulesRequest {
  memo?: string
  stopLoss: RuleItemRequest[]
  takeProfit: RuleItemRequest[]
}

export interface RuleItemRequest {
  category: string
  threshold: string
  description?: string
}

// 폼 데이터를 API 요청 형식으로 변환하는 함수
export function transformToBacktestRequest(
  formData: CreateBacktestData,
  portfolioId: string
): CreateBacktestRequest {
  // 기간 조건에서 시작일과 종료일 추출
  const periodCondition = formData.stopConditions.find(condition => condition.type === 'period')
  
  if (!periodCondition?.startDate || !periodCondition?.endDate) {
    throw new Error('기간 설정은 필수입니다.')
  }

  // 손절 조건들 변환
  const stopLoss: RuleItemRequest[] = formData.stopConditions
    .filter(condition => condition.type === 'stopLoss')
    .map(condition => ({
      category: condition.criteria || '',
      threshold: condition.value || '',
      description: condition.description
    }))

  // 익절 조건들 변환
  const takeProfit: RuleItemRequest[] = formData.stopConditions
    .filter(condition => condition.type === 'takeProfit')
    .map(condition => ({
      category: condition.criteria || '',
      threshold: condition.value || '',
      description: condition.description
    }))

  return {
    title: formData.name,
    description: formData.memo || undefined,
    startAt: `${periodCondition.startDate}T00:00:00`,
    endAt: `${periodCondition.endDate}T23:59:59`,
    rules: {
      memo: formData.memo || undefined,
      stopLoss,
      takeProfit
    }
  }
}

// 백테스트 생성 API 응답 타입
export interface CreateBacktestResponse {
  status: string
  message: string
  timestamp: string
  data: string // 백테스트 ID
}

// 백테스트 상태 목록 조회 API 응답 타입
export interface BacktestStatusListResponse {
  status: string
  message: string
  timestamp: string
  data: Record<string, 'CREATED' | 'RUNNING' | 'COMPLETED' | 'FAILED'>
}

// 백테스트 상세 조회 API 응답 타입
export interface BacktestDetailResponse {
  status: string
  message: string
  timestamp: string
  data: {
    historyId: string
    name: string
    period: string
    executionTime: number
    metrics: {
      totalReturn: number
      annualizedReturn: number
      volatility: number
      sharpeRatio: number
      maxDrawdown: number
      winRate: number
      profitLossRatio: number
    }
    dailyEquity: Array<{
      date: string
      stocks: Record<string, number>
    }>
    holdings: Array<{
      stockName: string
      quantity: number
    }>
  }
}


// 백테스트 생성 API 호출 함수 (비동기 작업 큐 방식)
export async function createBacktest(
  portfolioId: string,
  requestData: CreateBacktestRequest
): Promise<CreateBacktestResponse> {
  // 백테스트 요청은 즉시 응답하므로 기본 타임아웃 사용
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), API_CONFIG.timeout)

  try {
    const response = await fetch(`${API_CONFIG.baseUrl}/api/backtests/portfolio/${portfolioId}`, {
      method: 'POST',
      headers: API_CONFIG.headers,
      body: JSON.stringify(requestData),
      signal: controller.signal,
    })

    clearTimeout(timeoutId)

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(errorData.message || `백테스트 생성에 실패했습니다. (${response.status})`)
    }

    const result: CreateBacktestResponse = await response.json()
    console.log("[Backtest] 백테스트 실행 시작됨:", result.data) // 백테스트 ID 로깅
    return result
  } catch (error) {
    clearTimeout(timeoutId)
    
    if (error instanceof Error && error.name === "AbortError") {
      console.error("[Backtest] Request timeout after", API_CONFIG.timeout, "ms")
      throw new Error("백테스트 요청 시간이 초과되었습니다. 잠시 후 다시 시도해주세요.")
    }
    
    throw error
  }
}

// 포트폴리오의 백테스트 상태 목록 조회 API 호출 함수 (효율적인 상태 동기화용)
export async function getPortfolioBacktestStatuses(portfolioId: string): Promise<Record<string, 'CREATED' | 'RUNNING' | 'COMPLETED' | 'FAILED'>> {
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), API_CONFIG.timeout)

  try {
    const response = await fetch(`${API_CONFIG.baseUrl}/api/backtests/portfolios/${portfolioId}/status`, {
      method: 'GET',
      headers: API_CONFIG.headers,
      signal: controller.signal,
    })

    clearTimeout(timeoutId)

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(errorData.message || `백테스트 상태 목록 조회에 실패했습니다. (${response.status})`)
    }

    const result: BacktestStatusListResponse = await response.json()
    console.log("[Backtest] 백테스트 상태 목록 조회:", result.data)
    return result.data
  } catch (error) {
    clearTimeout(timeoutId)
    
    if (error instanceof Error && error.name === "AbortError") {
      console.error("[Backtest] Status list timeout after", API_CONFIG.timeout, "ms")
      throw new Error("백테스트 상태 목록 조회 시간이 초과되었습니다.")
    }
    
    throw error
  }
}

// 백테스트 상세 조회 API 호출 함수
export async function getBacktestDetail(backtestId: string): Promise<BacktestDetailResponse> {
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), API_CONFIG.timeout)

  try {
    const response = await fetch(`${API_CONFIG.baseUrl}/api/backtests/${backtestId}`, {
      method: 'GET',
      headers: API_CONFIG.headers,
      signal: controller.signal,
    })

    clearTimeout(timeoutId)

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(errorData.message || `백테스트 상세 조회에 실패했습니다. (${response.status})`)
    }

    const result: BacktestDetailResponse = await response.json()
    console.log("[Backtest] 백테스트 상세 조회 성공:", result.data.historyId)
    return result
  } catch (error) {
    clearTimeout(timeoutId)
    
    if (error instanceof Error && error.name === "AbortError") {
      console.error("[Backtest] Detail request timeout after", API_CONFIG.timeout, "ms")
      throw new Error("백테스트 상세 조회 시간이 초과되었습니다.")
    }
    
    throw error
  }
}
