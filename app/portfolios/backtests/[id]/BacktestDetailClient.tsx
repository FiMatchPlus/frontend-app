"use client"

import { useEffect, useState } from "react"
import { useRouter, useParams } from "next/navigation"
import Header from "@/components/header"
import { Button } from "@/components/ui/button"
import { getBacktestDetail } from "@/lib/api/backtests"
import BacktestChart from "@/components/portfolios/BacktestChart"
import { MarkdownReport } from "@/components/portfolios/MarkdownReport"
import FloatingChatbot from "@/components/ui/FloatingChatbot"
import { ArrowLeft } from "lucide-react"

export default function BacktestDetailClient() {
  const router = useRouter()
  const params = useParams<{ id: string }>()
  const [backtestData, setBacktestData] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchBacktestDetail = async () => {
      if (!params?.id) return
      
      setIsLoading(true)
      setError(null)
      
      try {
        console.log("Fetching backtest detail for ID:", params.id)
        const response = await getBacktestDetail(params.id)
        setBacktestData(response.data)
      } catch (err) {
        console.error("Failed to fetch backtest detail:", err)
        setError(err instanceof Error ? err.message : "백테스트 상세 정보를 불러오는데 실패했습니다.")
      } finally {
        setIsLoading(false)
      }
    }

    fetchBacktestDetail()
  }, [params?.id])

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#f0f9f7]">
        <Header />
        <main className="max-w-5xl mx-auto pt-8 px-4 pb-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-32 mb-4"></div>
            <div className="h-64 bg-gray-200 rounded"></div>
          </div>
        </main>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#f0f9f7]">
        <Header />
        <main className="max-w-5xl mx-auto pt-8 px-4 pb-8">
          <Button variant="ghost" onClick={() => router.back()} className="mb-4 text-[#1f2937] hover:text-[#009178]">
            <ArrowLeft className="w-4 h-4 mr-2" /> 뒤로가기
          </Button>
          
          <div className="text-center py-16">
            <div className="text-6xl mb-6">📊</div>
            <h1 className="text-3xl font-bold text-[#1f2937] mb-4">백테스트를 불러올 수 없습니다</h1>
            <p className="text-[#6b7280] text-lg mb-8 max-w-md mx-auto">
              {error}
            </p>
            
            <div className="space-y-4">
              <Button
                onClick={() => router.push("/portfolios")}
                className="bg-[#009178] hover:bg-[#004e42] text-white px-8 py-3 text-lg font-semibold"
              >
                포트폴리오 목록으로 돌아가기
              </Button>
            </div>
          </div>
        </main>
        
        <FloatingChatbot context="backtest" />
      </div>
    )
  }

  if (!backtestData) {
    return null
  }

  return (
    <div className="min-h-screen bg-[#f0f9f7]">
      <Header />
      <main className="max-w-6xl mx-auto pt-8 px-4 pb-10 space-y-8">
        
        <div className="flex items-center justify-between">
          <Button variant="ghost" onClick={() => router.back()} className="text-[#1f2937] hover:text-[#009178]">
            <ArrowLeft className="w-4 h-4 mr-2" /> 뒤로가기
          </Button>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-3xl font-bold text-[#1f2937]">{backtestData.name}</h1>
            <div className="text-right text-sm text-[#6b7280]">
              <div>기간: {backtestData.period}</div>
              <div>벤치마크: {backtestData.benchmarkName}</div>
              <div>실행시간: {backtestData.executionTime.toFixed(2)}초</div>
            </div>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-3 bg-[#f0f9f7] rounded-lg">
              <div className="text-sm text-[#6b7280] mb-1">총 수익률</div>
              <div className={`text-xl font-bold ${backtestData.metrics.totalReturn >= 0 ? "text-[#dc2626]" : "text-[#009178]"}`}>
                {(backtestData.metrics.totalReturn * 100).toFixed(1)}%
              </div>
            </div>
            <div className="text-center p-3 bg-[#f0f9f7] rounded-lg">
              <div className="text-sm text-[#6b7280] mb-1">샤프 비율</div>
              <div className="text-xl font-bold text-[#1f2937]">
                {backtestData.metrics.sharpeRatio.toFixed(2)}
              </div>
            </div>
            <div className="text-center p-3 bg-[#f0f9f7] rounded-lg">
              <div className="text-sm text-[#6b7280] mb-1">최대 낙폭</div>
              <div className="text-xl font-bold text-[#1f2937]">
                {(backtestData.metrics.maxDrawdown * 100).toFixed(1)}%
              </div>
            </div>
            <div className="text-center p-3 bg-[#f0f9f7] rounded-lg">
              <div className="text-sm text-[#6b7280] mb-1">승률</div>
              <div className="text-xl font-bold text-[#1f2937]">
                {(backtestData.metrics.winRate * 100).toFixed(0)}%
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-xl font-semibold text-[#1f2937] mb-4">누적 평가액</h2>
          <BacktestChart 
            data={backtestData.dailyEquity} 
            holdings={backtestData.holdings}
            benchmarkData={backtestData.benchmarkData}
            benchmarkName={backtestData.benchmarkName}
            className="w-full"
          />
        </div>

        {backtestData.rules ? (
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="text-xl font-semibold text-[#1f2937] mb-4">매매기준</h2>
            
            {backtestData.rules.memo && (
              <div className="mb-6 p-4 bg-[#f0f9f7] rounded-lg">
                <h3 className="text-sm font-medium text-[#6b7280] mb-1">메모</h3>
                <p className="text-[#1f2937]">{backtestData.rules.memo}</p>
              </div>
            )}

            <div className="grid md:grid-cols-3 gap-6">
              <div>
                <h3 className="text-lg font-medium text-[#1f2937] mb-3">손절 조건</h3>
                {backtestData.rules.stopLoss && backtestData.rules.stopLoss.length > 0 ? (
                  <div className="space-y-3">
                    {backtestData.rules.stopLoss.map((rule: any, index: number) => (
                      <div key={index} className="p-3 border border-red-200 bg-red-50 rounded-lg">
                        <div className="text-sm font-medium text-red-800">
                          {rule.category}: {rule.threshold}
                        </div>
                        {rule.description && (
                          <div className="text-xs text-red-600 mt-1">{rule.description}</div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-sm text-[#6b7280] italic">손절 조건이 설정되지 않음</div>
                )}
              </div>

              <div>
                <h3 className="text-lg font-medium text-[#1f2937] mb-3">익절 조건</h3>
                {backtestData.rules.takeProfit && backtestData.rules.takeProfit.length > 0 ? (
                  <div className="space-y-3">
                    {backtestData.rules.takeProfit.map((rule: any, index: number) => (
                      <div key={index} className="p-3 border border-green-200 bg-green-50 rounded-lg">
                        <div className="text-sm font-medium text-green-800">
                          {rule.category}: {rule.threshold}
                        </div>
                        {rule.description && (
                          <div className="text-xs text-green-600 mt-1">{rule.description}</div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-sm text-[#6b7280] italic">익절 조건이 설정되지 않음</div>
                )}
              </div>

              <div>
                <h3 className="text-lg font-medium text-[#1f2937] mb-3">리밸런싱</h3>
                {backtestData.rules.rebalance && backtestData.rules.rebalance.length > 0 ? (
                  <div className="space-y-3">
                    {backtestData.rules.rebalance.map((rule: any, index: number) => (
                      <div key={index} className="p-3 border border-blue-200 bg-blue-50 rounded-lg">
                        <div className="text-sm font-medium text-blue-800">
                          {rule.category}: {rule.threshold}
                        </div>
                        {rule.description && (
                          <div className="text-xs text-blue-600 mt-1">{rule.description}</div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-sm text-[#6b7280] italic">리밸런싱 조건이 설정되지 않음</div>
                )}
              </div>
            </div>

            {backtestData.rules.basicBenchmark && (
              <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                <h3 className="text-sm font-medium text-[#6b7280] mb-1">기본 벤치마크</h3>
                <p className="text-[#1f2937]">{backtestData.rules.basicBenchmark}</p>
              </div>
            )}
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="text-xl font-semibold text-[#1f2937] mb-4">매매기준</h2>
            <div className="p-4 bg-gray-50 rounded-lg text-center">
              <p className="text-[#6b7280]">특별한 매매기준 설정 없이 기간만 반영하여 백테스트를 진행했습니다.</p>
            </div>
          </div>
        )}

        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-xl font-semibold text-[#1f2937] mb-4">백테스트 분석 리포트</h2>
          {backtestData.report ? (
            <div className="text-sm text-green-600 mb-4">
              ✓ 서버에서 제공된 리포트를 표시합니다
            </div>
          ) : (
            <div className="text-sm text-orange-600 mb-4">
              ⚠ 서버 리포트가 없어 동적으로 생성된 리포트를 표시합니다
            </div>
          )}
          <MarkdownReport
            report={backtestData.report}
            metrics={backtestData.metrics}
          />
        </div>
      </main>
      
      <FloatingChatbot context="backtest" />
    </div>
  )
}