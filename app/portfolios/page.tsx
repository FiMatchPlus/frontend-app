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

  const handlePortfolioDeleted = async () => {
    try {
      const portfolioList = await fetchPortfolioList()
      setPortfolios(portfolioList)
      
      if (portfolioList.length > 0) {
        setSelectedPortfolio(portfolioList[0])
      } else {
        setSelectedPortfolio(null)
      }

      const summaryData = await fetchPortfolioSummary()
      setPortfolioSummary(summaryData)
    } catch (error) {
      console.error("Failed to refresh portfolio data:", error)
    }
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

      <main className="max-w-7xl mx-auto px-4 py-2 h-[calc(100vh-220px)]">

        {portfolios.length > 0 ? (
          <div className="flex flex-col xl:flex-row gap-6 h-full">
            
            <section className="xl:w-1/3 flex flex-col h-full mx-2 animate-in fade-in duration-700 delay-300">
              <h2 className="text-xl font-bold text-[#1f2937] mb-4 flex-shrink-0">포트폴리오 목록</h2>
              <div className="space-y-4 overflow-y-auto pr-2 pb-6 flex-1 min-h-0">
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
              </div>
            </section>

            
            <section className="xl:flex-1 h-full animate-in fade-in duration-700 delay-500">
              {selectedPortfolio && (
                <PortfolioDetailPanel 
                  portfolio={selectedPortfolio} 
                  onPortfolioDeleted={handlePortfolioDeleted}
                />
              )}
            </section>
          </div>
        ) : (
          <PortfolioEmptyState onShowAll={() => {}} />
        )}
      </main>
      
      
      <FloatingChatbot context="portfolio" />
    </div>
  )
}
