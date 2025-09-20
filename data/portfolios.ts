export interface StockHolding {
  symbol: string
  name: string
  shares: number
  currentPrice: number
  totalValue: number
  change: number
  changePercent: number
  weight: number // percentage of portfolio
}

export interface Portfolio {
  id: number
  name: string
  totalValue: number
  change: number
  changeAmount: number
  description: string
  stockHoldings: StockHolding[] // detailed stock information
  riskLevel: string
  createdDate: string
  dividendYield: number
  maxDrawdown: number
  sharpeRatio: number
}

export interface PortfolioWithDetails extends Portfolio {
  holdings: Array<{
    name: string
    percent: number
    amount: number
    change: number
    color: string
  }>
  topHoldings: Array<{
    name: string
    percent: number
  }>
  strategy: {
    name: string
    description: string
    rebalanceFrequency: string
    stopLoss: number
    takeProfit: number
  }
  logs: Array<{
    date: string
    type: "매수" | "매도" | "배당" | "리밸런싱"
    description: string
    amount?: number
  }>
  alerts: Array<{
    type: "info" | "warning" | "success"
    message: string
    date: string
  }>
  backtests: BacktestSummary[]
}

// Backtest related types (aligned with server response shape but simplified for FE mock)
export interface BacktestMetrics {
  total_return: number
  annualized_return: number
  volatility: number
  sharpe_ratio: number
  max_drawdown: number
  var_95: number
  var_99: number
  cvar_95: number
  cvar_99: number
  win_rate: number
  profit_loss_ratio: number
}

export interface BacktestDailyReturn {
  date: string // YYYY-MM-DD
  // dynamic keys for each stock symbol/name with numeric return or contribution
  [stock: string]: string | number
}

export interface BacktestSummary {
  id: number
  name: string
  createdAt: string
  period: string
  metrics: BacktestMetrics
  daily_returns: BacktestDailyReturn[]
  execution_time: number
}

export const portfolios: Portfolio[] = [
  {
    id: 1,
    name: "성장형 포트폴리오",
    totalValue: 12543000,
    change: 2.4,
    changeAmount: 290000,
    description: "고성장 기술주 중심의 공격적 투자",
    stockHoldings: [
      {
        symbol: "005930",
        name: "삼성전자",
        shares: 500,
        currentPrice: 75000,
        totalValue: 3750000,
        change: 1.8,
        changePercent: 2.4,
        weight: 29.9,
      },
      {
        symbol: "000660",
        name: "SK하이닉스",
        shares: 300,
        currentPrice: 95000,
        totalValue: 2850000,
        change: 3.2,
        changePercent: 3.5,
        weight: 22.7,
      },
      {
        symbol: "066570",
        name: "LG전자",
        shares: 250,
        currentPrice: 90000,
        totalValue: 2250000,
        change: 1.5,
        changePercent: 1.7,
        weight: 17.9,
      },
      {
        symbol: "035720",
        name: "카카오",
        shares: 400,
        currentPrice: 58000,
        totalValue: 2320000,
        change: 4.5,
        changePercent: 8.4,
        weight: 18.5,
      },
    ],
    riskLevel: "높음",
    createdDate: "2024-01-15",
    dividendYield: 1.2,
    maxDrawdown: -15.2,
    sharpeRatio: 1.35,
  },
  {
    id: 2,
    name: "안정형 포트폴리오",
    totalValue: 8500000,
    change: 1.2,
    changeAmount: 101000,
    description: "배당주와 우량주 중심의 안정적 투자",
    stockHoldings: [
      {
        symbol: "005930",
        name: "삼성전자",
        shares: 300,
        currentPrice: 75000,
        totalValue: 2250000,
        change: 1.8,
        changePercent: 2.4,
        weight: 26.5,
      },
      {
        symbol: "066570",
        name: "LG전자",
        shares: 250,
        currentPrice: 85000,
        totalValue: 2125000,
        change: 0.8,
        changePercent: 0.9,
        weight: 25.0,
      },
      {
        symbol: "005380",
        name: "현대차",
        shares: 150,
        currentPrice: 180000,
        totalValue: 2700000,
        change: 1.5,
        changePercent: 0.8,
        weight: 31.8,
      },
      {
        symbol: "017670",
        name: "SK텔레콤",
        shares: 300,
        currentPrice: 47500,
        totalValue: 1425000,
        change: 0.5,
        changePercent: 1.1,
        weight: 16.8,
      },
    ],
    riskLevel: "낮음",
    createdDate: "2024-01-10",
    dividendYield: 3.8,
    maxDrawdown: -8.5,
    sharpeRatio: 0.95,
  },
]

const chartColors = ["#ef4444", "#3b82f6", "#10b981", "#f59e0b", "#8b5cf6", "#ec4899", "#06b6d4", "#84cc16"]

export const getPortfolioWithDetails = (portfolio: Portfolio): PortfolioWithDetails => {
  const holdings = portfolio.stockHoldings.map((stock, index) => ({
    name: stock.name,
    percent: stock.weight,
    amount: stock.totalValue,
    change: stock.changePercent,
    color: chartColors[index % chartColors.length],
  }))

  const topHoldings = portfolio.stockHoldings
    .sort((a, b) => b.weight - a.weight)
    .slice(0, 3)
    .map((stock) => ({
      name: stock.name,
      percent: stock.weight,
    }))

  return {
    ...portfolio,
    holdings,
    topHoldings,
    strategy: {
      name: "자동 리밸런싱 전략",
      description: "월 1회 자동 리밸런싱으로 목표 비중을 유지하며, 위험 관리를 통해 안정적인 수익을 추구합니다. 기술적 분석과 펀더멘털 분석을 결합한 매매신호를 제공합니다.",
      rebalanceFrequency: "월 1회 자동 리밸런싱",
      stopLoss: -10,
      takeProfit: 20,
    },
    logs: [
      {
        date: "2024-01-20",
        type: "리밸런싱",
        description: "월간 자동 리밸런싱 실행",
        amount: portfolio.totalValue * 0.05,
      },
      {
        date: "2024-01-18",
        type: "배당",
        description: `${portfolio.stockHoldings[0]?.name || "종목"} 배당금 지급`,
        amount: (portfolio.totalValue * (portfolio.dividendYield / 100)) / 12,
      },
      {
        date: "2024-01-15",
        type: "매수",
        description: `${portfolio.stockHoldings[1]?.name || "종목"} 추가 매수`,
        amount: portfolio.totalValue * 0.1,
      },
      {
        date: "2024-01-12",
        type: "매도",
        description: `${portfolio.stockHoldings[2]?.name || "종목"} 일부 매도`,
        amount: portfolio.totalValue * 0.08,
      },
    ],
    alerts: [
      {
        type: "info",
        message: "다음 리밸런싱이 2024-02-20에 예정되어 있습니다.",
        date: "2024-01-21",
      },
      {
        type: portfolio.change > 0 ? "success" : "warning",
        message: `포트폴리오가 ${Math.abs(portfolio.change)}% ${portfolio.change > 0 ? "상승" : "하락"}했습니다.`,
        date: "2024-01-21",
      },
      {
        type: "warning",
        message: `${portfolio.stockHoldings.find((s) => s.changePercent < -5)?.name || "일부 종목"}이 5% 이상 하락했습니다.`,
        date: "2024-01-20",
      },
    ],
    backtests: generateMockBacktests(portfolio),
  }
}

export const getTotalPortfolioValue = (portfolios: Portfolio[]) =>
  portfolios.reduce((sum, portfolio) => sum + portfolio.totalValue, 0)

export const getTotalChange = (portfolios: Portfolio[]) =>
  portfolios.reduce((sum, portfolio) => sum + portfolio.changeAmount, 0)

export const getTotalChangePercent = (portfolios: Portfolio[]) => {
  const totalValue = getTotalPortfolioValue(portfolios)
  const totalChange = getTotalChange(portfolios)
  return (totalChange / (totalValue - totalChange)) * 100
}

// Helpers to create mock backtests per portfolio
function generateMockBacktests(portfolio: Portfolio): BacktestSummary[] {
  const holdingNames = portfolio.stockHoldings.map((s) => s.name)
  const days = 30
  const start = new Date("2024-01-01")

  const daily_returns: BacktestDailyReturn[] = Array.from({ length: days }).map((_, i) => {
    const d = new Date(start)
    d.setDate(start.getDate() + i)
    const entry: BacktestDailyReturn = { date: d.toISOString().slice(0, 10) }
    let remaining = 1
    holdingNames.forEach((name, idx) => {
      const isLast = idx === holdingNames.length - 1
      // generate small daily contribution with slight randomness; ensure stack sums ~1
      const value = isLast ? remaining : Math.max(0, Number((Math.random() * (remaining / 2)).toFixed(2)))
      remaining = Math.max(0, Number((remaining - value).toFixed(2)))
      // store as percentage contribution basis 1.0
      entry[name] = Number((value * (Math.random() > 0.5 ? 1 : -1)).toFixed(2))
    })
    return entry
  })

  const metrics: BacktestMetrics = {
    total_return: 0.18,
    annualized_return: 0.22,
    volatility: 0.14,
    sharpe_ratio: 1.2,
    max_drawdown: -0.11,
    var_95: -0.06,
    var_99: -0.1,
    cvar_95: -0.08,
    cvar_99: -0.13,
    win_rate: 0.58,
    profit_loss_ratio: 1.6,
  }

  const createdAt = "2024-01-25"
  return [
    {
      id: Number(`${portfolio.id}01`),
      name: `${portfolio.name} 전략 테스트 #1`,
      createdAt,
      period: "2주",
      metrics,
      daily_returns,
      execution_time: 1.37,
    },
  ]
}

export function findBacktestById(id: number): { portfolio: PortfolioWithDetails; backtest: BacktestSummary } | null {
  // ID 1번 백테스트를 위한 특별 처리
  if (id === 1) {
    const portfolio = getPortfolioWithDetails(portfolios[0]) // 첫 번째 포트폴리오 사용
    const mockBacktest: BacktestSummary = {
      id: 1,
      name: "첫 테스트",
      createdAt: "2025-09-17T18:27:07",
      period: "2025-01-08 ~ 2025-06-30",
      metrics: {
        total_return: 0.155,
        annualized_return: 0.123,
        volatility: 0.187,
        sharpe_ratio: 0.65,
        max_drawdown: -0.082,
        var_95: -0.06,
        var_99: -0.1,
        cvar_95: -0.08,
        cvar_99: -0.13,
        win_rate: 0.65,
        profit_loss_ratio: 1.2,
      },
      daily_returns: [
        { date: "2025-01-08", "삼성전자": 0.025, "SK하이닉스": -0.035, "LG전자": 0.045 },
        { date: "2025-01-09", "삼성전자": 0.055, "SK하이닉스": 0.028, "LG전자": -0.042 },
        { date: "2025-01-10", "삼성전자": -0.038, "SK하이닉스": 0.065, "LG전자": 0.022 },
        { date: "2025-01-11", "삼성전자": 0.072, "SK하이닉스": -0.048, "LG전자": 0.035 },
        { date: "2025-01-12", "삼성전자": 0.018, "SK하이닉스": 0.041, "LG전자": -0.025 },
        { date: "2025-01-13", "삼성전자": -0.029, "SK하이닉스": 0.033, "LG전자": 0.058 },
        { date: "2025-01-14", "삼성전자": 0.046, "SK하이닉스": -0.055, "LG전자": 0.015 },
        { date: "2025-01-15", "삼성전자": 0.063, "SK하이닉스": 0.024, "LG전자": 0.037 },
        { date: "2025-01-16", "삼성전자": -0.051, "SK하이닉스": 0.019, "LG전자": -0.044 },
        { date: "2025-01-17", "삼성전자": 0.034, "SK하이닉스": -0.026, "LG전자": 0.067 },
        { date: "2025-01-18", "삼성전자": 0.021, "SK하이닉스": 0.048, "LG전자": -0.031 },
        { date: "2025-01-19", "삼성전자": -0.043, "SK하이닉스": 0.029, "LG전자": 0.052 },
        { date: "2025-01-20", "삼성전자": 0.068, "SK하이닉스": -0.039, "LG전자": 0.016 },
        { date: "2025-01-21", "삼성전자": 0.032, "SK하이닉스": 0.054, "LG전자": 0.027 },
        { date: "2025-01-22", "삼성전자": -0.036, "SK하이닉스": 0.017, "LG전자": -0.049 },
        { date: "2025-01-23", "삼성전자": 0.059, "SK하이닉스": -0.033, "LG전자": 0.023 },
        { date: "2025-01-24", "삼성전자": 0.041, "SK하이닉스": 0.045, "LG전자": 0.038 },
        { date: "2025-01-25", "삼성전자": -0.027, "SK하이닉스": 0.012, "LG전자": -0.035 },
        { date: "2025-01-26", "삼성전자": 0.048, "SK하이닉스": -0.041, "LG전자": 0.061 },
        { date: "2025-01-27", "삼성전자": 0.056, "SK하이닉스": 0.031, "LG전자": 0.019 },
        { date: "2025-01-28", "삼성전자": -0.062, "SK하이닉스": 0.044, "LG전자": -0.028 },
        { date: "2025-01-29", "삼성전자": 0.037, "SK하이닉스": -0.024, "LG전자": 0.053 },
        { date: "2025-01-30", "삼성전자": 0.042, "SK하이닉스": 0.058, "LG전자": 0.026 }
      ],
      execution_time: 0
    }
    return { portfolio, backtest: mockBacktest }
  }

  for (const p of portfolios) {
    const detailed = getPortfolioWithDetails(p)
    const found = detailed.backtests.find((b) => b.id === id)
    if (found) return { portfolio: detailed, backtest: found }
  }
  return null
}
