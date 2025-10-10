"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import Link from "next/link"
import { Target, Loader2, RefreshCw, ExternalLink, AlertTriangle } from "lucide-react"
import { fetchPortfolioAnalysis } from "@/lib/api/portfolios"
import { useTickerMapping } from "@/contexts/TickerMappingContext"
import { useAnalysisCache } from "@/contexts/AnalysisCacheContext"
import { AnalysisPieChart } from "./AnalysisPieChart"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { PORTFOLIO_RISK_LEVEL_LABELS, PORTFOLIO_RISK_LEVEL_COLORS } from "@/types/portfolio"
import type { PortfolioAnalysis, AnalysisResult } from "@/types/portfolio"

interface PortfolioAnalysisTabProps {
  portfolioId: number
  holdings: Array<{
    ticker: string
    name: string
    weight: number
    value: number
    dailyRate: number
  }>
}

export function PortfolioAnalysisTab({ portfolioId, holdings }: PortfolioAnalysisTabProps) {
  const [analysisData, setAnalysisData] = useState<PortfolioAnalysis | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  const { updatePortfolioMappings, getStockName } = useTickerMapping()
  const { getAnalysisData, setAnalysisData: cacheAnalysisData } = useAnalysisCache()

  // 포트폴리오별 티커-종목명 매핑 저장
  useEffect(() => {
    const mappings: Record<string, string> = {}
    holdings.forEach(holding => {
      mappings[holding.ticker] = holding.name
    })
    updatePortfolioMappings(portfolioId, mappings)
  }, [holdings, portfolioId, updatePortfolioMappings])

  // 분석 데이터 로드 함수 (캐시 우선 사용)
  const loadAnalysisData = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    
    try {
      // 1. 먼저 캐시에서 분석 데이터 확인
      const cachedData = getAnalysisData(portfolioId)
      
      if (cachedData !== undefined) {
        // 캐시된 데이터가 있으면 사용 (null이어도 캐시된 값으로 간주)
        setAnalysisData(cachedData)
        setIsLoading(false)
        return
      }
      
      // 2. 캐시에 데이터가 없으면 API 호출
      const data = await fetchPortfolioAnalysis(portfolioId.toString())
      
      // 3. API 응답을 캐시에 저장
      cacheAnalysisData(portfolioId, data)
      
      setAnalysisData(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : "분석 데이터를 불러오는데 실패했습니다.")
    } finally {
      setIsLoading(false)
    }
  }, [portfolioId, getAnalysisData, cacheAnalysisData])

  // 재시도 함수 (캐시 무시하고 강제 API 호출)
  const handleRetry = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    
    try {
      const data = await fetchPortfolioAnalysis(portfolioId.toString())
      
      // API 응답을 캐시에 저장
      cacheAnalysisData(portfolioId, data)
      
      setAnalysisData(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : "분석 데이터를 불러오는데 실패했습니다.")
    } finally {
      setIsLoading(false)
    }
  }, [portfolioId, cacheAnalysisData])

  // 초기 데이터 로드
  useEffect(() => {
    loadAnalysisData()
  }, [portfolioId]) // loadAnalysisData 대신 portfolioId 직접 사용

  // 분석 결과를 파이차트 데이터로 변환
  const convertToPieChartData = (result: AnalysisResult) => {
    const colorMap: Record<string, string> = {}
    
    // 기존 보유 종목의 색상 매핑 생성
    holdings.forEach((holding, index) => {
      colorMap[holding.ticker] = `hsl(${(index * 137.5) % 360}, 70%, 50%)`
    })

    return Object.entries(result.holdings).map(([ticker, weight]) => ({
      name: getStockName(ticker, portfolioId),
      value: weight,
      color: colorMap[ticker] || `hsl(${Math.random() * 360}, 70%, 50%)`
    }))
  }

  // 분석 결과 타입을 한글명으로 변환
  const getAnalysisTypeLabel = (type: string) => {
    switch (type) {
      case 'user':
        return '사용자 지정'
      case 'min-variance':
        return '안정형'
      case 'max-sharpe':
        return '공격형'
      default:
        return type
    }
  }


  // 초기 로딩 상태
  if (isLoading && !analysisData) {
    return (
      <div className="bg-[#f0f9f7] rounded-xl p-4">
        <div className="flex items-center gap-2 mb-4">
          <Target className="w-5 h-5 text-[#009178]" />
          <h3 className="text-lg font-semibold text-[#1f2937]">상세 분석</h3>
        </div>
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-6 h-6 animate-spin text-[#009178]" />
          <span className="ml-2 text-[#6b7280]">분석 결과를 불러오는 중...</span>
        </div>
      </div>
    )
  }

  // API 에러 상태
  if (error) {
    return (
      <div className="bg-[#f0f9f7] rounded-xl p-4">
        <div className="flex items-center gap-2 mb-4">
          <Target className="w-5 h-5 text-[#009178]" />
          <h3 className="text-lg font-semibold text-[#1f2937]">상세 분석</h3>
        </div>
        <div className="text-center py-12">
          <AlertTriangle className="w-8 h-8 text-red-500 mx-auto mb-4" />
          <div className="text-lg text-red-600 mb-4">분석 데이터를 불러올 수 없습니다</div>
          <p className="text-[#6b7280] mb-6">{error}</p>
          <Button onClick={handleRetry} variant="outline">
            <RefreshCw className="w-4 h-4 mr-2" />
            다시 시도
          </Button>
        </div>
      </div>
    )
  }

  // 분석 데이터가 없는 경우 (null)
  if (!analysisData) {
    return (
      <div className="bg-[#f0f9f7] rounded-xl p-4">
        <div className="flex items-center gap-2 mb-4">
          <Target className="w-5 h-5 text-[#009178]" />
          <h3 className="text-lg font-semibold text-[#1f2937]">상세 분석</h3>
        </div>
        <div className="text-center py-12">
          <div className="text-lg text-[#6b7280]">분석 데이터가 없습니다</div>
        </div>
      </div>
    )
  }

  // 분석 실패 상태 (FAILED 상태를 먼저 확인)
  if (analysisData.status === 'FAILED') {
    return (
      <div className="bg-[#f0f9f7] rounded-xl p-4">
        <div className="flex items-center gap-2 mb-4">
          <Target className="w-5 h-5 text-[#009178]" />
          <h3 className="text-lg font-semibold text-[#1f2937]">상세 분석</h3>
        </div>
        <div className="text-center py-12">
          <AlertTriangle className="w-8 h-8 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-[#1f2937] mb-2">분석 실패</h3>
          <p className="text-[#6b7280] mb-6">분석 중 오류가 발생했습니다.</p>
          <Button onClick={handleRetry} variant="outline">
            <RefreshCw className="w-4 h-4 mr-2" />
            다시 시도
          </Button>
        </div>
      </div>
    )
  }

  // 분석 진행 중 상태
  if (analysisData.status === 'RUNNING' || analysisData.status === 'PENDING') {
    return (
      <div className="bg-[#f0f9f7] rounded-xl p-4">
        <div className="flex items-center gap-2 mb-4">
          <Target className="w-5 h-5 text-[#009178]" />
          <h3 className="text-lg font-semibold text-[#1f2937]">상세 분석</h3>
        </div>
        <div className="text-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-[#009178] mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-[#1f2937] mb-2">분석 진행 중</h3>
          <p className="text-[#6b7280]">상세 분석이 진행 중입니다. 잠시만 기다려주세요.</p>
          <p className="text-sm text-[#9ca3af] mt-2">완료되면 자동으로 결과가 표시됩니다</p>
        </div>
      </div>
    )
  }

  // 분석 완료 상태
  if (analysisData.status === 'COMPLETED' && analysisData.results.length > 0) {
    return (
      <div className="bg-[#f0f9f7] rounded-xl p-4">
        <div className="flex items-center gap-2 mb-4">
          <Target className="w-5 h-5 text-[#009178]" />
          <h3 className="text-lg font-semibold text-[#1f2937]">상세 분석</h3>
        </div>
        
        {/* 분석 결과 카드들 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          {analysisData.results.map((result, index) => {
            const pieChartData = convertToPieChartData(result)
            
            return (
              <div key={result.type} className="bg-white rounded-lg p-6 shadow-sm border">
                <div className="text-center mb-4">
                  <h4 className="text-lg font-semibold text-[#1f2937] mb-2">
                    {getAnalysisTypeLabel(result.type)}
                  </h4>
                  <Badge 
                    className={`text-sm font-medium px-3 py-1 ${PORTFOLIO_RISK_LEVEL_COLORS[result.riskLevel]}`}
                  >
                    <AlertTriangle className="w-3 h-3 mr-1" />
                    {PORTFOLIO_RISK_LEVEL_LABELS[result.riskLevel]}
                  </Badge>
                </div>
                
                <div className="flex justify-center mb-4">
                  <AnalysisPieChart 
                    data={pieChartData} 
                    width={180} 
                    height={180} 
                  />
                </div>
                
                {/* 종목별 비중 정보 */}
                <div className="space-y-2">
                  {pieChartData.map((item, itemIndex) => (
                    <div key={itemIndex} className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <div 
                          className="w-3 h-3 rounded-full" 
                          style={{ backgroundColor: item.color }} 
                        />
                        <span className="text-[#1f2937] truncate">{item.name}</span>
                      </div>
                      <span className="text-[#6b7280] font-medium">
                        {(item.value * 100).toFixed(1)}%
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
        
        {/* 결과 더보기 버튼 */}
        <div className="text-center">
          <Link href={`/portfolios/analysis/${portfolioId}`}>
            <Button variant="outline" className="bg-white hover:bg-gray-50">
              <ExternalLink className="w-4 h-4 mr-2" />
              결과 더보기
            </Button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-[#f0f9f7] rounded-xl p-4">
      <div className="flex items-center gap-2 mb-4">
        <Target className="w-5 h-5 text-[#009178]" />
        <h3 className="text-lg font-semibold text-[#1f2937]">상세 분석</h3>
      </div>
      <div className="text-center py-12">
        <div className="text-lg text-[#6b7280]">분석 결과가 없습니다</div>
      </div>
    </div>
  )
}
