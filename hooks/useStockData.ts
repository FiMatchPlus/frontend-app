"use client"

import { useState, useEffect, useCallback } from "react"
import type { Stock, StockChartData, TimeFrame } from "@/types/stock"
import { generateMockChartData } from "@/data/mockStockData"
import { fetchChartData, transformChartData } from "@/lib/api"

/**
 * Custom hook for managing stock data and chart data
 */
export function useStockData(selectedStock: Stock | null) {
  const [chartData, setChartData] = useState<StockChartData[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [timeFrame, setTimeFrame] = useState<TimeFrame>("1D")

  const fetchChartDataFromAPI = useCallback(async (stock: Stock, timeframe: TimeFrame) => {
    if (!stock) return

    setIsLoading(true)
    setError(null)

    try {
      console.log("[v0] Starting API call for stock:", stock.symbol, "timeframe:", timeframe)

      // 실제 API 호출
      const apiData = await fetchChartData(stock.symbol, timeframe)
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
  }, [])

  // Effect to fetch data when stock or timeframe changes
  useEffect(() => {
    if (selectedStock) {
      fetchChartDataFromAPI(selectedStock, timeFrame)
    }
  }, [selectedStock, timeFrame, fetchChartDataFromAPI])

  const changeTimeFrame = (newTimeFrame: TimeFrame) => {
    setTimeFrame(newTimeFrame)
  }

  return {
    chartData,
    isLoading,
    error,
    timeFrame,
    changeTimeFrame,
    refetch: () => selectedStock && fetchChartDataFromAPI(selectedStock, timeFrame),
  }
}
