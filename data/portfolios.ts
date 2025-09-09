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
        symbol: "035420",
        name: "NAVER",
        shares: 200,
        currentPrice: 180000,
        totalValue: 3600000,
        change: 2.1,
        changePercent: 1.2,
        weight: 28.7,
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
