// Stock API utility functions (mock implementation)

import type { Stock, StockChartData, TimeFrame } from "@/types/stock"
import { mockStocks, generateMockChartData } from "@/data/mockStockData"

/**
 * Simulated API delay
 */
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

/**
 * Mock API class for stock data
 */
export class StockAPI {
  /**
   * Get all available stocks
   */
  static async getStocks(): Promise<Stock[]> {
    await delay(500)
    return mockStocks
  }

  /**
   * Get stock by symbol
   */
  static async getStock(symbol: string): Promise<Stock | null> {
    await delay(300)
    return mockStocks.find((stock) => stock.symbol === symbol) || null
  }

  /**
   * Search stocks by query
   */
  static async searchStocks(query: string): Promise<Stock[]> {
    await delay(200)
    const lowercaseQuery = query.toLowerCase()
    return mockStocks.filter(
      (stock) =>
        stock.name.toLowerCase().includes(lowercaseQuery) ||
        stock.symbol.toLowerCase().includes(lowercaseQuery) ||
        stock.sector.toLowerCase().includes(lowercaseQuery),
    )
  }

  /**
   * Get chart data for a stock
   */
  static async getChartData(symbol: string, timeFrame: TimeFrame): Promise<StockChartData[]> {
    await delay(800)

    const days = {
      "1D": 1,
      "1W": 7,
      "1M": 30,
      "3M": 90,
      "6M": 180,
      "1Y": 365,
      "5Y": 1825,
    }[timeFrame]

    return generateMockChartData(symbol, days)
  }

  /**
   * Get popular stocks
   */
  static async getPopularStocks(): Promise<Stock[]> {
    await delay(300)
    return mockStocks.slice(0, 5)
  }

  /**
   * Get market status
   */
  static async getMarketStatus(): Promise<{
    isOpen: boolean
    nextOpen: string
    timezone: string
  }> {
    await delay(200)
    const now = new Date()
    const hour = now.getHours()

    // Korean market hours: 9:00 - 15:30 KST
    const isOpen = hour >= 9 && hour < 15.5

    return {
      isOpen,
      nextOpen: isOpen ? "15:30" : "09:00",
      timezone: "KST",
    }
  }
}

/**
 * Error handling wrapper for API calls
 */
export async function withErrorHandling<T>(
  apiCall: () => Promise<T>,
  errorMessage = "데이터를 불러오는데 실패했습니다.",
): Promise<T> {
  try {
    return await apiCall()
  } catch (error) {
    console.error("API Error:", error)
    throw new Error(errorMessage)
  }
}
