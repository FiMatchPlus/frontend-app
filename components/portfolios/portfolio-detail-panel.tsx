"use client"

import { useState } from "react"
import { TrendingUp, TrendingDown, Calendar, Target, Bell, Activity, PieChart } from "lucide-react"
import type { PortfolioWithDetails } from "@/data/portfolios"
import { formatCurrency, formatPercent } from "@/utils/formatters"
import { PortfolioPieChart } from "./portfolio-pie-chart"

interface PortfolioDetailPanelProps {
  portfolio: PortfolioWithDetails
}

type TabType = "holdings" | "strategy" | "transactions" | "alerts"

export function PortfolioDetailPanel({ portfolio }: PortfolioDetailPanelProps) {
  const [activeTab, setActiveTab] = useState<TabType>("holdings")

  const tabs = [
    { id: "holdings" as TabType, label: "보유종목", icon: PieChart },
    { id: "strategy" as TabType, label: "매매신호", icon: Target },
    { id: "transactions" as TabType, label: "거래내역", icon: Activity },
    { id: "alerts" as TabType, label: "알림", icon: Bell },
  ]

  return (
    <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-xl border border-[#008485] p-6 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-[#1f2937]">{portfolio.name}</h2>
          <p className="text-[#6b7280] mt-1">{portfolio.description}</p>
        </div>
        <div className="text-right">
          <div className="text-2xl font-bold text-[#1f2937]">{formatCurrency(portfolio.totalValue)}</div>
          <div className={`flex items-center gap-1 ${portfolio.change >= 0 ? "text-[#008485]" : "text-[#dc2626]"}`}>
            {portfolio.change >= 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
            <span className="font-semibold">{formatPercent(portfolio.change)}</span>
            <span className="text-sm">
              ({portfolio.change >= 0 ? "+" : ""}
              {formatCurrency(portfolio.changeAmount)})
            </span>
          </div>
        </div>
      </div>

      <div className="flex gap-2 mb-6 p-1 bg-[#f0f9f7] rounded-xl">
        {tabs.map((tab) => {
          const Icon = tab.icon
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
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

      <div className="min-h-[400px]">
        {activeTab === "holdings" && (
          <div className="bg-[#f0f9f7] rounded-xl p-4">
            <h3 className="text-lg font-semibold text-[#1f2937] mb-4">자산 구성 및 보유 종목</h3>

            <div className="flex flex-col lg:flex-row gap-6">
              {/* Pie Chart - Visual only */}
              <div className="lg:w-1/3 flex-shrink-0 flex items-center justify-center py-4">
                <PortfolioPieChart
                  data={portfolio.holdings.map((holding) => ({
                    name: holding.name,
                    percent: holding.percent,
                    trend: holding.change,
                    color: holding.color,
                    amount: holding.amount,
                  }))}
                />
              </div>

              {/* Holdings List with detailed information */}
              <div className="lg:w-2/3 space-y-3">
                {portfolio.holdings.map((holding, index) => (
                  <div key={index} className="flex items-center justify-between p-4 bg-white rounded-lg shadow-sm">
                    <div className="flex items-center gap-3">
                      <div className="w-4 h-4 rounded-full" style={{ backgroundColor: holding.color }} />
                      <div>
                        <div className="font-semibold text-[#1f2937]">{holding.name}</div>
                        <div className="text-sm text-[#6b7280]">비중: {holding.percent}%</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-[#1f2937] text-lg">{formatCurrency(holding.amount)}</div>
                      <div
                        className={`text-sm font-medium ${holding.change >= 0 ? "text-[#008485]" : "text-[#dc2626]"}`}
                      >
                        {holding.change >= 0 ? "+" : ""}
                        {formatPercent(holding.change)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === "strategy" && (
          <div className="bg-[#f0f9f7] rounded-xl p-4">
            <div className="flex items-center gap-2 mb-4">
              <Target className="w-5 h-5 text-[#008485]" />
              <h3 className="text-lg font-semibold text-[#1f2937]">매매신호</h3>
            </div>
            <div className="space-y-3">
              <div className="p-3 bg-white rounded-lg">
                <div className="font-medium text-[#1f2937] mb-1">설명</div>
                <div className="text-[#6b7280] text-sm">{portfolio.strategy.description}</div>
              </div>
              <div className="p-3 bg-white rounded-lg">
                <div className="font-medium text-[#1f2937] mb-1">리밸런싱</div>
                <div className="text-[#6b7280]">{portfolio.strategy.rebalanceFrequency}</div>
              </div>
              <div className="p-3 bg-white rounded-lg">
                <div className="font-medium text-[#1f2937] mb-1">손절</div>
                <div className="text-[#dc2626] font-semibold">{portfolio.strategy.stopLoss}%</div>
              </div>
              <div className="p-3 bg-white rounded-lg">
                <div className="font-medium text-[#1f2937] mb-1">익절</div>
                <div className="text-[#008485] font-semibold">{portfolio.strategy.takeProfit}%</div>
              </div>
            </div>
          </div>
        )}

        {activeTab === "transactions" && (
          <div className="bg-[#f0f9f7] rounded-xl p-4">
            <div className="flex items-center gap-2 mb-4">
              <Activity className="w-5 h-5 text-[#008485]" />
              <h3 className="text-lg font-semibold text-[#1f2937]">거래 내역</h3>
            </div>
            <div className="space-y-2">
              {portfolio.logs.map((log, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-white rounded-lg">
                  <div>
                    <div className="font-medium text-[#1f2937]">{log.description}</div>
                    <div className="text-sm text-[#6b7280] flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {log.date}
                    </div>
                  </div>
                  <div className="text-right">
                    <div
                      className={`font-semibold ${
                        log.type === "매수" || log.type === "리밸런싱" ? "text-[#dc2626]" : "text-[#008485]"
                      }`}
                    >
                      {log.type}
                    </div>
                    {log.amount && <div className="text-sm text-[#6b7280]">{formatCurrency(log.amount)}</div>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === "alerts" && (
          <div className="bg-[#f0f9f7] rounded-xl p-4">
            <div className="flex items-center gap-2 mb-4">
              <Bell className="w-5 h-5 text-[#008485]" />
              <h3 className="text-lg font-semibold text-[#1f2937]">알림</h3>
            </div>
            <div className="space-y-2">
              {portfolio.alerts.map((alert, index) => (
                <div key={index} className="p-3 bg-white rounded-lg">
                  <div
                    className={`inline-block px-2 py-1 rounded text-xs font-medium mb-2 ${
                      alert.type === "success"
                        ? "bg-green-100 text-green-800"
                        : alert.type === "warning"
                          ? "bg-yellow-100 text-yellow-800"
                          : "bg-blue-100 text-blue-800"
                    }`}
                  >
                    {alert.type === "success" ? "성공" : alert.type === "warning" ? "경고" : "정보"}
                  </div>
                  <div className="font-medium text-[#1f2937] mb-1">{alert.message}</div>
                  <div className="text-xs text-[#6b7280] flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    {alert.date}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
