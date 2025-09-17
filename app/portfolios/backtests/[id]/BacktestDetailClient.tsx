"use client"

import { useMemo, useEffect, useState } from "react"
import { useRouter, useParams, notFound } from "next/navigation"
import Header from "@/components/header"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { findBacktestById } from "@/data/portfolios"
import { ChartContainer, ChartLegend, ChartLegendContent, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { Bar, BarChart, CartesianGrid, Legend, Tooltip, XAxis, YAxis } from "recharts"
import { ArrowLeft } from "lucide-react"
import { formatCurrency } from "@/utils/formatters"

export default function BacktestDetailClient() {
  const router = useRouter()
  const params = useParams<{ id: string }>()
  const [found, setFound] = useState<ReturnType<typeof findBacktestById> | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    console.log("BacktestDetailClient useEffect triggered")
    console.log("params:", params)
    if (params?.id) {
      const id = Number(params.id)
      console.log("Parsed ID:", id, "Is finite:", Number.isFinite(id))
      
      // 테스트용: 사용 가능한 백테스트 ID들 확인
      console.log("Testing available IDs...")
      const testIds = [101, 201, 999]
      testIds.forEach(testId => {
        const testResult = findBacktestById(testId)
        console.log(`ID ${testId}:`, testResult ? "FOUND" : "NOT FOUND")
      })
      
      const result = Number.isFinite(id) ? findBacktestById(id) : null
      console.log("Final result for ID", id, ":", result)
      
      if (!result) {
        console.log("Backtest not found, calling notFound()")
        notFound()
        return
      }
      
      setFound(result)
      setIsLoading(false)
    }
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

  if (!found) {
    return (
      <div className="min-h-screen bg-[#f0f9f7]">
        <Header />
        <main className="max-w-5xl mx-auto pt-8 px-4 pb-8">
          <Button variant="ghost" onClick={() => router.back()} className="mb-4 text-[#1f2937] hover:text-[#059669]">
            <ArrowLeft className="w-4 h-4 mr-2" /> 뒤로가기
          </Button>
          
          <div className="text-center py-16">
            <div className="text-6xl mb-6">📊</div>
            <h1 className="text-3xl font-bold text-[#1f2937] mb-4">백테스트를 찾을 수 없습니다</h1>
            <p className="text-[#6b7280] text-lg mb-8 max-w-md mx-auto">
              요청하신 백테스트 내역이 존재하지 않거나 삭제되었습니다.
            </p>
            
            <div className="space-y-4">
              <Button
                onClick={() => router.push("/portfolios/backtests/create")}
                className="bg-[#008485] hover:bg-[#006b6c] text-white px-8 py-3 text-lg font-semibold"
              >
                새 백테스트 생성하기
              </Button>
              <div className="text-sm text-[#6b7280]">
                또는 <button 
                  onClick={() => router.push("/portfolios")}
                  className="text-[#008485] hover:text-[#006b6c] underline"
                >
                  포트폴리오 목록
                </button>으로 돌아가세요
              </div>
            </div>
          </div>
        </main>
      </div>
    )
  }

  const { portfolio, backtest } = found
  // Prepare per-stock cumulative equity series for stacked bars
  const seriesKeys = useMemo(() => {
    const first = backtest.daily_returns[0]
    return Object.keys(first).filter((k) => k !== "date")
  }, [backtest.daily_returns])

  const colorMap: Record<string, string> = {}
  portfolio.holdings.forEach((h) => (colorMap[h.name] = h.color))

  const equityStackSeries = useMemo(() => {
    // initialize starting equity per stock from portfolio holdings
    const startEquity: Record<string, number> = {}
    portfolio.holdings.forEach((h) => {
      startEquity[h.name] = Math.max(0, Math.round(h.amount))
    })
    const current: Record<string, number> = { ...startEquity }
    return backtest.daily_returns.map((d) => {
      const row: Record<string, number | string> = { date: d.date }
      seriesKeys.forEach((name) => {
        const r = typeof d[name] === "number" ? (d[name] as number) : 0
        current[name] = Math.max(0, Math.round(current[name] * (1 + r)))
        row[name] = current[name]
      })
      return row as { date: string } & Record<string, number>
    })
  }, [backtest.daily_returns, portfolio.holdings, seriesKeys])

  const chartConfig = Object.fromEntries(
    seriesKeys.map((k) => [k, { label: k, color: colorMap[k] || undefined }])
  )

  // Ensure bars have a minimum visual width; enable horizontal scroll if needed
  const barSizePx = 28
  // 막대 사이 간격을 줄이기 위한 비율 (막대 너비의 20%)
  const categoryGapRatio = 0.2
  const interCategoryGapPx = Math.max(0, Math.round(barSizePx * categoryGapRatio))
  const extraPaddingPx = 4 // tick/내부 여백 보정
  // 일자 수가 많을수록 minWidth를 더 크게 잡아 막대 상대 간격을 줄임
  const pointCount = equityStackSeries.length
  const densityBoost = pointCount > 24 ? 1 + Math.min(1, (pointCount - 24) / 48) * 0.8 : 1 // 최대 1.8배
  const perPointPx = Math.round((barSizePx + interCategoryGapPx + extraPaddingPx) * densityBoost)
  const chartMinWidth = 600
  const chartWidthPx = Math.max(chartMinWidth, equityStackSeries.length * perPointPx)

  const yMax = useMemo(() => {
    if (!equityStackSeries.length) return 0
    return Math.max(
      ...equityStackSeries.map((row: any) =>
        seriesKeys.reduce((sum, key) => sum + (Number((row as any)[key]) || 0), 0)
      )
    )
  }, [equityStackSeries, seriesKeys])
  const yMaxSafe = useMemo(() => Math.max(1, yMax), [yMax])
  const yTicks = useMemo(() => {
    const steps = 6
    const step = yMaxSafe / (steps - 1)
    return Array.from({ length: steps }, (_, i) => Math.round(step * i))
  }, [yMaxSafe])

  // Natural language summary placeholder using metrics
  const m = backtest.metrics
  const summary = `총 수익률 ${(m.total_return * 100).toFixed(1)}%, 연환산 ${(m.annualized_return * 100).toFixed(1)}%, 
샤프 ${m.sharpe_ratio.toFixed(2)}, 최대낙폭 ${(m.max_drawdown * 100).toFixed(1)}%. 
승률 ${(m.win_rate * 100).toFixed(0)}%, 손익비 ${m.profit_loss_ratio.toFixed(2)}로 ${m.sharpe_ratio > 1 ? "위험 대비 수익이 양호" : "위험 대비 수익이 낮은"} 편입니다.`

  return (
    <div className="min-h-screen bg-[#f0f9f7]">
      <Header />
      <main className="max-w-5xl mx-auto pt-8 px-4 pb-10 space-y-6">
        <Button variant="ghost" onClick={() => router.back()} className="text-[#1f2937] hover:text-[#059669]">
          <ArrowLeft className="w-4 h-4 mr-2" /> 뒤로가기
        </Button>
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold text-[#1f2937]">{backtest.name}</h1>
          <div className="text-[#6b7280] text-right">기간 {backtest.period} · 실행시간 {backtest.execution_time.toFixed(2)}초</div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-xl text-[#1f2937]">누적 평가액</CardTitle>
          </CardHeader>
          <CardContent>
            {/* Fixed legend (outside the horizontal scroller) */}
            <div className="flex items-center justify-center gap-4 pb-2">
              {seriesKeys.map((k) => (
                <div key={k} className="flex items-center gap-1.5 text-xs text-[#1f2937]">
                  <span className="h-2 w-2 rounded-[2px]" style={{ backgroundColor: colorMap[k] || '#94a3b8' }} />
                  {k}
                </div>
              ))}
            </div>
            <div className="overflow-x-auto">
              <div className="mx-auto" style={{ minWidth: chartWidthPx }}>
                <ChartContainer config={chartConfig} className="h-[360px]">
                  <BarChart data={equityStackSeries} barGap={0} barCategoryGap="0%" margin={{ left: 2, right: 12, top: 6, bottom: 6 }}>
                    <CartesianGrid vertical={false} />
                    <XAxis dataKey="date" tickMargin={4} padding={{ left: 0, right: 0 }} />
                    <YAxis tickFormatter={(v) => formatCurrency(v as number)} width={80} />
                    <Tooltip
                      content={<ChartTooltipContent className="!text-[11px]" />}
                      formatter={(value: any, name: any, item: any) => {
                        const row = item?.payload || {}
                        const total = seriesKeys.reduce((acc, key) => acc + (Number((row as any)[key]) || 0), 0)
                        const pct = total > 0 ? (Number(value) / total) * 100 : 0
                        return [
                          <span className="font-medium text-[#1f2937]">
                            {formatCurrency(Number(value))}
                            <span className="ml-1 px-1.5 py-0.5 rounded bg-[#f0f9f7] text-[#008485] text-[10px] align-middle">{pct.toFixed(1)}%</span>
                          </span>,
                          name as string,
                        ]
                      }}
                      labelFormatter={(label, payload) => {
                        const row = Array.isArray(payload) && payload.length ? (payload[0] as any).payload : null
                        if (!row) return label as string
                        const entries = seriesKeys.map((k) => ({ key: k, value: Number(row[k] || 0), color: colorMap[k] || "#94a3b8" }))
                        const total = entries.reduce((a, b) => a + b.value, 0)
                        const top3 = entries.sort((a, b) => b.value - a.value).slice(0, 3)
                        return (
                          <div className="space-y-1">
                            <div className="text-[11px] text-[#6b7280]">{label as string}</div>
                            <div className="text-[13px] font-semibold text-[#1f2937]">
                              총 평가액 <span className="text-[#008485]">{formatCurrency(total)}</span>
                            </div>
                            <div className="flex flex-wrap gap-1.5 mt-1">
                              {top3.map((e) => {
                                const pct = total > 0 ? (e.value / total) * 100 : 0
                                return (
                                  <span key={e.key} className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full border text-[10px]" style={{ borderColor: e.color, color: e.color }}>
                                    <span className="w-2 h-2 rounded" style={{ backgroundColor: e.color }} />
                                    {e.key}
                                    <span className="ml-0.5 text-[#6b7280]">{pct.toFixed(1)}%</span>
                                  </span>
                                )
                              })}
                            </div>
                          </div>
                        )
                      }}
                    />
                    {seriesKeys.map((k) => (
                      <Bar key={k} dataKey={k} stackId="equity" fill={colorMap[k] || "#94a3b8"} barSize={barSizePx} />
                    ))}
                  </BarChart>
                </ChartContainer>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base text-[#1f2937]">주요 지표</CardTitle>
            </CardHeader>
            <CardContent className="text-sm space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[#6b7280]">총 수익률</span>
                <span className="font-semibold text-[#1f2937]">{(m.total_return * 100).toFixed(1)}%</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[#6b7280]">변동성</span>
                <span className="font-semibold text-[#1f2937]">{(m.volatility * 100).toFixed(1)}%</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[#6b7280]">샤프 비율</span>
                <span className="font-semibold text-[#1f2937]">{m.sharpe_ratio.toFixed(2)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[#6b7280]">최대 낙폭</span>
                <span className="font-semibold text-[#1f2937]">{(m.max_drawdown * 100).toFixed(1)}%</span>
              </div>
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
