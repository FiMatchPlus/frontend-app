"use client"

import { useEffect } from "react"
import { Building2, TrendingUp, Volume2, DollarSign } from "lucide-react"
import { formatCurrency, formatNumber, formatPercent, getChangeColor } from "@/utils/formatters"
import { useStockCacheContext } from "@/contexts/StockCacheContext"
import type { Stock } from "@/types/stock"
import { cn } from "@/lib/utils"

interface StockInfoProps {
  selectedStock: Stock | null
  className?: string
}

export function StockInfo({ selectedStock, className }: StockInfoProps) {
  // 일시적으로 API 호출 비활성화 - 오른쪽 패널은 아직 구현하지 않음
  // const { getStockPrice, isLoading } = useStockCacheContext()

  if (!selectedStock) {
    return (
      <div className={cn("bg-background/50 backdrop-blur-sm rounded-lg border border-border p-6", className)}>
        <div className="text-center text-muted-foreground">
          <Building2 className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p>종목을 선택하여 정보를 확인하세요</p>
        </div>
      </div>
    )
  }

  // 일시적으로 실시간 데이터 대신 기본 데이터만 사용
  // const realTimeData = selectedStock ? getStockPrice(selectedStock.symbol) : null
  const currentStock = selectedStock

  const infoItems = [
    {
      label: "현재가",
      value: formatCurrency(currentStock.price),
      icon: DollarSign,
      color: "text-foreground",
    },
    {
      label: "등락률",
      value: formatPercent(currentStock.changePercent),
      icon: TrendingUp,
      color: getChangeColor(currentStock.changePercent),
    },
    {
      label: "거래량",
      value: formatNumber(selectedStock.volume), // 거래량은 실시간 API에 없으므로 기본값 사용
      icon: Volume2,
      color: "text-muted-foreground",
    },
    {
      label: "시가총액",
      value: formatCurrency(currentStock.marketCap),
      icon: Building2,
      color: "text-muted-foreground",
    },
  ]

  return (
    <div className={cn("bg-background/50 backdrop-blur-sm rounded-lg border border-border", className)}>
      {/* Header */}
      <div className="p-4 border-b border-border">
        <div className="flex items-center gap-3 mb-2">
          <h3 className="text-lg font-semibold text-foreground">{currentStock.name}</h3>
          {/* 일시적으로 로딩 상태 비활성화
          {isLoading && (
            <span className="px-2 py-1 text-xs text-muted-foreground bg-muted/50 rounded-md">
              업데이트 중...
            </span>
          )}
          */}
        </div>
        <p className="text-sm text-muted-foreground">{selectedStock.symbol}</p>
      </div>

      {/* Stock Info Grid */}
      <div className="p-4 space-y-4">
        {infoItems.map((item, index) => {
          const Icon = item.icon
          return (
            <div key={index} className="flex items-center justify-between p-3 rounded-lg bg-muted/20">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-background/50">
                  <Icon className="h-4 w-4 text-muted-foreground" />
                </div>
                <span className="text-sm font-medium text-muted-foreground">{item.label}</span>
              </div>
              <span className={cn("text-sm font-semibold", item.color)}>{item.value}</span>
            </div>
          )
        })}
      </div>

      {/* Additional Info */}
      <div className="p-4 border-t border-border">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-muted-foreground">전일 대비</span>
            <div className={cn("font-medium", getChangeColor(currentStock.change))}>
              {currentStock.change > 0 ? "+" : ""}
              {formatCurrency(currentStock.change)}
            </div>
          </div>
          <div>
            <span className="text-muted-foreground">업종</span>
            <div className="font-medium text-foreground">{selectedStock.sector}</div>
          </div>
        </div>
      </div>
    </div>
  )
}
