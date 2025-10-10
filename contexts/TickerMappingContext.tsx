"use client"

import { createContext, useContext, useRef, useCallback, ReactNode } from "react"

interface TickerMappingContextType {
  updatePortfolioMappings: (portfolioId: number, mappings: Record<string, string>) => void
  getStockName: (ticker: string, portfolioId?: number) => string
  clearPortfolioMappings: (portfolioId: number) => void
  clearAllMappings: () => void
}

const TickerMappingContext = createContext<TickerMappingContextType | undefined>(undefined)

export function TickerMappingProvider({ children }: { children: ReactNode }) {
  // 포트폴리오별 매핑 관리: portfolioId -> Map<ticker, name>
  const portfolioMappingsRef = useRef<Map<number, Map<string, string>>>(new Map())
  
  const updatePortfolioMappings = useCallback((portfolioId: number, mappings: Record<string, string>) => {
    // 포트폴리오별 매핑 생성 또는 업데이트
    if (!portfolioMappingsRef.current.has(portfolioId)) {
      portfolioMappingsRef.current.set(portfolioId, new Map())
    }
    
    const portfolioMap = portfolioMappingsRef.current.get(portfolioId)!
    Object.entries(mappings).forEach(([ticker, name]) => {
      portfolioMap.set(ticker, name)
    })
  }, [])

  const getStockName = useCallback((ticker: string, portfolioId?: number): string => {
    // 특정 포트폴리오의 매핑에서 먼저 찾고, 없으면 전역에서 찾기
    if (portfolioId && portfolioMappingsRef.current.has(portfolioId)) {
      const portfolioMap = portfolioMappingsRef.current.get(portfolioId)!
      const name = portfolioMap.get(ticker)
      if (name) return name
    }
    
    // 전역 매핑에서 찾기 (모든 포트폴리오 순회)
    for (const [, portfolioMap] of portfolioMappingsRef.current) {
      const name = portfolioMap.get(ticker)
      if (name) return name
    }
    
    return ticker // 매핑이 없으면 ticker 반환
  }, [])

  const clearPortfolioMappings = useCallback((portfolioId: number) => {
    // 특정 포트폴리오의 매핑만 삭제
    portfolioMappingsRef.current.delete(portfolioId)
  }, [])

  const clearAllMappings = useCallback(() => {
    // 모든 매핑 초기화
    portfolioMappingsRef.current.clear()
  }, [])

  return (
    <TickerMappingContext.Provider 
      value={{ 
        updatePortfolioMappings, 
        getStockName,
        clearPortfolioMappings,
        clearAllMappings
      }}
    >
      {children}
    </TickerMappingContext.Provider>
  )
}

export function useTickerMapping() {
  const context = useContext(TickerMappingContext)
  if (context === undefined) {
    throw new Error('useTickerMapping must be used within a TickerMappingProvider')
  }
  return context
}