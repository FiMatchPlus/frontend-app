"use client"

import { motion } from "framer-motion"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { PortfolioHolding } from "@/types/product"
import { TrendingUp, TrendingDown, RefreshCw } from "lucide-react"
import { formatPercent } from "@/utils/formatters"
import { useEffect, useState } from "react"
import { fetchMultiStockPrices, StockMultiData } from "@/lib/api"
import { Button } from "@/components/ui/button"
import { LoadingSpinner } from "@/components/ui/LoadingSpinner"

interface PortfolioHoldingsProps {
  holdings: PortfolioHolding[]
}

interface EnrichedHolding extends PortfolioHolding {
  livePrice?: number
  liveChangePercent?: number
  liveSign?: string  // "2" (상승), "5" (하락), "3" (보합)
}

export function PortfolioHoldings({ holdings }: PortfolioHoldingsProps) {
  const [enrichedHoldings, setEnrichedHoldings] = useState<EnrichedHolding[]>(holdings)
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchLiveData = async () => {
    try {
      setError(null)
      const codes = holdings.map(h => h.symbol)
      console.log("[PortfolioHoldings] Fetching live data for codes:", codes)
      
      const liveData = await fetchMultiStockPrices(codes)
      console.log("[PortfolioHoldings] Live data received:", liveData)
      
      // 실시간 데이터를 holdings에 병합
      const enriched: EnrichedHolding[] = holdings.map(holding => {
        const liveStock = liveData.find(stock => stock.ticker === holding.symbol)
        console.log(`[PortfolioHoldings] Matching ${holding.symbol}:`, liveStock)
        
        if (liveStock) {
          const enrichedHolding = {
            ...holding,
            livePrice: liveStock.currentPrice,
            liveChangePercent: liveStock.dailyRate,
            liveSign: liveStock.sign
          }
          console.log(`[PortfolioHoldings] Enriched ${holding.symbol}:`, enrichedHolding)
          return enrichedHolding
        }
        console.log(`[PortfolioHoldings] No match for ${holding.symbol}, using original data`)
        return holding
      })
      
      console.log("[PortfolioHoldings] Final enriched holdings:", enriched)
      setEnrichedHoldings(enriched)
    } catch (err) {
      console.error("Failed to fetch live stock data:", err)
      setError("실시간 데이터를 불러오는데 실패했습니다. 기본 데이터를 표시합니다.")
      setEnrichedHoldings(holdings)
    } finally {
      setIsLoading(false)
      setIsRefreshing(false)
    }
  }

  useEffect(() => {
    fetchLiveData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [holdings])

  const handleRefresh = () => {
    setIsRefreshing(true)
    fetchLiveData()
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.3 }}
    >
      <Card className="border-0 shadow-lg max-w-6xl mx-auto">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-xl font-semibold text-gray-900">
              포트폴리오 구성 종목
            </CardTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="text-gray-600 hover:text-gray-900"
            >
              <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
              <span className="ml-2">새로고침</span>
            </Button>
          </div>
          {error && (
            <p className="text-sm text-yellow-600 mt-2">{error}</p>
          )}
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center items-center py-8">
              <LoadingSpinner size="md" />
            </div>
          ) : (
            <div className="space-y-4">
              {enrichedHoldings.map((holding, index) => {
                // 실시간 데이터가 있으면 사용, 없으면 기본 데이터 사용
                const price = holding.livePrice ?? holding.price
                const changePercent = holding.liveChangePercent ?? holding.changePercent
                const isPositive = changePercent >= 0
                
                console.log(`[PortfolioHoldings] Rendering ${holding.symbol}:`, {
                  livePrice: holding.livePrice,
                  originalPrice: holding.price,
                  displayPrice: price,
                  liveChangePercent: holding.liveChangePercent,
                  originalChangePercent: holding.changePercent,
                  displayChangePercent: changePercent
                })
                
                return (
                  <motion.div
                    key={holding.symbol}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.4, delay: 0.4 + index * 0.1 }}
                    className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-gray-200 rounded-lg flex items-center justify-center">
                        <span className="text-sm font-semibold text-gray-600">
                          {holding.symbol.slice(-2)}
                        </span>
                      </div>
                      <div>
                        <div className="font-semibold text-gray-900">{holding.name}</div>
                        <div className="text-sm text-gray-600">{holding.symbol}</div>
                      </div>
                      <Badge variant="secondary" className="text-xs">
                        {holding.sector}
                      </Badge>
                    </div>

                    <div className="flex items-center gap-6">
                      <div className="text-right">
                        <div className="text-sm text-gray-600">비중</div>
                        <div className="font-semibold text-gray-900">{holding.weight}%</div>
                      </div>
                      
                      <div className="text-right">
                        <div className="text-sm text-gray-600">현재가</div>
                        <div className="font-semibold text-gray-900">
                          {price.toLocaleString()}원
                        </div>
                      </div>

                      <div className="text-right">
                        <div className="text-sm text-gray-600">등락률</div>
                        <div className={`flex items-center gap-1 font-semibold ${
                          isPositive ? 'text-red-600' : 'text-blue-600'
                        }`}>
                          {isPositive ? (
                            <TrendingUp className="w-4 h-4" />
                          ) : (
                            <TrendingDown className="w-4 h-4" />
                          )}
                          {formatPercent(changePercent)}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  )
}
