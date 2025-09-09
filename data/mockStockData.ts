import type { Stock, StockChartData, Portfolio } from "@/types/stock"

// Mock data for Korean major stocks
export const mockStocks: Stock[] = [
  {
    symbol: "005930",
    name: "삼성전자",
    price: 71800,
    change: 1200,
    changePercent: 1.7,
    volume: 12543210,
    marketCap: 429000000000000,
    sector: "반도체",
    logo: "/samsung-logo.png",
  },
  {
    symbol: "000660",
    name: "SK하이닉스",
    price: 128500,
    change: -2300,
    changePercent: -1.76,
    volume: 8765432,
    marketCap: 93500000000000,
    sector: "반도체",
    logo: "/sk-hynix-logo.png",
  },
  {
    symbol: "035420",
    name: "NAVER",
    price: 198000,
    change: 3500,
    changePercent: 1.8,
    volume: 1234567,
    marketCap: 32800000000000,
    sector: "인터넷",
    logo: "/naver-logo.png",
  },
  {
    symbol: "035720",
    name: "카카오",
    price: 52400,
    change: -800,
    changePercent: -1.5,
    volume: 2345678,
    marketCap: 23100000000000,
    sector: "인터넷",
    logo: "/kakao-logo.png",
  },
  {
    symbol: "207940",
    name: "삼성바이오로직스",
    price: 785000,
    change: 15000,
    changePercent: 1.95,
    volume: 123456,
    marketCap: 56200000000000,
    sector: "바이오",
    logo: "/samsung-biologics-logo.png",
  },
  {
    symbol: "006400",
    name: "삼성SDI",
    price: 412000,
    change: -8000,
    changePercent: -1.9,
    volume: 567890,
    marketCap: 28900000000000,
    sector: "배터리",
    logo: "/samsung-sdi-logo.png",
  },
  {
    symbol: "051910",
    name: "LG화학",
    price: 398500,
    change: 5500,
    changePercent: 1.4,
    volume: 789012,
    marketCap: 28100000000000,
    sector: "화학",
    logo: "/lg-chem-logo.png",
  },
  {
    symbol: "028260",
    name: "삼성물산",
    price: 118500,
    change: 2000,
    changePercent: 1.72,
    volume: 456789,
    marketCap: 14200000000000,
    sector: "건설",
    logo: "/samsung-ct-logo.png",
  },
]

export const mockPortfolio: Portfolio[] = [
  {
    symbol: "005930",
    shares: 50,
    avgPrice: 68000,
    currentValue: 3590000,
    totalReturn: 190000,
    totalReturnPercent: 5.59,
  },
  {
    symbol: "000660",
    shares: 20,
    avgPrice: 135000,
    currentValue: 2570000,
    totalReturn: -130000,
    totalReturnPercent: -4.81,
  },
  {
    symbol: "035420",
    shares: 10,
    avgPrice: 185000,
    currentValue: 1980000,
    totalReturn: 130000,
    totalReturnPercent: 7.03,
  },
]

// Generate mock chart data for a stock
export const generateMockChartData = (symbol: string, days = 30): StockChartData[] => {
  const basePrice = mockStocks.find((stock) => stock.symbol === symbol)?.price || 100000
  const data: StockChartData[] = []

  const dataPoints = Math.max(days * 24, 100) // At least 100 points for smooth charts

  for (let i = dataPoints; i >= 0; i--) {
    const timestamp = Date.now() - i * 60 * 60 * 1000 // Hourly intervals
    const volatility = 0.02 // 2% daily volatility
    const randomChange = (Math.random() - 0.5) * volatility

    const prevClose = i === dataPoints ? basePrice : data[data.length - 1]?.close || basePrice
    const open = prevClose * (1 + (Math.random() - 0.5) * 0.005)
    const close = open * (1 + randomChange)
    const high = Math.max(open, close) * (1 + Math.random() * 0.01)
    const low = Math.min(open, close) * (1 - Math.random() * 0.01)
    const volume = Math.floor(Math.random() * 10000000) + 1000000

    data.push({
      timestamp,
      open: Math.round(open),
      high: Math.round(high),
      low: Math.round(low),
      close: Math.round(close),
      volume,
    })
  }

  return data
}

// 삼성전자를 첫 번째로 하는 popular stocks
export const popularStocks = [
  mockStocks[0], // 삼성전자
  mockStocks[1], // SK하이닉스
  mockStocks[2], // NAVER
  mockStocks[3], // 카카오
  mockStocks[4], // 삼성바이오로직스
]
export const recentlyViewedStocks = mockStocks.slice(2, 6)
