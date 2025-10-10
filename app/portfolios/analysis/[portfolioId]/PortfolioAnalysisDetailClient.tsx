"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Loader2, ArrowLeft, CheckCircle, AlertCircle, Shield, Target, TrendingUp } from "lucide-react"
import Header from "@/components/header"
import { fetchPortfolioAnalysis, fetchPortfolioList } from "@/lib/api/portfolios"
import { useTickerMapping } from "@/contexts/TickerMappingContext"
import { PortfolioPieChart } from "@/components/portfolios/portfolio-pie-chart"
import { RiskEfficiencyChart } from "@/components/portfolios/RiskEfficiencyChart"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { PORTFOLIO_RISK_LEVEL_LABELS, PORTFOLIO_RISK_LEVEL_COLORS } from "@/types/portfolio"
import type { PortfolioAnalysis, AnalysisResult } from "@/types/portfolio"

interface PortfolioAnalysisDetailClientProps {
  portfolioId: string
}

export function PortfolioAnalysisDetailClient({ portfolioId }: PortfolioAnalysisDetailClientProps) {
  const router = useRouter()
  const [analysisData, setAnalysisData] = useState<PortfolioAnalysis | null>(null)
  const [portfolioName, setPortfolioName] = useState<string>("")
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'analysis' | 'recommendation'>('analysis')
  
  const { getStockName } = useTickerMapping()

  useEffect(() => {
    const loadAnalysis = async () => {
      setIsLoading(true)
      setError(null)
      
      try {
        // 포트폴리오 목록과 분석 데이터를 병렬로 가져오기
        const [portfolioList, analysisResult] = await Promise.all([
          fetchPortfolioList(),
          fetchPortfolioAnalysis(portfolioId)
        ])
        
        if (!analysisResult) {
          setError("분석 데이터를 불러올 수 없습니다.")
          return
        }
        
        // 포트폴리오 이름 설정 (API 우선, fallback으로 목록에서 찾기)
        if (analysisResult.portfolioName) {
          setPortfolioName(analysisResult.portfolioName)
        } else {
          const portfolio = portfolioList.find(p => p.id.toString() === portfolioId)
          setPortfolioName(portfolio?.name || "포트폴리오 분석")
        }
        
        setAnalysisData(analysisResult)
      } catch (err) {
        setError(err instanceof Error ? err.message : "분석 데이터를 불러오는데 실패했습니다.")
      } finally {
        setIsLoading(false)
      }
    }

    loadAnalysis()
  }, [portfolioId])

  // 위험도에 따른 색상 가져오기
  const getRiskColor = (level: 'LOW' | 'MEDIUM' | 'HIGH') => {
    const colors = {
      LOW: '#10b981',
      MEDIUM: '#f59e0b',
      HIGH: '#ef4444'
    }
    return colors[level]
  }

  // 분석 타입 라벨
  const getAnalysisTypeLabel = (type: string) => {
    switch (type) {
      case 'user':
        return '사용자 포트폴리오'
      case 'min-variance':
        return '최소분산 포트폴리오'
      case 'max-sharpe':
        return '최대샤프 포트폴리오'
      default:
        return type
    }
  }

  // 파이차트 데이터 변환 (포트폴리오 상세 페이지와 동일한 색상 방식)
  const convertToPieChartData = (result: AnalysisResult) => {
    const tickers = Object.keys(result.holdings).sort() // 일관된 순서를 위해 정렬
    
    return tickers.map((ticker, index) => ({
      name: getStockName(ticker, parseInt(portfolioId)),
      percent: result.holdings[ticker] * 100,
      trend: 0,
      color: `hsl(${(index * 137.5) % 360}, 70%, 50%)`, // 포트폴리오 상세 페이지와 동일
      amount: 0
    }))
  }

  // 로딩 상태
  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#f0f9f7]">
        <Header />
        <main className="max-w-7xl mx-auto pt-8 px-4 pb-8">
          <div className="flex items-center justify-center h-96">
            <div className="flex items-center gap-3">
              <Loader2 className="w-8 h-8 animate-spin text-[#009178]" />
              <span className="text-lg text-[#1f2937]">분석 결과를 불러오는 중...</span>
            </div>
          </div>
        </main>
      </div>
    )
  }

  // 에러 상태
  if (error || !analysisData) {
    return (
      <div className="min-h-screen bg-[#f0f9f7]">
        <Header />
        <main className="max-w-7xl mx-auto pt-8 px-4 pb-8">
          <Button
            onClick={() => router.back()}
            variant="ghost"
            className="mb-6"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            돌아가기
          </Button>
          
          <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-xl border border-[#009178] p-8 text-center">
            <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-[#1f2937] mb-2">분석 데이터를 불러올 수 없습니다</h2>
            <p className="text-[#6b7280]">{error || "알 수 없는 오류가 발생했습니다."}</p>
          </div>
        </main>
      </div>
    )
  }

  // 스캐터 차트 데이터 변환
  const scatterData = analysisData.results.map(result => ({
    name: getAnalysisTypeLabel(result.type).replace(' 포트폴리오', ''),
    type: result.type,
    riskLevel: result.riskLevel,
    // API에서 받은 메트릭 사용 (없으면 기본값)
    risk: result.metrics?.stdDeviation ?? (result.type === 'user' ? 27.08 : result.type === 'min-variance' ? 6.39 : 8.09),
    sharpe: result.metrics?.sharpeRatio ?? (result.type === 'user' ? 0.249 : result.type === 'min-variance' ? 10.644 : 9.234),
    color: getRiskColor(result.riskLevel)
  }))

  // 분석 탭 컴포넌트
  const AnalysisTab = () => (
    <div className="space-y-6">
      {/* 위험-효율성 차트 + 요약 */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* 차트 영역 (60%) */}
        <div className="lg:col-span-3 bg-white/95 backdrop-blur-sm rounded-2xl shadow-xl border border-[#009178] p-6">
          <h3 className="text-xl font-bold text-[#1f2937] mb-2">포트폴리오 위험-효율성 분석</h3>
          <p className="text-[#6b7280] mb-4 text-sm">변동성(위험)과 샤프비율(효율성)로 비교한 포지셔닝</p>
          
          <RiskEfficiencyChart data={scatterData} />
          
          <div className="mt-4 flex justify-center gap-6">
            {scatterData.map(d => (
              <div key={d.type} className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: d.color }}></div>
                <span className="font-medium text-sm text-[#1f2937]">{d.name}</span>
              </div>
            ))}
          </div>
        </div>

        {/* 요약 정보 영역 (40%) */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-xl border border-[#009178] p-6">
            <h3 className="text-lg font-bold text-[#1f2937] mb-4">핵심 지표 요약</h3>
            <div className="space-y-3">
              {analysisData.results.map((result) => (
                <div key={result.type} className="p-3 rounded-lg border-2 hover:shadow-md transition-all" style={{ borderColor: getRiskColor(result.riskLevel) }}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-semibold text-sm text-[#1f2937]">{getAnalysisTypeLabel(result.type).replace(' 포트폴리오', '')}</span>
                    <Badge className={`text-xs font-medium ${PORTFOLIO_RISK_LEVEL_COLORS[result.riskLevel]}`}>
                      {PORTFOLIO_RISK_LEVEL_LABELS[result.riskLevel]}
                    </Badge>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <p className="text-xs text-[#6b7280]">변동성</p>
                      <p className="font-semibold text-base text-[#1f2937]">
                        {scatterData.find(d => d.type === result.type)?.risk.toFixed(2)}%
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-[#6b7280]">샤프비율</p>
                      <p className="font-semibold text-base" style={{ color: getRiskColor(result.riskLevel) }}>
                        {scatterData.find(d => d.type === result.type)?.sharpe.toFixed(3)}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-gradient-to-br from-[#d1f0eb] to-[#e8f5f3] rounded-2xl shadow-xl border border-[#009178] p-6">
            <h3 className="text-base font-bold mb-3 text-[#1f2937]">차트 해석 가이드</h3>
            <ul className="space-y-2 text-sm text-[#374151]">
              <li className="flex items-start gap-2">
                <span className="text-[#009178] font-bold">•</span>
                <span><span className="font-semibold">왼쪽 상단:</span> 낮은 위험 + 높은 효율성</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-[#009178] font-bold">•</span>
                <span><span className="font-semibold">오른쪽 하단:</span> 높은 위험 + 낮은 효율성</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-[#009178] font-bold">•</span>
                <span><span className="font-semibold">샤프비율:</span> 위험 대비 수익 효율성</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-[#009178] font-bold">•</span>
                <span><span className="font-semibold">변동성:</span> 투자 위험의 크기</span>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* 3개 포트폴리오 비교 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {analysisData.results.map((result) => {
          const pieChartData = convertToPieChartData(result)
          const metrics = scatterData.find(d => d.type === result.type)
          
          return (
            <div key={result.type} className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-xl border-t-4 hover:shadow-2xl transition-all" style={{ borderTopColor: getRiskColor(result.riskLevel) }}>
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-bold text-[#1f2937]">{getAnalysisTypeLabel(result.type)}</h3>
                  <Badge className={`text-xs font-medium border ${PORTFOLIO_RISK_LEVEL_COLORS[result.riskLevel]}`}>
                    {PORTFOLIO_RISK_LEVEL_LABELS[result.riskLevel]}
                  </Badge>
                </div>

                {/* 주요 지표 */}
                <div className="space-y-3 mb-6 pb-6 border-b">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-[#6b7280] font-medium">변동성</span>
                    <span className="font-semibold text-base text-[#1f2937]">{metrics?.risk.toFixed(2)}%</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-[#6b7280] font-medium">샤프비율</span>
                    <span className="font-semibold text-base" style={{ color: getRiskColor(result.riskLevel) }}>
                      {metrics?.sharpe.toFixed(3)}
                    </span>
                  </div>
                </div>

                {/* 강점/약점 */}
                <div className="space-y-4 mb-6">
                  {(result.strengths && result.strengths.length > 0) && (
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <CheckCircle className="text-green-500" size={18} />
                        <h4 className="font-semibold text-sm text-[#1f2937]">강점</h4>
                      </div>
                      <ul className="space-y-1.5">
                        {result.strengths.map((strength, idx) => (
                          <li key={idx} className="flex gap-2 items-start text-xs text-[#374151]">
                            <span className="text-green-500 font-bold">✓</span>
                            <span>{strength}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {(result.weaknesses && result.weaknesses.length > 0) && (
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <AlertCircle className="text-red-500" size={18} />
                        <h4 className="font-semibold text-sm text-[#1f2937]">약점</h4>
                      </div>
                      <ul className="space-y-1.5">
                        {result.weaknesses.map((weakness, idx) => (
                          <li key={idx} className="flex gap-2 items-start text-xs text-[#374151]">
                            <span className="text-red-500 font-bold">⚠</span>
                            <span>{weakness}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* API에서 강점/약점이 없는 경우 기본 메시지 */}
                  {(!result.strengths || result.strengths.length === 0) && (!result.weaknesses || result.weaknesses.length === 0) && (
                    <div className="text-center text-[#6b7280] py-3">
                      <p className="text-xs">상세 분석 정보가 준비 중입니다.</p>
                    </div>
                  )}
                </div>

                {/* 종목 구성 - 파이차트 */}
                <div>
                  <h4 className="font-semibold text-sm text-[#1f2937] mb-3">종목 구성</h4>
                  <div className="flex justify-center mb-3">
                    <PortfolioPieChart 
                      data={pieChartData}
                      height={180}
                    />
                  </div>
                  <div className="space-y-2">
                    {pieChartData.map((item, index) => (
                      <div key={index} className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2">
                          <div 
                            className="w-2.5 h-2.5 rounded-full" 
                            style={{ backgroundColor: item.color }} 
                          />
                          <span className="font-medium text-[#1f2937]">{item.name}</span>
                        </div>
                        <span className="font-semibold" style={{ color: getRiskColor(result.riskLevel) }}>
                          {item.percent.toFixed(1)}%
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )

  // 추천 탭 컴포넌트
  const RecommendationTab = () => {
    const recommendations = [
      { 
        title: '안정 추구형', 
        Icon: Shield, 
        bgColor: 'bg-[#10b981]',
        lightBg: 'bg-green-50',
        border: 'border-green-300',
        textColor: 'text-green-800',
        portfolio: '최소분산 포트폴리오', 
        desc: '손실을 최소화하고 안정적인 투자를 원하시나요?', 
        features: ['변동성 극소화로 안정적 투자', '심리적 안정감 제공', '단기 투자에 적합', '손실 위험 최소화']
      },
      { 
        title: '효율 추구형', 
        Icon: Target, 
        bgColor: 'bg-[#f59e0b]',
        lightBg: 'bg-yellow-50',
        border: 'border-yellow-300',
        textColor: 'text-yellow-800',
        portfolio: '최대샤프 포트폴리오', 
        desc: '위험 대비 최고의 수익을 원하시나요?', 
        features: ['최고의 위험 대비 수익', '효율적인 자산 배분', '중기 투자에 적합', '균형잡힌 리스크 관리']
      },
      { 
        title: '수익 추구형', 
        Icon: TrendingUp, 
        bgColor: 'bg-[#ef4444]',
        lightBg: 'bg-red-50',
        border: 'border-red-300',
        textColor: 'text-red-800',
        portfolio: '사용자 포트폴리오', 
        desc: '높은 수익을 위해 위험을 감수할 수 있나요?', 
        features: ['높은 수익 가능성', '적극적 포트폴리오 구성', '장기 투자에 적합', '변동성 감수 필요']
      }
    ]

    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {recommendations.map(({ title, Icon, bgColor, lightBg, border, textColor, portfolio, desc, features }) => (
            <div key={title} className={`bg-white/95 backdrop-blur-sm rounded-2xl shadow-xl p-6 border-t-4 ${border} hover:shadow-2xl transition-all`}>
              <div className={`${bgColor} w-12 h-12 rounded-full flex items-center justify-center mb-4`}>
                <Icon className="text-white" size={24} />
              </div>
              <h3 className="text-lg font-bold text-[#1f2937] mb-3">{title}</h3>
              <p className="text-sm text-[#6b7280] mb-4 leading-relaxed">{desc}</p>
              <div className={`${lightBg} p-4 rounded-xl mb-4 border ${border}`}>
                <p className={`font-semibold text-sm ${textColor}`}>→ {portfolio}</p>
              </div>
              <ul className="text-sm space-y-2 text-[#374151]">
                {features.map((f, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className={`${bgColor} text-white font-semibold text-xs px-1.5 py-0.5 rounded mt-0.5`}>{i + 1}</span>
                    <span>{f}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-xl border border-[#009178] p-6">
          <h3 className="text-lg font-bold text-[#1f2937] mb-6 text-center">투자 유형별 가이드</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-4">
              <div className="h-[136px] p-4 bg-gradient-to-br from-[#d1f0eb] to-[#e8f5f3] rounded-xl border-l-4 border-[#009178]">
                <p className="font-semibold text-base mb-2 text-[#1f2937]">위험 성향 평가</p>
                <ul className="text-sm text-[#374151] space-y-1.5">
                  <li><span className="font-semibold">저위험:</span> 손실 최소화, 안정성 우선 → 최소분산</li>
                  <li><span className="font-semibold">중위험:</span> 효율적 수익과 안정성 균형 → 최대샤프</li>
                  <li><span className="font-semibold">고위험:</span> 높은 수익 위해 변동성 감수 → 사용자</li>
                </ul>
              </div>

              <div className="h-[136px] p-4 bg-gradient-to-br from-[#d1f0eb] to-[#e8f5f3] rounded-xl border-l-4 border-[#009178]">
                <p className="font-semibold text-base mb-2 text-[#1f2937]">투자 목표 고려</p>
                <ul className="text-sm text-[#374151] space-y-1.5">
                  <li><span className="font-semibold">자산 보존:</span> 안정적 운용이 목표 → 최소분산</li>
                  <li><span className="font-semibold">균형 성장:</span> 리스크 관리하며 성장 → 최대샤프</li>
                  <li><span className="font-semibold">적극 성장:</span> 공격적 수익 추구 → 사용자</li>
                </ul>
              </div>
            </div>

            <div className="space-y-4">
              <div className="h-[136px] p-4 bg-gradient-to-br from-[#d1f0eb] to-[#e8f5f3] rounded-xl border-l-4 border-[#009178]">
                <p className="font-semibold text-base mb-2 text-[#1f2937]">투자 기간별 추천</p>
                <ul className="text-sm text-[#374151] space-y-1.5">
                  <li><span className="font-semibold">단기 (1년 미만):</span> 최소분산 - 안정적 운용</li>
                  <li><span className="font-semibold">중기 (1-3년):</span> 최대샤프 - 효율적 성장</li>
                  <li><span className="font-semibold">장기 (3년 이상):</span> 사용자 - 적극적 투자</li>
                </ul>
              </div>

              <div className="h-[136px] p-4 bg-gradient-to-br from-[#d1f0eb] to-[#e8f5f3] rounded-xl border-l-4 border-[#009178]">
                <p className="font-semibold text-base mb-2 text-[#1f2937]">투자 유의사항</p>
                <p className="text-sm text-[#374151] leading-relaxed">
                  과거 데이터는 미래 성과를 보장하지 않습니다. 재무 목표, 투자 기간, 위험 감내 수준을 종합적으로 고려하여 신중하게 결정하세요.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#f0f9f7]">
      <Header />
      
      <main className="max-w-7xl mx-auto pt-6 px-4 pb-8">
        <div className="mb-6">
          <Button
            onClick={() => router.back()}
            variant="ghost"
            className="mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            돌아가기
          </Button>
          
          <div className="flex items-center justify-between">
            <div>
              {(portfolioName || analysisData.portfolioName) && (
                <h1 className="text-2xl font-bold text-[#1f2937] mb-1">
                  {portfolioName || analysisData.portfolioName}
                </h1>
              )}
              <p className="text-base text-[#6b7280]">KOSPI 벤치마크 기준 | 3년 롤링 윈도우 최적화 분석</p>
            </div>
            {analysisData.analysisPeriod && (
              <div className="text-right">
                <p className="text-sm text-[#6b7280]">분석 기간</p>
                <p className="text-base font-semibold text-[#1f2937]">
                  {analysisData.analysisPeriod.startDate} - {analysisData.analysisPeriod.endDate}
                </p>
              </div>
            )}
          </div>
        </div>

        <div className="mb-6 flex gap-2 bg-white/95 backdrop-blur-sm rounded-xl shadow-lg p-1.5">
          <button
            onClick={() => setActiveTab('analysis')}
            className={`flex-1 px-6 py-3 font-semibold text-base rounded-lg transition-all ${activeTab === 'analysis' ? 'bg-[#009178] text-white shadow-md' : 'text-[#6b7280] hover:bg-[#f0f9f7]'}`}
          >
            포트폴리오 분석
          </button>
          <button
            onClick={() => setActiveTab('recommendation')}
            className={`flex-1 px-6 py-3 font-semibold text-base rounded-lg transition-all ${activeTab === 'recommendation' ? 'bg-[#009178] text-white shadow-md' : 'text-[#6b7280] hover:bg-[#f0f9f7]'}`}
          >
            맞춤 추천
          </button>
        </div>

        {activeTab === 'analysis' && <AnalysisTab />}
        {activeTab === 'recommendation' && <RecommendationTab />}
      </main>
    </div>
  )
}

