"use client"

import { useSearchParams, useRouter } from "next/navigation"
import { useEffect } from "react"
import type { PortfolioWithDetails } from "@/lib/api/portfolios"
import { PortfolioDetailHeader } from "./portfolio-detail-header"
import { PortfolioTabContent } from "./portfolio-tab-content"
import { useAnalysisCache } from "@/contexts/AnalysisCacheContext"

interface PortfolioDetailPanelProps {
  portfolio: PortfolioWithDetails
}

type TabType = "holdings" | "backtests" | "analysis"

export function PortfolioDetailPanel({ portfolio }: PortfolioDetailPanelProps) {
  const searchParams = useSearchParams()
  const router = useRouter()
  const { setAnalysisData } = useAnalysisCache()
  
  // URL에서 탭 상태 읽기, 기본값은 "holdings"
  const activeTab = (searchParams.get('tab') as TabType) || "holdings"

  // 포트폴리오가 선택될 때 analysis 데이터를 캐시에 저장
  useEffect(() => {
    if (portfolio.analysis !== undefined) {
      setAnalysisData(portfolio.id, portfolio.analysis)
    }
  }, [portfolio.id, portfolio.analysis, setAnalysisData])

  // 탭 변경 시 URL 업데이트
  const handleTabChange = (tabId: TabType) => {
    const params = new URLSearchParams(searchParams.toString())
    params.set('tab', tabId)
    router.push(`?${params.toString()}`, { scroll: false })
  }

  return (
    <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-xl border border-[#009178] p-6 animate-in fade-in duration-500">
      <PortfolioDetailHeader 
        portfolio={portfolio} 
        activeTab={activeTab} 
        onTabChange={handleTabChange} 
      />
      <PortfolioTabContent 
        portfolio={portfolio} 
        activeTab={activeTab} 
      />
    </div>
  )
}
