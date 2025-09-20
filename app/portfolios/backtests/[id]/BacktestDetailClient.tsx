"use client"

import { useMemo, useEffect, useState } from "react"
import { useRouter, useParams, notFound } from "next/navigation"
import Header from "@/components/header"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { getBacktestDetail } from "@/lib/api/backtests"
import BacktestChart from "@/components/portfolios/BacktestChart"
import { ArrowLeft } from "lucide-react"
import { formatCurrency } from "@/utils/formatters"

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
          <Button variant="ghost" onClick={() => router.back()} className="mb-4 text-[#1f2937] hover:text-[#059669]">
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
                className="bg-[#008485] hover:bg-[#006b6c] text-white px-8 py-3 text-lg font-semibold"
              >
                포트폴리오 목록으로 돌아가기
              </Button>
            </div>
          </div>
        </main>
      </div>
    )
  }

  if (!backtestData) {
    return null
  }

  // Natural language summary placeholder using metrics
  const m = backtestData.metrics
  const summary = m ? `총 수익률 ${(m.totalReturn * 100).toFixed(1)}%, 연환산 ${(m.annualizedReturn * 100).toFixed(1)}%, 
샤프 ${m.sharpeRatio.toFixed(2)}, 최대낙폭 ${(m.maxDrawdown * 100).toFixed(1)}%. 
승률 ${(m.winRate * 100).toFixed(0)}%, 손익비 ${m.profitLossRatio.toFixed(2)}로 ${m.sharpeRatio > 1 ? "위험 대비 수익이 양호" : "위험 대비 수익이 낮은"} 편입니다.` : "백테스트 지표 데이터를 불러오는 중입니다."

  return (
    <div className="min-h-screen bg-[#f0f9f7]">
      <Header />
      <main className="max-w-5xl mx-auto pt-8 px-4 pb-10 space-y-6">
        <Button variant="ghost" onClick={() => router.back()} className="text-[#1f2937] hover:text-[#059669]">
          <ArrowLeft className="w-4 h-4 mr-2" /> 뒤로가기
        </Button>
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold text-[#1f2937]">{backtestData.name}</h1>
          <div className="text-[#6b7280] text-right">기간 {backtestData.period} · 실행시간 {backtestData.executionTime.toFixed(2)}초</div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-xl text-[#1f2937]">누적 평가액</CardTitle>
          </CardHeader>
          <CardContent>
            <BacktestChart 
              data={backtestData.dailyEquity} 
              holdings={backtestData.holdings}
              className="w-full"
            />
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base text-[#1f2937]">주요 지표</CardTitle>
            </CardHeader>
            <CardContent className="text-sm space-y-2">
              {m ? (
                <>
                  <div className="flex items-center justify-between">
                    <span className="text-[#6b7280]">총 수익률</span>
                    <span className="font-semibold text-[#1f2937]">{(m.totalReturn * 100).toFixed(1)}%</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[#6b7280]">변동성</span>
                    <span className="font-semibold text-[#1f2937]">{(m.volatility * 100).toFixed(1)}%</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[#6b7280]">샤프 비율</span>
                    <span className="font-semibold text-[#1f2937]">{m.sharpeRatio.toFixed(2)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[#6b7280]">최대 낙폭</span>
                    <span className="font-semibold text-[#1f2937]">{(m.maxDrawdown * 100).toFixed(1)}%</span>
                  </div>
                </>
              ) : (
                <div className="text-center py-4 text-[#6b7280]">
                  지표 데이터를 불러오는 중입니다...
                </div>
              )}
            </CardContent>
          </Card>
          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle className="text-base text-[#1f2937]">요약</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-[#1f2937] leading-6 whitespace-pre-line">
              {summary}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}