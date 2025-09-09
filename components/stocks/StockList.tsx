"use client"

import Image from "next/image"
import { formatCurrency, formatPercent, getChangeColor } from "@/utils/formatters"
import type { Stock, Portfolio } from "@/types/stock"

interface StockListProps {
  title: string
  stocks: Stock[]
  portfolioStocks?: Portfolio[]
  onSelectStock: (stock: Stock) => void
  className?: string
}

export function StockList({ title, stocks, portfolioStocks, onSelectStock, className }: StockListProps) {
  return (
    <div className={className}>
      <h3 className="text-sm font-semibold text-foreground mb-3">{title}</h3>
      <div className="space-y-2">
        {stocks.map((stock) => {
          const portfolioStock = portfolioStocks?.find((p) => p.symbol === stock.symbol)

          return (
            <button
              key={stock.symbol}
              onClick={() => onSelectStock(stock)}
              className="w-full rounded-lg p-3 text-left hover:bg-accent/50 transition-all duration-200 border border-transparent hover:border-border/50"
            >
              <div className="flex items-center gap-3">
                {/* Stock Logo */}
                <div className="relative h-8 w-8 rounded-full overflow-hidden bg-muted flex-shrink-0">
                  <Image
                    src={stock.logo || "/placeholder.svg"}
                    alt={`${stock.name} logo`}
                    fill
                    className="object-cover"
                    onError={(e) => {
                      // 로고 로딩 실패 시 placeholder로 대체
                      const target = e.target as HTMLImageElement
                      target.src = "/placeholder.svg"
                    }}
                  />
                </div>

                {/* Stock Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <div className="truncate">
                      <div className="font-medium text-sm text-foreground truncate">{stock.name}</div>
                      <div className="text-xs text-muted-foreground">
                        {stock.symbol}
                        {portfolioStock && <span className="ml-2 text-primary">• {portfolioStock.shares}주 보유</span>}
                      </div>
                    </div>

                    <div className="text-right flex-shrink-0">
                      <div className="text-sm font-medium text-foreground">{formatCurrency(stock.price)}</div>
                      <div className={`text-xs ${getChangeColor(stock.changePercent)}`}>
                        {formatPercent(stock.changePercent)}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}
