"use client"

import { useState, useEffect, useRef } from "react"
import * as echarts from "echarts"
import { TrendingUp, TrendingDown, BarChart3, LineChartIcon } from "lucide-react"
import { LoadingSpinner } from "@/components/ui/LoadingSpinner"
import { useStockData } from "@/hooks/useStockData"
import { useStockCacheContext } from "@/contexts/StockCacheContext"
import { formatCurrency, formatDate, formatTime, getChangeColor } from "@/utils/formatters"
import type { Stock, TimeFrame, ChartConfig } from "@/types/stock"
import { cn } from "@/lib/utils"

interface StockChartProps {
  selectedStock: Stock | null
  className?: string
}

const timeFrameOptions: { value: TimeFrame; label: string }[] = [
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
  const { chartData, isLoading, isLoadingMore, error, timeFrame, changeTimeFrame, handleScrollBoundary } = useStockData(selectedStock)
  const { getStockPrice } = useStockCacheContext()
  const [chartConfig, setChartConfig] = useState<ChartConfig>({
    timeFrame: "1D",
    showVolume: false,
    chartType: "candlestick",
  })

  // 실시간 가격 데이터 조회
  const realTimeData = selectedStock ? getStockPrice(selectedStock.symbol) : null
  const currentStock = realTimeData ? {
    ...selectedStock,
    price: realTimeData.price,
    change: realTimeData.change,
    changePercent: realTimeData.changePercent
  } : selectedStock

  const chartRef = useRef<HTMLDivElement>(null)
  const chartInstance = useRef<echarts.ECharts | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  // ECharts 차트 업데이트
  useEffect(() => {
    if (!chartData.length || !chartRef.current) return

    // 기존 차트 인스턴스 정리
    if (chartInstance.current) {
      chartInstance.current.dispose()
    }

    // 새 차트 인스턴스 생성
    chartInstance.current = echarts.init(chartRef.current)

    // 데이터 변환 및 날짜순 정렬
    const convertedData = chartData
      .map(item => ({
        date: new Date(item.timestamp).toISOString().split('T')[0],
        timestamp: new Date(item.timestamp).getTime(), // 밀리초 타임스탬프로 변환
        open: item.open,
        high: item.high,
        low: item.low,
        close: item.close,
        volume: item.volume
      }))
      .sort((a, b) => a.timestamp - b.timestamp) // 오래된 날짜부터 최신 날짜 순으로 정렬

    // ECharts 옵션 설정
    const option = {
      animation: false, // 애니메이션 비활성화로 부드러운 스크롤
      title: {
        text: `${selectedStock?.name} (${selectedStock?.symbol})`,
        left: 'center',
        textStyle: {
          fontSize: 16,
          fontWeight: 'bold'
        }
      },
      dataZoom: [
        {
          type: 'inside', // 마우스 드래그로 스크롤 가능
          xAxisIndex: 0,
          zoomLock: true, // 줌 비활성화
          disabled: false, // 드래그 활성화
          moveOnMouseMove: true, // 마우스 드래그로 이동 가능
          moveOnMouseWheel: false, // 커스텀 휠 이벤트 사용하므로 비활성화
          preventDefaultMouseMove: false, // 기본 동작 허용
          startValue: Math.max(0, convertedData.length - 45), // 절대 인덱스: 최근 45개
          endValue: Math.max(44, convertedData.length - 1), // 절대 인덱스: 45개 윈도우 끝
          // 스크롤 이벤트 감지
          onDataZoom: function(params: any) {
            console.log('[Chart] Inside DataZoom event:', params)
            if (params && typeof params.startValue === 'number') {
              handleScrollBoundary(params.startValue, convertedData.length)
            }
          }
        },
        {
          type: 'slider',
          xAxisIndex: 0,
          show: true,
          height: 20,
          bottom: 40,
          zoomLock: true, // 줌 비활성화, 스크롤만 가능
          startValue: Math.max(0, convertedData.length - 45), // 절대 인덱스: 최근 45개
          endValue: Math.max(44, convertedData.length - 1), // 절대 인덱스: 45개 윈도우 끝
          handleStyle: {
            color: '#6366f1',
            borderWidth: 1,
            borderColor: '#4f46e5'
          },
          textStyle: {
            color: '#9ca3af',
            fontSize: 10
          },
          borderColor: '#e5e7eb',
          fillerColor: 'rgba(99, 102, 241, 0.1)',
          selectedDataBackground: {
            lineStyle: {
              color: '#6366f1'
            },
            areaStyle: {
              color: 'rgba(99, 102, 241, 0.1)'
            }
          }
        }
      ],
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
        bottom: '20%', // 슬라이더 공간 확보
        top: '15%',
        containLabel: true
      },
      xAxis: {
        type: 'category', // category 축으로 복원
        data: convertedData.map(d => d.date), // 실제 거래일만 포함된 데이터
        axisLine: {
          lineStyle: {
            color: '#e5e7eb'
          }
        },
        axisLabel: {
          color: '#9ca3af',
          fontSize: 11,
          formatter: function(value: string, index: number) {
            const date = new Date(value)
            const year = date.getFullYear()
            const month = date.getMonth() + 1
            const day = date.getDate()
            
            // 첫 번째 라벨에는 항상 연도 표시
            if (index === 0) {
              return `${month}/${day}\n'${year.toString().slice(-2)}`
            }
            
            // 1월 1일이거나 연도가 바뀌는 지점에서 연도 표시
            if (month === 1 && day <= 7) { // 1월 첫 주
              return `${month}/${day}\n'${year.toString().slice(-2)}`
            }
            
            // 월이 바뀌는 지점에서는 월만 강조
            if (day <= 3) { // 월 초
              return `${month}/${day}`
            }
            
            return `${day}`
          },
          margin: 8,
          lineHeight: 14
        },
        splitLine: {
          show: false
        }
      },
      yAxis: {
        type: 'value',
        position: 'right',
        scale: true, // 데이터 범위에 맞게 스케일 조정
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
                color: '#dc2626', // 상승: 빨간색 (red-600)
                color0: '#2563eb', // 하락: 파란색 (blue-600)
                borderColor: '#dc2626', // 상승 테두리: 빨간색
                borderColor0: '#2563eb' // 하락 테두리: 파란색
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
                  return candleData.close >= candleData.open ? '#dc2626' : '#2563eb' // 상승: 빨간색, 하락: 파란색
                },
                opacity: 0.3
              }
            }] : [])
          ]
        : [
            {
              name: '종가',
              type: 'line',
              data: convertedData.map(d => d.close),
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

    // 차트 컨테이너에 휠 이벤트 추가
    const handleWheel = (event: WheelEvent) => {
      event.preventDefault() // 페이지 스크롤 방지
      
      if (chartInstance.current) {
        const chart = chartInstance.current
        const dataZoom = chart.getOption().dataZoom as any[]
        
        if (dataZoom && dataZoom[0]) {
          const currentStartValue = dataZoom[0].startValue || 0
          const currentEndValue = dataZoom[0].endValue || 44
          const WINDOW_SIZE = 45 // 고정 윈도우 사이즈
          
          // 휠 방향에 따라 인덱스 이동 (속도 줄임)
          const delta = event.deltaY > 0 ? 3 : -3 // 3개 캔들씩 이동
          
          let newStartValue = currentStartValue + delta
          let newEndValue = newStartValue + WINDOW_SIZE - 1 // 45개 윈도우 유지
          
          // 경계 처리 - 데이터 범위 내에서만 이동
          if (newStartValue < 0) {
            newStartValue = 0
            newEndValue = WINDOW_SIZE - 1
          }
          if (newEndValue >= convertedData.length) {
            newEndValue = convertedData.length - 1
            newStartValue = Math.max(0, newEndValue - WINDOW_SIZE + 1)
          }
          
          // dataZoom 업데이트 - 절대 인덱스로 처리
          chart.setOption({
            dataZoom: [{
              startValue: newStartValue,
              endValue: newEndValue
            }]
          }, {
            replaceMerge: ['dataZoom'],
            silent: true,
            notMerge: false,
            lazyUpdate: false
          })
          
          // 경계 감지해서 추가 데이터 로드 (시작점이 전체의 10% 미만일 때)
          if (newStartValue < convertedData.length * 0.1) {
            handleScrollBoundary(newStartValue, convertedData.length)
          }
        }
      }
    }
    
    // 차트 컨테이너에 휠 이벤트 등록
    if (containerRef.current) {
      containerRef.current.addEventListener('wheel', handleWheel, { passive: false })
    }

    // 정리 함수
    return () => {
      window.removeEventListener('resize', handleResize)
      if (containerRef.current) {
        containerRef.current.removeEventListener('wheel', handleWheel)
      }
      if (chartInstance.current) {
        chartInstance.current.dispose()
        chartInstance.current = null
      }
    }
  }, [chartData, chartConfig.chartType, chartConfig.showVolume, selectedStock])

  if (!selectedStock) {
    return (
      <div className={cn("flex items-center justify-center h-[500px] bg-muted/20 rounded-lg", className)}>
        <div className="text-center">
          <BarChart3 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">종목을 선택하여 차트를 확인하세요</p>
        </div>
      </div>
    )
  }

  return (
    <div ref={containerRef} className={cn("bg-background/50 backdrop-blur-sm rounded-lg border border-border", className)}>
      {/* Chart Header */}
      <div className="p-4 border-b border-border">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <h2 className="text-lg font-semibold text-foreground">{currentStock?.name || selectedStock.name}</h2>
            <span className="text-sm text-muted-foreground">{selectedStock.symbol}</span>
            {(currentStock?.changePercent || selectedStock.changePercent) > 0 ? (
              <TrendingUp className="h-4 w-4 text-green-500" />
            ) : (
              <TrendingDown className="h-4 w-4 text-red-500" />
            )}
          </div>
          <div className="text-right">
            <div className="text-xl font-bold text-foreground">
              {formatCurrency(currentStock?.price || selectedStock.price)}
            </div>
            <div
              className={cn(
                "text-sm font-medium", 
                getChangeColor(currentStock?.changePercent || selectedStock.changePercent)
              )}
            >
              {(currentStock?.changePercent || selectedStock.changePercent) > 0 ? "+" : ""}
              {(currentStock?.changePercent || selectedStock.changePercent).toFixed(2)}%
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
        {/* 추가 데이터 로딩 표시 */}
        {isLoadingMore && (
          <div className="absolute top-4 left-4 z-10 flex items-center gap-2 bg-background/90 backdrop-blur-sm px-3 py-2 rounded-lg border border-border shadow-sm">
            <LoadingSpinner size="sm" />
            <span className="text-xs text-muted-foreground">과거 데이터 로딩 중...</span>
          </div>
        )}
        {isLoading ? (
          <div className="flex items-center justify-center h-[500px]">
            <LoadingSpinner size="lg" />
            <span className="ml-3 text-muted-foreground">차트 로딩 중...</span>
          </div>
        ) : error ? (
          <div className="flex items-center justify-center h-[500px] text-red-500">
            <p>{error}</p>
          </div>
        ) : (
          <div className="h-[500px] w-full relative">
            <div ref={chartRef} style={{ height: '100%', width: '100%' }} />
          </div>
        )}
      </div>

    </div>
  )
}
