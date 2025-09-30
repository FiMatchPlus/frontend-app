"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import type { Stock, StockChartData, TimeFrame } from "@/types/stock"
import { generateMockChartData } from "@/data/mockStockData"
import { fetchChartData, transformChartData } from "@/lib/api"

// 타임프레임에 따른 기본 날짜 범위 계산
function getDefaultDateRange(timeframe: TimeFrame): { startDate: string; endDate: string } {
  const endDate = new Date()
  const startDate = new Date()
  
  switch (timeframe) {
    case "1D":
      // 일봉 차트는 6개월 데이터로 시작 (약 120-130개 포인트, 최근 30개만 표시)
      startDate.setMonth(endDate.getMonth() - 6) // 6개월
      break
    case "1W":
      // 주봉 차트는 6개월 데이터 (약 24-26개 포인트)
      startDate.setMonth(endDate.getMonth() - 6)
      break
    case "1M":
      // 월봉 차트는 2년 데이터 (약 24개 포인트)
      startDate.setFullYear(endDate.getFullYear() - 2)
      break
    case "3M":
      startDate.setMonth(endDate.getMonth() - 3)
      break
    case "6M":
      startDate.setMonth(endDate.getMonth() - 6)
      break
    case "1Y":
      startDate.setFullYear(endDate.getFullYear() - 1)
      break
    case "5Y":
      startDate.setFullYear(endDate.getFullYear() - 5)
      break
    default:
      // 기본값도 6개월로 설정
      startDate.setMonth(endDate.getMonth() - 6)
  }
  
  return {
    startDate: startDate.toISOString().split('T')[0],
    endDate: endDate.toISOString().split('T')[0]
  }
}

/**
 * Custom hook for managing stock data and chart data
 */
export function useStockData(selectedStock: Stock | null) {
  const [chartData, setChartData] = useState<StockChartData[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [timeFrame, setTimeFrame] = useState<TimeFrame>("1D")
  const [loadedDateRange, setLoadedDateRange] = useState<{start: string; end: string} | null>(null)
  const [isLoadingMore, setIsLoadingMore] = useState(false)
  const scrollTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const lastRequestDateRef = useRef<string | null>(null) // 마지막 요청 날짜 추적

  const fetchChartDataFromAPI = useCallback(async (
    stock: Stock, 
    timeframe: TimeFrame, 
    startDate?: string, 
    endDate?: string
  ) => {
    if (!stock) return

    setIsLoading(true)
    setError(null)

    try {
      console.log("[v0] Starting API call for stock:", stock.symbol, "timeframe:", timeframe, "range:", startDate, "~", endDate)

      // 실제 API 호출 (날짜 범위 포함)
      const apiData = await fetchChartData(stock.symbol, timeframe, startDate, endDate)
      const transformedData = transformChartData(apiData)
      setChartData(transformedData)

      console.log("[v0] Successfully fetched and transformed data:", transformedData.length, "points")
    } catch (err) {
      console.warn("[v0] API 호출 실패, mock 데이터 사용:", err)

      // Check if it's a configuration error
      if (err instanceof Error && err.message.includes("API_BASE_URL not configured")) {
        console.log("[v0] Using mock data due to missing API configuration")
      }

      try {
        // Generate mock data based on timeframe
        const days =
          {
            "1m": 1,
            "1D": 1,
            "1W": 7,
            "1M": 30,
            "1Y": 365,
          }[timeframe] || 30

        console.log("[v0] Generating mock data for", days, "days")
        const data = generateMockChartData(stock.symbol, days)
        setChartData(data)
        console.log("[v0] Mock data generated successfully:", data.length, "points")

        setError("서버에 연결할 수 없어 샘플 데이터를 표시합니다.")
      } catch (mockErr) {
        console.error("[v0] Mock data generation failed:", mockErr)
        setError("차트 데이터를 불러오는데 실패했습니다.")
      }
    } finally {
      setIsLoading(false)
    }
  }, []) // 빈 dependency로 함수 재생성 방지

  // 과거 데이터 추가 로드 함수
  const loadMorePastData = useCallback(async (stock: Stock, timeframe: TimeFrame, currentStartDate: string) => {
    if (isLoadingMore) {
      return
    }
    
    // 같은 날짜로 이미 요청한 경우 중복 방지
    if (lastRequestDateRef.current === currentStartDate) {
      return
    }
    
    setIsLoadingMore(true)
    lastRequestDateRef.current = currentStartDate
    
    try {
      // 현재 시작일로부터 6개월 더 과거 데이터 로드
      const newStartDate = new Date(currentStartDate)
      newStartDate.setMonth(newStartDate.getMonth() - 6) // 6개월 전
      const newStartDateStr = newStartDate.toISOString().split('T')[0]
      
      // 하루 전까지만 (중복 방지)
      const newEndDate = new Date(currentStartDate)
      newEndDate.setDate(newEndDate.getDate() - 1)
      const newEndDateStr = newEndDate.toISOString().split('T')[0]
      
      console.log("[API Request] Requesting data from", newStartDateStr, "to", newEndDateStr)
      const apiData = await fetchChartData(stock.symbol, timeframe, newStartDateStr, newEndDateStr)
      console.log("[API Response] Received", apiData.length, "data points")
      const transformedData = transformChartData(apiData)
      
      if (transformedData.length === 0) {
        return // 빈 데이터면 추가하지 않음
      }
      
      // 새 데이터와 기존 데이터 합치고 날짜순 정렬
      setChartData(prev => {
        const combined = [...transformedData, ...prev]
        
        // 디버깅: 새 데이터의 날짜 범위 확인
        if (transformedData.length > 0) {
          const dates = transformedData.map(d => new Date(d.timestamp).toISOString().split('T')[0]).sort()
          console.log("[Data Debug] New data date range:", dates[0], "~", dates[dates.length - 1], `(${dates.length} points)`)
        }
        
        // 중복 제거 (같은 날짜의 데이터가 있을 수 있음)
        const uniqueData = combined.filter((item, index, arr) => 
          arr.findIndex(t => t.timestamp === item.timestamp) === index
        )
        
        // 날짜순 정렬
        const sorted = uniqueData.sort((a, b) => a.timestamp - b.timestamp)
        
        // 디버깅: 정렬 후 전체 데이터의 날짜 범위 확인
        if (sorted.length > 0) {
          const allDates = sorted.map(d => new Date(d.timestamp).toISOString().split('T')[0])
          console.log("[Data Debug] Total data after merge:", allDates[0], "~", allDates[allDates.length - 1], `(${allDates.length} points)`)
        }
        
        return sorted
      })
      setLoadedDateRange(prev => prev ? { ...prev, start: newStartDateStr } : null)
    } catch (err) {
      console.error("[v0] Failed to load more past data:", err)
    } finally {
      setIsLoadingMore(false)
    }
  }, [isLoadingMore])

  // Effect to fetch data when stock or timeframe changes
  useEffect(() => {
    if (selectedStock) {
      const { startDate, endDate } = getDefaultDateRange(timeFrame)
      fetchChartDataFromAPI(selectedStock, timeFrame, startDate, endDate)
      setLoadedDateRange({ start: startDate, end: endDate })
    }
  }, [selectedStock, timeFrame, fetchChartDataFromAPI]) // dependency 복원 (fetchChartDataFromAPI가 안정적이므로 문제없음)

  const changeTimeFrame = (newTimeFrame: TimeFrame) => {
    setTimeFrame(newTimeFrame)
  }
  
  // 스크롤 경계 감지해서 추가 데이터 로드 (디바운싱 적용)
  const handleScrollBoundary = useCallback((scrollPosition: number, totalData: number) => {
    // 기존 타이머 취소
    if (scrollTimeoutRef.current) {
      clearTimeout(scrollTimeoutRef.current)
    }
    
    // 500ms 후에 실행 (빠른 스크롤 방지)
    scrollTimeoutRef.current = setTimeout(() => {
      // 왼쪽 끝에서 10% 이내로 스크롤하면 과거 데이터 로드
      if (scrollPosition < totalData * 0.1 && selectedStock && loadedDateRange && !isLoadingMore) {
        loadMorePastData(selectedStock, timeFrame, loadedDateRange.start)
      }
    }, 500)
  }, [selectedStock, timeFrame, loadedDateRange, isLoadingMore, loadMorePastData])

  // 컴포넌트 언마운트 시 타이머 정리
  useEffect(() => {
    return () => {
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current)
      }
    }
  }, [])

  return {
    chartData,
    isLoading,
    isLoadingMore,
    error,
    timeFrame,
    changeTimeFrame,
    handleScrollBoundary,
    refetch: () => selectedStock && fetchChartDataFromAPI(selectedStock, timeFrame),
  }
}
