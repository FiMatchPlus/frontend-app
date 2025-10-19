"use client"

import React, { useEffect, useRef, useState, useMemo } from 'react'
import * as echarts from 'echarts'
import { formatCurrency } from '@/utils/formatters'

interface BacktestChartProps {
  data: Array<{
    date: string
    stocks: Record<string, number>
  }>
  holdings: Array<{
    stockName: string
    quantity: number
  }>
  benchmarkData?: Array<{
    date: string
    value: number
    dailyReturn?: number
    return?: number // 기존 호환성을 위해 유지
  }>
  benchmarkName?: string
  className?: string
}

export default function BacktestChart({ data, holdings, benchmarkData, benchmarkName = 'KOSPI', className = "" }: BacktestChartProps) {
  const stocksChartRef = useRef<HTMLDivElement>(null)
  const benchmarkChartRef = useRef<HTMLDivElement>(null)
  const stocksChartInstance = useRef<echarts.ECharts | null>(null)
  const benchmarkChartInstance = useRef<echarts.ECharts | null>(null)
  const [selectedStock, setSelectedStock] = useState<string | null>(null)

  if (!data || data.length === 0) {
    return (
      <div className={`flex items-center justify-center h-96 ${className}`}>
        <p className="text-gray-500">차트 데이터가 없습니다.</p>
      </div>
    )
  }

  const colors = [
    '#6366f1',
    '#ec4899',
    '#06b6d4',
    '#10b981',
    '#f59e0b',
    '#ef4444',
  ]

  // dailyEquity.stocks에서 종목 이름들을 key로 추출
  const stockNamesFromData = data.length > 0 ? Object.keys(data[0]?.stocks || {}) : []
  const stockNamesFromHoldings = holdings.map(h => h.stockName)
  
  // 종목명 필터링: 포트폴리오 총액, 주식 평가액, 현금 잔고 제외
  const filteredStockNamesFromData = stockNamesFromData.filter(name => 
    name !== '포트폴리오 총액' && 
    name !== '주식 평가액' && 
    name !== '현금 잔고'
  )
  
  // 실제 보유 종목들만 사용 (중복 제거)
  const allStockNames = [...new Set([...filteredStockNamesFromData, ...stockNamesFromHoldings])]
  const stockNames = allStockNames.length > 0 ? allStockNames : stockNamesFromHoldings
  
  const dates = data.map(d => d.date)
  
  // 포트폴리오 총액 계산 - API에서 제공하는 '포트폴리오 총액' 키를 우선 사용
  const totalValues = data.map(d => {
    if (d.stocks && typeof d.stocks === 'object') {
      // API에서 제공하는 '포트폴리오 총액' 키가 있는지 확인
      if ('포트폴리오 총액' in d.stocks) {
        return d.stocks['포트폴리오 총액'] || 0
      }
      // 없으면 실제 종목들의 합계 계산 (특별한 키들 제외)
      return Object.entries(d.stocks)
        .filter(([key]) => !['포트폴리오 총액', '주식 평가액', '현금 잔고'].includes(key))
        .reduce((sum, [_, val]) => sum + (val || 0), 0)
    }
    return 0
  })
  
  // 개별 종목 시리즈 데이터 (정규화 - 시작점 100%)
  const stockSeriesData = useMemo(() => {
    return stockNames.map((stockName, index) => {
      const stockData = data.map(d => {
        // dailyEquity.stocks에서 종목명을 key로 접근
        if (d.stocks && typeof d.stocks === 'object' && stockName in d.stocks) {
          return d.stocks[stockName] || 0
        }
        return 0
      })
      
      // 정규화: 시작점을 100%로 설정
      const normalizedData = stockData.length > 0 && stockData[0] > 0 
        ? stockData.map(value => (value / stockData[0]) * 100)
        : stockData
    
    return {
      name: stockName,
        type: 'line',
        xAxisIndex: 0,
      yAxisIndex: 0,
        data: normalizedData,
        smooth: false,
        connectNulls: true,
        lineStyle: {
          color: colors[index % colors.length],
          width: 2
      },
      itemStyle: {
        color: colors[index % colors.length]
      },
        emphasis: {
          lineStyle: {
            color: colors[index % colors.length],
            width: 3
          },
          itemStyle: {
            color: colors[index % colors.length]
          }
        }
      }
    })
  }, [stockNames, data, colors])

  // 포트폴리오 총합 시리즈 (정규화 - 시작점 100%)
  const portfolioSeriesData = useMemo(() => {
    const normalizedPortfolioData = totalValues.length > 0 && totalValues[0] > 0
      ? totalValues.map(value => (value / totalValues[0]) * 100)
      : totalValues
    
    return {
    name: '포트폴리오',
      type: 'line' as const,
      xAxisIndex: 0,
      yAxisIndex: 0,
      data: normalizedPortfolioData,
    smooth: false,
    connectNulls: true,
    lineStyle: {
      color: '#000000',
      width: 3
    },
    itemStyle: {
      color: '#000000'
      }
    }
  }, [totalValues])
  
  // 벤치마크 vs 포트폴리오 차트용 데이터 (정규화)
  const benchmarkPortfolioData = useMemo(() => {
    if (!benchmarkData || benchmarkData.length === 0) return null
    
    const benchmarkValues = dates.map(date => {
      const benchmarkPoint = benchmarkData.find(b => b.date === date)
      return benchmarkPoint ? benchmarkPoint.value : null
    }).filter((val): val is number => val !== null)

    if (benchmarkValues.length === 0) return null
    
    // 벤치마크 정규화 (시작점 100%)
    const normalizedBenchmarkData = benchmarkValues.length > 0 && benchmarkValues[0] > 0
      ? benchmarkValues.map(value => (value / benchmarkValues[0]) * 100)
      : benchmarkValues
    
    // 포트폴리오 정규화 (시작점 100%)
    const normalizedPortfolioData = totalValues.length > 0 && totalValues[0] > 0
      ? totalValues.map(value => (value / totalValues[0]) * 100)
      : totalValues
    
    return {
      benchmark: normalizedBenchmarkData,
      portfolio: normalizedPortfolioData
    }
  }, [benchmarkData, dates, totalValues])

  // 개별종목 vs 포트폴리오 차트의 시리즈 데이터
  const stocksChartSeriesData = useMemo(() => {
    const visibleStockSeries = selectedStock 
      ? stockSeriesData.filter(series => series.name === selectedStock)
      : []

    return [
      ...visibleStockSeries,
      portfolioSeriesData
    ]
  }, [stockSeriesData, selectedStock, portfolioSeriesData])

  // 벤치마크 vs 포트폴리오 차트의 시리즈 데이터
  const benchmarkChartSeriesData = useMemo(() => {
    if (!benchmarkPortfolioData) return [
      {
        ...portfolioSeriesData,
        yAxisIndex: 0
      }
    ]
    
    return [
      {
        ...portfolioSeriesData,
        yAxisIndex: 0
      },
      {
        name: benchmarkName,
        type: 'line' as const,
        xAxisIndex: 0,
        yAxisIndex: 0,
        data: benchmarkPortfolioData.benchmark,
        smooth: false,
        connectNulls: true,
        lineStyle: {
          color: '#6b7280',
          width: 2,
          type: 'dashed' as const
        },
        itemStyle: {
          color: '#6b7280'
        }
      }
    ]
  }, [benchmarkPortfolioData, portfolioSeriesData, benchmarkName])

  // 공통 차트 옵션 (기본)
  const baseChartOption = {
    legend: {
      show: false
    },
    grid: {
      left: '3%',
      right: '3%',
      bottom: '15%',
      top: '10%',
      containLabel: true
    },
    xAxis: {
      type: 'category',
      data: dates.map(date => {
        const d = new Date(date)
        return `${(d.getMonth() + 1).toString().padStart(2, '0')}/${d.getDate().toString().padStart(2, '0')}`
      }),
      axisLine: {
        lineStyle: {
          color: '#e5e7eb'
        }
      },
      axisLabel: {
        color: '#9ca3af',
        fontSize: 11,
        rotate: 45
      }
    },
    dataZoom: [
      {
        type: 'slider',
        xAxisIndex: 0,
        show: true,
        height: 20,
        bottom: 5,
        startValue: 0,
        endValue: 20,
        showDetail: false,
        handleSize: 0,
        textStyle: {
          color: '#9ca3af'
        },
        borderColor: '#e5e7eb',
        fillerColor: 'rgba(99, 102, 241, 0.2)',
        handleStyle: {
          color: 'transparent',
          borderColor: 'transparent'
        }
      }
    ]
  }

  // 개별종목 vs 포트폴리오 차트 초기화 및 업데이트
  useEffect(() => {
    if (!stocksChartRef.current) return

    if (!stocksChartInstance.current) {
      stocksChartInstance.current = echarts.init(stocksChartRef.current)
    }

    const stocksOption = {
      ...baseChartOption,
      tooltip: {
        trigger: 'axis',
        axisPointer: {
          type: 'cross'
        },
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        borderColor: '#e5e7eb',
        borderWidth: 1,
        formatter: function(params: any) {
          const date = params[0].axisValue
          let result = `<div style="font-weight: bold; margin-bottom: 8px;">${date}</div>`
          
          params.forEach((param: any) => {
            let displayText = param.value ? param.value.toFixed(1) + '%' : '0%'
            
            result += `<div style="margin: 4px 0;">
              <span style="display: inline-block; width: 12px; height: 12px; background-color: ${param.color}; border-radius: 2px; margin-right: 8px;"></span>
              <span style="font-weight: 500;">${param.seriesName}:</span>
              <span style="margin-left: 8px; font-weight: bold;">${displayText}</span>
            </div>`
          })
          
          return result
        }
      },
      yAxis: {
        type: 'value',
        name: '수익률 (%)',
        nameLocation: 'middle',
        nameGap: 50,
        axisLine: {
          lineStyle: {
            color: '#e5e7eb'
          }
        },
        axisLabel: {
          color: '#9ca3af',
          fontSize: 11,
          formatter: function(value: number) {
            return value.toFixed(0) + '%'
          }
        },
        splitLine: {
          lineStyle: {
            color: '#f3f4f6',
            type: 'dashed'
          }
        }
      },
      series: stocksChartSeriesData
    }

    stocksChartInstance.current.setOption(stocksOption, false)

    const handleResize = () => {
      if (stocksChartInstance.current) {
        stocksChartInstance.current.resize()
      }
    }

    window.addEventListener('resize', handleResize)

    return () => {
      window.removeEventListener('resize', handleResize)
    }
  }, [stocksChartSeriesData])

  // 벤치마크 vs 포트폴리오 차트 초기화 및 업데이트
  useEffect(() => {
    if (!benchmarkChartRef.current) return

    if (!benchmarkChartInstance.current) {
      benchmarkChartInstance.current = echarts.init(benchmarkChartRef.current)
    }

    const benchmarkOption = {
      ...baseChartOption,
      tooltip: {
        trigger: 'axis',
        axisPointer: {
          type: 'cross'
        },
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        borderColor: '#e5e7eb',
        borderWidth: 1,
        formatter: function(params: any) {
          const date = params[0].axisValue
          let result = `<div style="font-weight: bold; margin-bottom: 8px;">${date}</div>`
          
          params.forEach((param: any) => {
            let displayText = param.value ? param.value.toFixed(1) + '%' : '0%'
            
            result += `<div style="margin: 4px 0;">
              <span style="display: inline-block; width: 12px; height: 12px; background-color: ${param.color}; border-radius: 2px; margin-right: 8px;"></span>
              <span style="font-weight: 500;">${param.seriesName}:</span>
              <span style="margin-left: 8px; font-weight: bold;">${displayText}</span>
            </div>`
          })
          
          return result
        }
      },
      yAxis: {
        type: 'value',
        name: '수익률 (%)',
        nameLocation: 'middle',
        nameGap: 50,
        axisLine: {
          lineStyle: {
            color: '#e5e7eb'
          }
        },
        axisLabel: {
          color: '#9ca3af',
          fontSize: 11,
          formatter: function(value: number) {
            return value.toFixed(0) + '%'
          }
        },
        splitLine: {
          lineStyle: {
            color: '#f3f4f6',
            type: 'dashed'
          }
        }
      },
      series: benchmarkChartSeriesData
    }

    benchmarkChartInstance.current.setOption(benchmarkOption, false)

    const handleResize = () => {
      if (benchmarkChartInstance.current) {
        benchmarkChartInstance.current.resize()
      }
    }

    window.addEventListener('resize', handleResize)

    return () => {
      window.removeEventListener('resize', handleResize)
    }
  }, [benchmarkChartSeriesData])

  // 컴포넌트 언마운트 시 정리
  useEffect(() => {
    return () => {
      if (stocksChartInstance.current) {
        stocksChartInstance.current.dispose()
        stocksChartInstance.current = null
      }
      if (benchmarkChartInstance.current) {
        benchmarkChartInstance.current.dispose()
        benchmarkChartInstance.current = null
      }
    }
  }, [])

  return (
    <div className={`relative ${className}`}>
      {/* 개별종목 선택 영역 */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-[#1f2937] mb-3">개별 종목 비교</h3>
        <div className="flex flex-wrap gap-3 mb-4 px-2">
        {stockNames.map((stockName, index) => (
            <div 
              key={stockName} 
              className="flex items-center gap-2 cursor-pointer transition-all duration-200 select-none"
              style={{ 
                opacity: selectedStock === stockName ? 1 : 0.5,
                backgroundColor: selectedStock === stockName ? '#f0f9ff' : 'transparent',
                padding: '6px 12px',
                borderRadius: '8px',
                border: selectedStock === stockName ? '1px solid #3b82f6' : '1px solid transparent'
              }}
              onClick={() => {
                setSelectedStock(selectedStock === stockName ? null : stockName)
              }}
            >
              <div 
                className="w-4 h-0.5"
              style={{ backgroundColor: colors[index % colors.length] }}
            />
            <span className="text-sm text-[#6b7280]">{stockName}</span>
          </div>
        ))}
        <div className="flex items-center gap-2">
          <div 
              className="w-4 h-0.5"
            style={{ backgroundColor: '#000000' }}
          />
          <span className="text-sm text-[#6b7280]">포트폴리오</span>
        </div>
        </div>
        
        {/* 개별종목 vs 포트폴리오 차트 */}
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="h-80">
            <div 
              ref={stocksChartRef} 
              style={{ 
                height: '100%', 
                width: '100%'
              }} 
            />
          </div>
        </div>
      </div>
      
      {/* 벤치마크 vs 포트폴리오 차트 */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-[#1f2937] mb-3">벤치마크 비교</h3>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center gap-4 mb-4">
            <div className="flex items-center gap-2">
              <div className="w-4 h-0.5 bg-black" />
              <span className="text-sm text-[#6b7280]">포트폴리오</span>
            </div>
            {benchmarkData && benchmarkData.length > 0 && (
              <div className="flex items-center gap-2">
                <div 
                  className="w-4 h-0.5"
                  style={{ 
                    background: 'repeating-linear-gradient(90deg, #6b7280 0px, #6b7280 3px, transparent 3px, transparent 6px)' 
                  }}
                />
                <span className="text-sm text-[#6b7280]">{benchmarkName}</span>
              </div>
            )}
          </div>
          <div className="h-80">
            <div 
              ref={benchmarkChartRef} 
          style={{ 
            height: '100%', 
            width: '100%'
          }} 
        />
          </div>
        </div>
      </div>
    </div>
  )
}