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
