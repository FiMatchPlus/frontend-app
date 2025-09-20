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
