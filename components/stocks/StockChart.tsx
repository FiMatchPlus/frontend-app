"use client"

import { useState, useEffect, useRef } from "react"
import * as echarts from "echarts"
import { TrendingUp, TrendingDown, BarChart3, LineChartIcon } from "lucide-react"
import { LoadingSpinner } from "@/components/ui/LoadingSpinner"
import { useStockData } from "@/hooks/useStockData"
import { formatCurrency, formatDate, formatTime } from "@/utils/formatters"
import type { Stock, TimeFrame, ChartConfig } from "@/types/stock"
import { cn } from "@/lib/utils"

interface StockChartProps {
  selectedStock: Stock | null
  className?: string
}

const timeFrameOptions: { value: TimeFrame; label: string }[] = [
  { value: "1m", label: "1분" },
  { value: "1D", label: "1일" },
  { value: "1W", label: "1주" },
  { value: "1M", label: "1개월" },
  { value: "1Y", label: "1년" },
]

const chartTypeOptions = [
  { value: "line" as const, label: "라인", icon: LineChartIcon },
  { value: "candlestick" as const, label: "캔들", icon: BarChart3 },
]

export function StockChart({ selectedStock, className }: StockChartProps) {
  const { chartData, isLoading, error, timeFrame, changeTimeFrame } = useStockData(selectedStock)
  const [chartConfig, setChartConfig] = useState<ChartConfig>({
    timeFrame: "1D",
    showVolume: false,
    chartType: "candlestick",
  })

  const chartRef = useRef<HTMLDivElement>(null)
  const chartInstance = useRef<echarts.ECharts | null>(null)

  // ECharts 차트 업데이트
  useEffect(() => {
    if (!chartData.length || !chartRef.current) return

    // 기존 차트 인스턴스 정리
    if (chartInstance.current) {
      chartInstance.current.dispose()
    }

    // 새 차트 인스턴스 생성
    chartInstance.current = echarts.init(chartRef.current)

    // 데이터 변환
    const convertedData = chartData.map(item => ({
      date: new Date(item.timestamp).toISOString().split('T')[0],
      open: item.open,
      high: item.high,
      low: item.low,
      close: item.close,
      volume: item.volume
    }))

    // ECharts 옵션 설정
    const option = {
      title: {
        text: `${selectedStock?.name} (${selectedStock?.symbol})`,
        left: 'center',
        textStyle: {
          fontSize: 16,
          fontWeight: 'bold'
        }
      },
      tooltip: {
        trigger: 'axis',
        axisPointer: {
          type: 'cross'
        },
        formatter: function(params: any) {
    if (chartConfig.chartType === 'candlestick') {
            const data = params[0]
            return `
              <div style="font-weight: bold; margin-bottom: 8px;">${data.axisValue}</div>
              <div style="font-size: 12px; line-height: 1.5;">
                <div>시가: ${formatCurrency(data.data[1])}</div>
                <div>고가: ${formatCurrency(data.data[4])}</div>
                <div>저가: ${formatCurrency(data.data[3])}</div>
                <div>종가: ${formatCurrency(data.data[2])}</div>
                <div>거래량: ${data.data[5]?.toLocaleString() || 'N/A'}</div>
              </div>
            `
    } else {
            const data = params[0]
            return `
              <div style="font-weight: bold; margin-bottom: 8px;">${data.axisValue}</div>
              <div style="font-size: 12px; line-height: 1.5;">
                <div>종가: ${formatCurrency(data.data[1])}</div>
                <div>거래량: ${data.data[2]?.toLocaleString() || 'N/A'}</div>
              </div>
            `
          }
        }
      },
      grid: {
        left: '3%',
        right: '4%',
        bottom: '3%',
        top: '15%',
        containLabel: true
      },
      xAxis: {
        type: 'category',
        data: convertedData.map(d => d.date),
        axisLine: {
          lineStyle: {
            color: '#e5e7eb'
          }
        },
        axisLabel: {
          color: '#9ca3af',
          fontSize: 11
        }
      },
      yAxis: {
        type: 'value',
        position: 'right',
        axisLine: {
          lineStyle: {
            color: '#e5e7eb'
          }
        },
        axisLabel: {
          color: '#9ca3af',
          fontSize: 11,
          formatter: function(value: number) {
            return formatCurrency(value)
          }
        },
        splitLine: {
          lineStyle: {
            color: '#f3f4f6',
            type: 'dashed'
          }
        }
      },
      series: chartConfig.chartType === 'candlestick' 
        ? [
            {
              name: 'K선',
              type: 'candlestick',
              data: convertedData.map(d => [d.open, d.close, d.low, d.high]),
              itemStyle: {
                color: '#26a69a',
                color0: '#ef5350',
                borderColor: '#26a69a',
                borderColor0: '#ef5350'
              }
            },
            ...(chartConfig.showVolume ? [{
              name: '거래량',
              type: 'bar',
              yAxisIndex: 0,
              data: convertedData.map(d => d.volume),
              itemStyle: {
                color: function(params: any) {
                  const dataIndex = params.dataIndex
                  const candleData = convertedData[dataIndex]
                  return candleData.close >= candleData.open ? '#26a69a' : '#ef5350'
                },
                opacity: 0.3
              }
            }] : [])
          ]
        : [
            {
              name: '종가',
              type: 'line',
              data: convertedData.map(d => [d.date, d.close]),
              smooth: true,
              lineStyle: {
                color: '#6366f1',
                width: 2
              },
              itemStyle: {
                color: '#6366f1'
              },
              symbol: 'circle',
              symbolSize: 4
            },
            ...(chartConfig.showVolume ? [{
              name: '거래량',
              type: 'bar',
              yAxisIndex: 0,
              data: convertedData.map(d => d.volume),
              itemStyle: {
                color: '#6366f1',
                opacity: 0.3
              }
            }] : [])
          ]
    }

    // 차트 옵션 설정
    chartInstance.current.setOption(option)

    // 리사이즈 이벤트 리스너
    const handleResize = () => {
      if (chartInstance.current) {
        chartInstance.current.resize()
      }
    }

    window.addEventListener('resize', handleResize)

    // 정리 함수
    return () => {
      window.removeEventListener('resize', handleResize)
      if (chartInstance.current) {
        chartInstance.current.dispose()
        chartInstance.current = null
      }
    }
  }, [chartData, chartConfig.chartType, chartConfig.showVolume, selectedStock])

  if (!selectedStock) {
    return (
      <div className={cn("flex items-center justify-center h-96 bg-muted/20 rounded-lg", className)}>
        <div className="text-center">
          <BarChart3 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">종목을 선택하여 차트를 확인하세요</p>
        </div>
      </div>
    )
  }

  return (
    <div className={cn("bg-background/50 backdrop-blur-sm rounded-lg border border-border", className)}>
      {/* Chart Header */}
      <div className="p-4 border-b border-border">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <h2 className="text-lg font-semibold text-foreground">{selectedStock.name}</h2>
            <span className="text-sm text-muted-foreground">{selectedStock.symbol}</span>
            {selectedStock.changePercent > 0 ? (
              <TrendingUp className="h-4 w-4 text-green-500" />
            ) : (
              <TrendingDown className="h-4 w-4 text-red-500" />
            )}
          </div>
          <div className="text-right">
            <div className="text-xl font-bold text-foreground">{formatCurrency(selectedStock.price)}</div>
            <div
              className={cn("text-sm font-medium", selectedStock.changePercent > 0 ? "text-green-500" : "text-red-500")}
            >
              {selectedStock.changePercent > 0 ? "+" : ""}
              {selectedStock.changePercent.toFixed(2)}%
            </div>
          </div>
        </div>

        {/* Controls */}
        <div className="flex flex-wrap items-center gap-4">
          {/* Time Frame Selector */}
          <div className="flex items-center gap-1 bg-muted/50 rounded-lg p-1">
            {timeFrameOptions.map((option) => (
              <button
                key={option.value}
                onClick={() => changeTimeFrame(option.value)}
                className={cn(
                  "px-3 py-1.5 text-xs font-medium rounded-md transition-all",
                  timeFrame === option.value
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground hover:bg-background/50",
                )}
              >
                {option.label}
              </button>
            ))}
          </div>

          {/* Chart Type Selector */}
          <div className="flex items-center gap-1 bg-muted/50 rounded-lg p-1">
            {chartTypeOptions.map((option) => {
              const Icon = option.icon
              return (
                <button
                  key={option.value}
                  onClick={() => setChartConfig((prev) => ({ ...prev, chartType: option.value }))}
                  className={cn(
                    "flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-all",
                    chartConfig.chartType === option.value
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground hover:bg-background/50",
                  )}
                >
                  <Icon className="h-3 w-3" />
                  {option.label}
                </button>
              )
            })}
          </div>

          {/* Volume Toggle */}
          <button
            onClick={() => setChartConfig((prev) => ({ ...prev, showVolume: !prev.showVolume }))}
            className={cn(
              "px-3 py-1.5 text-xs font-medium rounded-md transition-all",
              chartConfig.showVolume
                ? "bg-primary text-primary-foreground"
                : "bg-muted/50 text-muted-foreground hover:text-foreground",
            )}
          >
            거래량
          </button>
        </div>
      </div>

      {/* Chart Content */}
      <div className="px-4 py-4">
        {isLoading ? (
          <div className="flex items-center justify-center h-96">
            <LoadingSpinner size="lg" />
            <span className="ml-3 text-muted-foreground">차트 로딩 중...</span>
          </div>
        ) : error ? (
          <div className="flex items-center justify-center h-96 text-red-500">
            <p>{error}</p>
          </div>
        ) : (
          <div className="h-96 w-full relative">
            <div ref={chartRef} style={{ height: '100%', width: '100%' }} />
          </div>
        )}
      </div>

      {/* Attribution */}
      <div className="p-2 text-xs text-center text-muted-foreground border-t border-border">
        Powered by <a href="https://echarts.apache.org" target="_blank" rel="noopener noreferrer" className="underline hover:text-foreground">Apache ECharts</a>
      </div>
    </div>
  )
}
