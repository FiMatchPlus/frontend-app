"use client"

import { useSearchParams, useRouter } from "next/navigation"
import type { PortfolioWithDetails } from "@/lib/api/portfolios"
import { PortfolioDetailHeader } from "./portfolio-detail-header"
import { PortfolioTabContent } from "./portfolio-tab-content"

interface PortfolioDetailPanelProps {
  portfolio: PortfolioWithDetails
}

type TabType = "holdings" | "backtests" | "analysis"

export function PortfolioDetailPanel({ portfolio }: PortfolioDetailPanelProps) {
  const searchParams = useSearchParams()
  const router = useRouter()
  
  // URL에서 탭 상태 읽기, 기본값은 "holdings"
  const activeTab = (searchParams.get('tab') as TabType) || "holdings"

  // 탭 변경 시 URL 업데이트
  const handleTabChange = (tabId: TabType) => {
    const params = new URLSearchParams(searchParams.toString())
    params.set('tab', tabId)
    router.push(`?${params.toString()}`, { scroll: false })
  }

  return (
    <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-xl border border-[#008485] p-6 animate-in fade-in duration-500">
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
