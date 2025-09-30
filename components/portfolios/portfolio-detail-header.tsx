"use client"

import { TrendingUp, TrendingDown, Target, Activity, PieChart } from "lucide-react"
import type { PortfolioWithDetails } from "@/lib/api/portfolios"
import { formatCurrency, formatPercent } from "@/utils/formatters"

interface PortfolioDetailHeaderProps {
  portfolio: PortfolioWithDetails
  activeTab: "holdings" | "backtests" | "analysis"
  onTabChange: (tabId: "holdings" | "backtests" | "analysis") => void
}

export function PortfolioDetailHeader({ portfolio, activeTab, onTabChange }: PortfolioDetailHeaderProps) {
  const tabs = [
    { id: "holdings" as const, label: "보유종목", icon: PieChart },
    { id: "backtests" as const, label: "백테스트 내역", icon: Activity },
    { id: "analysis" as const, label: "상세 분석", icon: Target },
  ]

  return (
    <>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-[#1f2937]">{portfolio.name}</h2>
          <p className="text-[#6b7280] mt-1">{portfolio.description}</p>
        </div>
        <div className="text-right">
          <div className="text-2xl font-bold text-[#1f2937]">{formatCurrency(portfolio.totalAssets)}</div>
          <div className={`flex items-center gap-1 ${portfolio.dailyRate >= 0 ? "text-[#008485]" : "text-[#dc2626]"}`}>
            {portfolio.dailyRate >= 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
            <span className="font-semibold">{formatPercent(portfolio.dailyRate)}</span>
            <span className="text-sm">
              ({portfolio.dailyChange >= 0 ? "+" : ""}
              {formatCurrency(portfolio.dailyChange)})
            </span>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 p-1 bg-[#f0f9f7] rounded-xl">
        {tabs.map((tab) => {
          const Icon = tab.icon
          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
                activeTab === tab.id
                  ? "bg-white text-[#008485] shadow-sm"
                  : "text-[#6b7280] hover:text-[#1f2937] hover:bg-white/50"
              }`}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          )
        })}
      </div>
    </>
  )
}
