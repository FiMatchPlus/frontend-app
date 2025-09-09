import { ModelPortfolio } from '@/types/product'

// Generate sample daily history for the last 365 days
const generateDailyHistory = (baseValue: number, volatility: number) => {
  const history = []
  const today = new Date()
  
  for (let i = 365; i >= 0; i--) {
    const date = new Date(today)
    date.setDate(date.getDate() - i)
    
    // Generate random return with some trend
    const randomReturn = (Math.random() - 0.5) * volatility * 0.01
    const trend = i > 200 ? 0.0002 : 0.0001 // Slight upward trend
    
    const dailyReturn = randomReturn + trend
    const value = baseValue * (1 + dailyReturn)
    
    history.push({
      date: date.toISOString().split('T')[0],
      value: Math.round(value * 100) / 100,
      return: Math.round(dailyReturn * 10000) / 100 // in basis points
    })
    
    baseValue = value
  }
  
  return history
}

export const mockProducts: ModelPortfolio[] = [
  {
    id: '1',
    name: '안정형 대형주 포트폴리오',
    description: '삼성전자, SK하이닉스, LG화학 등 대형 우량주 중심의 안정적인 수익을 추구하는 모델 포트폴리오입니다.',
    riskLevel: 'LOW',
    volatilityIndex: 12.5,
    oneYearReturn: 8.2,
    mdd: -3.2,
    sharpeRatio: 1.45,
    keywords: ['대형주', '우량주', '안정성', '배당'],
    totalValue: 100000000,
    minInvestment: 1000000,
    dailyHistory: generateDailyHistory(10000, 0.8),
    holdings: [
      { symbol: '005930', name: '삼성전자', weight: 30, sector: '전자', price: 74500, change: 1200, changePercent: 1.6 },
      { symbol: '000660', name: 'SK하이닉스', weight: 25, sector: '반도체', price: 128000, change: -2000, changePercent: -1.5 },
      { symbol: '051910', name: 'LG화학', weight: 20, sector: '화학', price: 420000, change: 5000, changePercent: 1.2 },
      { symbol: '035420', name: 'NAVER', weight: 15, sector: 'IT', price: 195000, change: -1000, changePercent: -0.5 },
      { symbol: '006400', name: '삼성SDI', weight: 10, sector: '배터리', price: 380000, change: 8000, changePercent: 2.1 }
    ]
  },
  {
    id: '2',
    name: '성장형 테마 포트폴리오',
    description: 'AI, 바이오, 반도체 등 미래 성장 동력에 집중 투자하는 공격적인 모델 포트폴리오입니다.',
    riskLevel: 'HIGH',
    volatilityIndex: 28.3,
    oneYearReturn: 15.7,
    mdd: -12.8,
    sharpeRatio: 0.98,
    keywords: ['성장주', '테마', 'AI', '바이오', '반도체'],
    totalValue: 150000000,
    minInvestment: 2000000,
    dailyHistory: generateDailyHistory(10000, 2.2),
    holdings: [
      { symbol: '207940', name: '삼성바이오로직스', weight: 25, sector: '바이오', price: 850000, change: 15000, changePercent: 1.8 },
      { symbol: '000270', name: '기아', weight: 20, sector: '자동차', price: 95000, change: 2000, changePercent: 2.1 },
      { symbol: '035720', name: '카카오', weight: 18, sector: 'IT', price: 45000, change: -500, changePercent: -1.1 },
      { symbol: '068270', name: '셀트리온', weight: 15, sector: '바이오', price: 180000, change: 3000, changePercent: 1.7 },
      { symbol: '005380', name: '현대차', weight: 12, sector: '자동차', price: 195500, change: 1500, changePercent: 0.8 },
      { symbol: '066570', name: 'LG전자', weight: 10, sector: '전자', price: 89300, change: 700, changePercent: 0.8 }
    ]
  },
  {
    id: '3',
    name: '밸런스형 혼합 포트폴리오',
    description: '안정성과 수익성을 균형있게 추구하는 대형주와 중형주를 조합한 모델 포트폴리오입니다.',
    riskLevel: 'MEDIUM',
    volatilityIndex: 18.7,
    oneYearReturn: 11.3,
    mdd: -7.5,
    sharpeRatio: 1.23,
    keywords: ['균형', '대형주', '중형주', '안정성'],
    totalValue: 120000000,
    minInvestment: 1500000,
    dailyHistory: generateDailyHistory(10000, 1.4),
    holdings: [
      { symbol: '005930', name: '삼성전자', weight: 25, sector: '전자', price: 74500, change: 1200, changePercent: 1.6 },
      { symbol: '035420', name: 'NAVER', weight: 20, sector: 'IT', price: 195000, change: -1000, changePercent: -0.5 },
      { symbol: '000660', name: 'SK하이닉스', weight: 18, sector: '반도체', price: 128000, change: -2000, changePercent: -1.5 },
      { symbol: '051910', name: 'LG화학', weight: 15, sector: '화학', price: 420000, change: 5000, changePercent: 1.2 },
      { symbol: '006400', name: '삼성SDI', weight: 12, sector: '배터리', price: 380000, change: 8000, changePercent: 2.1 },
      { symbol: '068270', name: '셀트리온', weight: 10, sector: '바이오', price: 180000, change: 3000, changePercent: 1.7 }
    ]
  },
  {
    id: '4',
    name: '글로벌 기술주 포트폴리오',
    description: '글로벌 기술 기업과 국내 대형 IT 기업을 조합한 고성장 추구 모델 포트폴리오입니다.',
    riskLevel: 'VERY_HIGH',
    volatilityIndex: 35.2,
    oneYearReturn: 22.1,
    mdd: -18.9,
    sharpeRatio: 0.87,
    keywords: ['글로벌', '기술주', 'IT', '고성장'],
    totalValue: 200000000,
    minInvestment: 3000000,
    dailyHistory: generateDailyHistory(10000, 2.8),
    holdings: [
      { symbol: '035420', name: 'NAVER', weight: 30, sector: 'IT', price: 195000, change: -1000, changePercent: -0.5 },
      { symbol: '035720', name: '카카오', weight: 25, sector: 'IT', price: 45000, change: -500, changePercent: -1.1 },
      { symbol: '000660', name: 'SK하이닉스', weight: 20, sector: '반도체', price: 128000, change: -2000, changePercent: -1.5 },
      { symbol: '005930', name: '삼성전자', weight: 15, sector: '전자', price: 74500, change: 1200, changePercent: 1.6 },
      { symbol: '207940', name: '삼성바이오로직스', weight: 10, sector: '바이오', price: 850000, change: 15000, changePercent: 1.8 }
    ]
  },
  {
    id: '5',
    name: 'ESG 친화형 포트폴리오',
    description: '환경, 사회, 지배구조(ESG) 기준을 충족하는 기업들로 구성된 지속가능 투자 모델 포트폴리오입니다.',
    riskLevel: 'MEDIUM',
    volatilityIndex: 16.4,
    oneYearReturn: 9.8,
    mdd: -6.2,
    sharpeRatio: 1.15,
    keywords: ['ESG', '지속가능', '환경', '사회'],
    totalValue: 110000000,
    minInvestment: 1200000,
    dailyHistory: generateDailyHistory(10000, 1.2),
    holdings: [
      { symbol: '006400', name: '삼성SDI', weight: 30, sector: '배터리', price: 380000, change: 8000, changePercent: 2.1 },
      { symbol: '051910', name: 'LG화학', weight: 25, sector: '화학', price: 420000, change: 5000, changePercent: 1.2 },
      { symbol: '005930', name: '삼성전자', weight: 20, sector: '전자', price: 74500, change: 1200, changePercent: 1.6 },
      { symbol: '000270', name: '기아', weight: 15, sector: '자동차', price: 95000, change: 2000, changePercent: 2.1 },
      { symbol: '035420', name: 'NAVER', weight: 10, sector: 'IT', price: 195000, change: -1000, changePercent: -0.5 }
    ]
  },
  {
    id: '6',
    name: '배당수익형 포트폴리오',
    description: '높은 배당 수익을 제공하는 기업들로 구성된 안정적인 현금 흐름 추구 모델 포트폴리오입니다.',
    riskLevel: 'LOW',
    volatilityIndex: 14.1,
    oneYearReturn: 6.5,
    mdd: -4.1,
    sharpeRatio: 1.32,
    keywords: ['배당', '현금흐름', '안정성', '우량주'],
    totalValue: 80000000,
    minInvestment: 800000,
    dailyHistory: generateDailyHistory(10000, 1.0),
    holdings: [
      { symbol: '005930', name: '삼성전자', weight: 35, sector: '전자', price: 74500, change: 1200, changePercent: 1.6 },
      { symbol: '000660', name: 'SK하이닉스', weight: 25, sector: '반도체', price: 128000, change: -2000, changePercent: -1.5 },
      { symbol: '051910', name: 'LG화학', weight: 20, sector: '화학', price: 420000, change: 5000, changePercent: 1.2 },
      { symbol: '006400', name: '삼성SDI', weight: 20, sector: '배터리', price: 380000, change: 8000, changePercent: 2.1 }
    ]
  }
]

export const getProductById = (id: string): ModelPortfolio | undefined => {
  return mockProducts.find(product => product.id === id)
}

export const getProductsByRiskLevel = (riskLevel: string): ModelPortfolio[] => {
  return mockProducts.filter(product => product.riskLevel === riskLevel)
}

export const searchProducts = (query: string): ModelPortfolio[] => {
  const lowercaseQuery = query.toLowerCase()
  return mockProducts.filter(product => 
    product.name.toLowerCase().includes(lowercaseQuery) ||
    product.keywords.some(keyword => keyword.toLowerCase().includes(lowercaseQuery))
  )
}
