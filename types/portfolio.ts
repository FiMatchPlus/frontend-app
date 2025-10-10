// Portfolio creation types

export interface StockHolding {
  symbol: string
  name: string
  shares: number
  currentPrice: number
  totalValue: number
  change: number
  changePercent: number
  weight: number
}

export interface RuleItem {
  category: string
  threshold?: string
  description?: string
}

export interface Rule {
  memo: string
  rebalance: RuleItem[]
  stopLoss: RuleItem[]
  takeProfit: RuleItem[]
}

export interface CreatePortfolioData {
  name: string
  totalValue: number          // 자동 계산되는 포트폴리오 가치
  description: string
  stockHoldings: StockHolding[]
  rule: Rule
}

// Backtest types
export interface BacktestMetrics {
  total_return: number
  annualized_return: number
  volatility: number
  sharpe_ratio: number
  max_drawdown: number
  win_rate: number
  profit_loss_ratio: number
}

export interface BacktestData {
  id: number
  name: string
  period: string
  execution_time: number
  createdAt: string
  metrics: BacktestMetrics
  daily_returns: Array<{
    date: string
    [key: string]: string | number
  }>
}

export type BacktestStatus = 'created' | 'running' | 'completed' | 'failed'

export interface BacktestResponse {
  id: number
  name: string
  period: string
  execution_time: number
  createdAt: string
  status: BacktestStatus
  metrics?: BacktestMetrics  // 실행 완료된 경우에만 존재
  daily_returns?: Array<{
    date: string
    [key: string]: string | number
  }>  // 실행 완료된 경우에만 존재
}

// Backtest creation types
export interface StopCondition {
  id: string
  type: 'stopLoss' | 'takeProfit' | 'period'
  startDate?: string
  endDate?: string
  criteria?: string  // 손절/익절 기준
  value?: string     // 기준값
  description?: string
}

export interface CreateBacktestData {
  name: string
  memo?: string
  stopConditions: StopCondition[]
}

// Portfolio main data types
export interface HoldingSummary {
  name: string
  weight: number
  dailyRate: number
}

export interface PortfolioMainData {
  name: string
  totalValue: number
  holdings: HoldingSummary[]
  dailySum: number
}

// 포트폴리오 상세 분석 관련 타입들
export interface AnalysisMetrics {
  stdDeviation: number    // 표준편차 (변동성)
  sharpeRatio: number     // 샤프비율
  expectedReturn?: number // 기대수익률 (선택적)
}

export interface AnalysisResult {
  type: 'user' | 'min-variance' | 'max-sharpe'
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH'
  holdings: Record<string, number> // ticker -> weight (0-1 사이 비율)
  metrics?: AnalysisMetrics        // 분석 메트릭 (선택적)
  strengths?: string[]             // 강점 (선택적)
  weaknesses?: string[]            // 약점 (선택적)
}

export interface PortfolioAnalysis {
  status: 'COMPLETED' | 'RUNNING' | 'PENDING' | 'FAILED'
  portfolioName?: string           // 포트폴리오 이름 (선택적)
  results: AnalysisResult[]
  analysisDate?: string            // 분석 일시 (선택적)
  analysisPeriod?: {               // 분석 기간 (선택적)
    startDate: string
    endDate: string
  }
}

// 위험도 표시를 위한 상수 (products 페이지와 동일)
export const PORTFOLIO_RISK_LEVEL_LABELS = {
  LOW: '위험도 낮음',
  MEDIUM: '위험도 보통', 
  HIGH: '위험도 높음',
  VERY_HIGH: '위험도 매우 높음'
} as const

export const PORTFOLIO_RISK_LEVEL_COLORS = {
  LOW: 'text-green-600 bg-green-50',
  MEDIUM: 'text-yellow-600 bg-yellow-50',
  HIGH: 'text-orange-600 bg-orange-50',
  VERY_HIGH: 'text-red-600 bg-red-50'
} as const
