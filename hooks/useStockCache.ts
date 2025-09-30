"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { fetchMultipleStockPrices, type StockPriceData } from "@/lib/api/stockBatch"

interface StockCacheState {
  [symbol: string]: StockPriceData
}

interface UseStockCacheReturn {
  getStockPrice: (symbol: string) => StockPriceData | null
  getMultipleStockPrices: (symbols: string[]) => (StockPriceData | null)[]
  refreshStocks: (symbols: string[]) => Promise<void>
  isLoading: boolean
  error: string | null
  lastUpdated: number | null
}

/**
 * 종목 데이터를 캐시하고 배치로 조회하는 커스텀 훅
 */
export function useStockCache(): UseStockCacheReturn {
  const [cache, setCache] = useState<StockCacheState>({})
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [lastUpdated, setLastUpdated] = useState<number | null>(null)
  
  // 진행 중인 요청을 추적하여 중복 요청 방지
  const pendingRequestsRef = useRef<Set<string>>(new Set())
  const requestQueueRef = useRef<string[]>([])
  const requestTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  // 캐시 전략: 실시간성이 필요하지 않으므로 캐시가 있으면 계속 사용
  // 30분 주기로만 수동 새로고침하거나 페이지 새로고침 시에만 갱신
  const CACHE_DURATION = 30 * 60 * 1000 // 30분 (참고용, 실제로는 사용하지 않음)

  // 배치 요청을 위한 디바운싱
  const processBatchRequest = useCallback(async () => {
    if (requestQueueRef.current.length === 0) return

    const symbolsToFetch = [...new Set(requestQueueRef.current)] // 중복 제거
    requestQueueRef.current = []

    // 이미 요청 중인 종목들과 캐시가 있는 종목들 제외
    const finalSymbols = symbolsToFetch.filter(symbol => 
      !pendingRequestsRef.current.has(symbol) && !cache[symbol]
    )

    if (finalSymbols.length === 0) return

    // 요청 중 표시
    finalSymbols.forEach(symbol => pendingRequestsRef.current.add(symbol))
    setIsLoading(true)
    setError(null)

    try {
      console.log("[StockCache] Fetching batch data for:", finalSymbols, "at", new Date().toLocaleTimeString())
      const stockData = await fetchMultipleStockPrices(finalSymbols)
      
      // 캐시 업데이트
      setCache(prev => {
        const newCache = { ...prev }
        stockData.forEach(stock => {
          newCache[stock.symbol] = stock
        })
        return newCache
      })
      
      setLastUpdated(Date.now())
      console.log("[StockCache] Successfully cached", stockData.length, "stocks")
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '종목 데이터 조회 실패'
      setError(errorMessage)
      console.error("[StockCache] Batch request failed:", err)
    } finally {
      // 요청 완료 표시
      finalSymbols.forEach(symbol => pendingRequestsRef.current.delete(symbol))
      setIsLoading(false)
    }
  }, [])

  // 디바운싱된 배치 요청 처리
  const queueStockRequest = useCallback((symbols: string[]) => {
    requestQueueRef.current.push(...symbols)
    
    // 기존 타이머 취소
    if (requestTimeoutRef.current) {
      clearTimeout(requestTimeoutRef.current)
    }
    
    // 200ms 후 배치 처리
    requestTimeoutRef.current = setTimeout(() => {
      processBatchRequest()
    }, 200)
  }, [processBatchRequest])

  // 단일 종목 조회
  const getStockPrice = useCallback((symbol: string): StockPriceData | null => {
    const cached = cache[symbol]
    
    if (!cached) {
      // 캐시가 없는 경우에만 요청 (실시간성이 필요하지 않으므로 만료된 데이터도 사용)
      queueStockRequest([symbol])
      return null
    }
    
    // 캐시가 있으면 만료 여부와 관계없이 반환 (30분 주기로만 갱신)
    return cached
  }, [cache, queueStockRequest])

  // 여러 종목 조회
  const getMultipleStockPrices = useCallback((symbols: string[]): (StockPriceData | null)[] => {
    const results: (StockPriceData | null)[] = []
    const symbolsToFetch: string[] = []
    
    symbols.forEach(symbol => {
      const cached = cache[symbol]
      
      if (!cached) {
        // 캐시가 없는 경우에만 요청 (실시간성이 필요하지 않으므로 만료된 데이터도 사용)
        symbolsToFetch.push(symbol)
        results.push(null)
      } else {
        // 캐시가 있으면 만료 여부와 관계없이 반환 (30분 주기로만 갱신)
        results.push(cached)
      }
    })
    
    // 필요한 종목들을 배치 요청에 추가
    if (symbolsToFetch.length > 0) {
      queueStockRequest(symbolsToFetch)
    }
    
    return results
  }, [cache, queueStockRequest])

  // 강제 새로고침
  const refreshStocks = useCallback(async (symbols: string[]): Promise<void> => {
    setIsLoading(true)
    setError(null)
    
    try {
      console.log("[StockCache] Force refreshing stocks:", symbols)
      const stockData = await fetchMultipleStockPrices(symbols)
      
      setCache(prev => {
        const newCache = { ...prev }
        stockData.forEach(stock => {
          newCache[stock.symbol] = stock
        })
        return newCache
      })
      
      setLastUpdated(Date.now())
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '종목 데이터 새로고침 실패'
      setError(errorMessage)
      throw err
    } finally {
      setIsLoading(false)
    }
  }, [])

  // 컴포넌트 언마운트 시 타이머 정리
  useEffect(() => {
    return () => {
      if (requestTimeoutRef.current) {
        clearTimeout(requestTimeoutRef.current)
      }
    }
  }, [])

  return {
    getStockPrice,
    getMultipleStockPrices,
    refreshStocks,
    isLoading,
    error,
    lastUpdated
  }
}
