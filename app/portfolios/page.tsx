"use client"

import { useState, useEffect } from "react"
import Header from "@/components/header"
import PortfolioPageHeader from "@/components/portfolios/portfolio-page-header"
import { PortfolioListCard } from "@/components/portfolios/portfolio-list-card"
import { PortfolioDetailPanel } from "@/components/portfolios/portfolio-detail-panel"
import PortfolioEmptyState from "@/components/portfolios/portfolio-empty-state"
import FloatingChatbot from "@/components/ui/FloatingChatbot"
import { fetchPortfolioSummary, fetchPortfolioList, type PortfolioWithDetails, type PortfolioSummary } from "@/lib/api/portfolios"

export default function PortfoliosPage() {
  const [portfolios, setPortfolios] = useState<PortfolioWithDetails[]>([])
  const [portfolioSummary, setPortfolioSummary] = useState<PortfolioSummary | null>(null)
  const [selectedPortfolio, setSelectedPortfolio] = useState<PortfolioWithDetails | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadPortfolioData = async () => {
      setLoading(true)
      try {
        const [summaryData, portfolioList] = await Promise.all([
          fetchPortfolioSummary(),
          fetchPortfolioList()
        ])
        
        setPortfolioSummary(summaryData)
        setPortfolios(portfolioList)
        
        // 첫 번째 포트폴리오를 기본 선택
        if (portfolioList.length > 0) {
          setSelectedPortfolio(portfolioList[0])
        }
      } catch (error) {
        console.error("Failed to load portfolio data:", error)
      } finally {
        setLoading(false)
      }
    }

    loadPortfolioData()
  }, [])

  const handlePortfolioClick = (portfolio: PortfolioWithDetails) => {
    setSelectedPortfolio(portfolio)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f0f9f7]">
        <Header />
        <PortfolioPageHeader />
        <main className="max-w-7xl mx-auto pt-1 px-4 pb-4 space-y-3">
          <div className="flex items-center justify-center h-64">
            <div className="text-lg text-gray-600">포트폴리오 데이터를 불러오는 중...</div>
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#f0f9f7]">
      <Header />
      <PortfolioPageHeader />

      <main className="max-w-7xl mx-auto pt-1 px-4 pb-4 space-y-3">

        {portfolios.length > 0 ? (
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-8 mt-4">
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
                    totalValue: portfolio.totalAssets,
                    changeAmount: portfolio.dailyChange,
                    changePercent: portfolio.dailyRate,
                    riskLevel: "보통" as "낮음" | "보통" | "높음", // API에서 제공하지 않으므로 기본값
                    holdings: portfolio.holdingStocks
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
      
      {/* 플로팅 챗봇 */}
      <FloatingChatbot context="portfolio" />
    </div>
  )
}
