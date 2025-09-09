"use client"

import { useState } from "react"
import Header from "@/components/header"
import PortfolioPageHeader from "@/components/portfolios/portfolio-page-header"
import PortfolioSummaryCard from "@/components/portfolios/portfolio-summary-card"
import { PortfolioListCard } from "@/components/portfolios/portfolio-list-card"
import { PortfolioDetailPanel } from "@/components/portfolios/portfolio-detail-panel"
import PortfolioEmptyState from "@/components/portfolios/portfolio-empty-state"
import {
  portfolios,
  getTotalPortfolioValue,
  getTotalChange,
  getTotalChangePercent,
  getPortfolioWithDetails,
  type PortfolioWithDetails,
} from "@/data/portfolios"

export default function PortfoliosPage() {
  const [selectedPortfolio, setSelectedPortfolio] = useState<PortfolioWithDetails | null>(
    portfolios.length > 0 ? getPortfolioWithDetails(portfolios[0]) : null,
  )

  const handlePortfolioClick = (portfolio: any) => {
    const portfolioWithDetails = getPortfolioWithDetails(portfolio)
    setSelectedPortfolio(portfolioWithDetails)
  }

  const totalPortfolioValue = getTotalPortfolioValue(portfolios)
  const totalChange = getTotalChange(portfolios)
  const totalChangePercent = getTotalChangePercent(portfolios)

  return (
    <div className="min-h-screen bg-[#f0f9f7]">
      <Header />
      <PortfolioPageHeader />

      <main className="max-w-7xl mx-auto pt-1 px-4 pb-4 space-y-3">
        <PortfolioSummaryCard
          totalValue={totalPortfolioValue}
          totalChange={totalChange}
          totalChangePercent={totalChangePercent}
        />

        {portfolios.length > 0 ? (
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-8 mt-12">
            {/* Portfolio List */}
            <section className="xl:col-span-1 space-y-4 animate-in fade-in duration-700 delay-300">
              <h2 className="text-xl font-bold text-[#1f2937] mb-4">포트폴리오 목록</h2>
              {portfolios.map((portfolio, index) => (
                <PortfolioListCard
                  key={portfolio.id}
                  portfolio={{
                    id: portfolio.id.toString(),
                    name: portfolio.name,
                    description: portfolio.description,
                    totalValue: portfolio.totalValue,
                    changeAmount: portfolio.changeAmount,
                    changePercent: portfolio.change,
                    riskLevel: portfolio.riskLevel as "낮음" | "보통" | "높음",
                    holdings: portfolio.stockHoldings
                      .sort((a, b) => b.weight - a.weight)
                      .slice(0, 3)
                      .map((stock) => ({
                        name: stock.name,
                        percentage: Math.round(stock.weight),
                      })),
                  }}
                  onClick={() => handlePortfolioClick(portfolio)}
                  index={index}
                  isSelected={selectedPortfolio?.id === portfolio.id}
                />
              ))}
            </section>

            {/* Portfolio Detail Panel */}
            <section className="xl:col-span-2 animate-in fade-in duration-700 delay-500">
              {selectedPortfolio && <PortfolioDetailPanel portfolio={selectedPortfolio} />}
            </section>
          </div>
        ) : (
          <PortfolioEmptyState />
        )}
      </main>
    </div>
  )
}
