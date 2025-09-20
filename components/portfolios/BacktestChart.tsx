"use client"

import React, { useEffect, useRef } from 'react'
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
  className?: string
}

export default function BacktestChart({ data, holdings, className = "" }: BacktestChartProps) {
  const chartRef = useRef<HTMLDivElement>(null)
  const chartInstance = useRef<echarts.ECharts | null>(null)

  // 데이터가 없으면 빈 차트 반환
  if (!data || data.length === 0) {
    return (
      <div className={`flex items-center justify-center h-96 ${className}`}>
        <p className="text-gray-500">차트 데이터가 없습니다.</p>
      </div>
    )
  }

  // 예쁜 색상 팔레트 (먼저 정의)
  const colors = [
    '#6366f1', // 인디고
    '#ec4899', // 핑크
    '#06b6d4', // 시안
    '#10b981', // 에메랄드
    '#f59e0b', // 앰버
    '#ef4444', // 로즈
  ]

  // 주식명 추출 - 두 가지 방법 시도
  const stockNamesFromData = Object.keys(data[0]?.stocks || {})
  const stockNamesFromHoldings = holdings.map(h => h.stockName)
  
  // 더 많은 종목이 있는 것을 선택
  const stockNames = stockNamesFromData.length > stockNamesFromHoldings.length 
    ? stockNamesFromData 
    : stockNamesFromHoldings
  
  // ECharts용 데이터 변환 - 좌측: 비중 바차트, 우측: 총합 선차트
  const dates = data.map(d => d.date)
  
  // 총합 계산
  const totalValues = data.map(d => Object.values(d.stocks).reduce((sum, val) => sum + (val || 0), 0))
  const maxTotal = Math.max(...totalValues)
  
  // 비중 데이터 (0~1 범위)
  const ratioSeriesData = stockNames.map((stockName, index) => {
    const stockData = data.map(d => {
      const total = Object.values(d.stocks).reduce((sum, val) => sum + (val || 0), 0)
      const value = d.stocks[stockName] || 0
      return total > 0 ? value / total : 0
    })
    
    return {
      name: stockName,
      type: 'bar',
      stack: 'ratio', 
      yAxisIndex: 0, // 왼쪽 Y축 (비중)
      data: stockData,
      barWidth: 40,
      emphasis: {
        focus: 'none'
      },
      itemStyle: {
        color: colors[index % colors.length]
      },
      animationDelay: function (idx: number) {
        return idx * 10 // 각 막대마다 약간씩 지연
      },
      animationDuration: 150, // 빠른 애니메이션
      animationEasing: 'linear' // 선형 애니메이션으로 자연스럽게
    }
  })
  
  // 총합 선차트 데이터
  const totalSeriesData = {
    name: '총 자산',
    type: 'line',
    yAxisIndex: 1, // 오른쪽 Y축 (절대값)
    data: totalValues,
    smooth: false, // 부드러운 곡선 비활성화
    connectNulls: false, // null 값 건너뛰기
    lineStyle: {
      color: '#000000',
      width: 3
    },
    itemStyle: {
      color: '#000000'
    },
    areaStyle: {
      color: {
        type: 'linear',
        x: 0,
        y: 0,
        x2: 0,
        y2: 1,
        colorStops: [
          { offset: 0, color: 'rgba(99, 102, 241, 0.3)' },
          { offset: 1, color: 'rgba(99, 102, 241, 0.05)' }
        ]
      }
    }
  }

  // 완전한 옵션
  const option = {
    tooltip: {
      trigger: 'axis',
      axisPointer: {
        type: 'shadow'
      },
      backgroundColor: 'rgba(255, 255, 255, 0.95)',
      borderColor: '#e5e7eb',
      borderWidth: 1,
      formatter: function(params: any) {
        const date = params[0].axisValue
        let result = `<div style="font-weight: bold; margin-bottom: 8px;">${date}</div>`
        
        // 해당 날짜의 실제 총합 찾기 - 원본 데이터에서 직접 계산
        const originalDate = date.replace(/(\d{2})\/(\d{2})/, (match, month, day) => {
          const year = new Date().getFullYear()
          return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`
        })
        
        const dailyData = data.find(d => d.date === originalDate)
        const dailyTotal = dailyData ? Object.values(dailyData.stocks).reduce((sum, val) => sum + (val || 0), 0) : 0
        
        
        let total = 0
        
        params.forEach((param: any) => {
          let displayValue = param.value
          let displayText = formatCurrency(displayValue)
          
          // 바 차트인 경우 절대값으로 변환해서 표시
          if (param.seriesType === 'bar') {
            const absoluteValue = param.value * dailyTotal
            displayValue = absoluteValue
            displayText = formatCurrency(absoluteValue)
            total += absoluteValue
          } else if (param.seriesType === 'line') {
            // 선 차트는 이미 절대값
            total = param.value
          }
          
          const percentage = dailyTotal > 0 ? ((displayValue / dailyTotal) * 100).toFixed(1) : '0'
          result += `<div style="margin: 4px 0;">
            <span style="display: inline-block; width: 12px; height: 12px; background-color: ${param.color}; border-radius: 2px; margin-right: 8px;"></span>
            <span style="font-weight: 500;">${param.seriesName}:</span>
            <span style="margin-left: 8px; font-weight: bold;">${displayText}</span>
            <span style="margin-left: 4px; color: #6b7280; font-size: 12px;">(${percentage}%)</span>
          </div>`
        })
        
        return result
      }
    },
    grid: {
      left: '0',
      right: '0',
      bottom: '12%', // 미니맵과의 간격 줄이기
      top: '5%',
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
        fontSize: 11
      }
    },
    yAxis: [
      {
        type: 'value',
        name: '비중',
        position: 'left',
        min: 0,
        max: 1,
        axisLine: {
          lineStyle: {
            color: '#e5e7eb'
          }
        },
        axisLabel: {
          color: '#9ca3af',
          fontSize: 11,
          formatter: function(value: number) {
            return `${(value * 100).toFixed(0)}%`
          }
        },
        splitLine: {
          lineStyle: {
            color: '#f3f4f6',
            type: 'dashed'
          }
        }
      },
      {
        type: 'value',
        name: '총 자산',
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
          show: false
        }
      }
    ],
    series: [...ratioSeriesData, totalSeriesData],
    dataZoom: [
      {
        type: 'slider',
        xAxisIndex: 0,
        show: true,
        height: 20,
        bottom: 5, // x축 아래로 더 내리기
        startValue: 0,
        endValue: 20, // 처음 20개 데이터만 표시
        zoomLock: true, // 줌 기능 비활성화, 스크롤만 가능
        showDetail: false, // 범위 조절 버튼 숨기기
        handleSize: 0, // 핸들 크기 0으로 설정
        textStyle: {
          color: '#9ca3af'
        },
        borderColor: '#e5e7eb',
        fillerColor: 'rgba(99, 102, 241, 0.2)',
        handleStyle: {
          color: 'transparent', // 핸들 색상을 투명하게
          borderColor: 'transparent'
        }
      },
      {
        type: 'inside',
        xAxisIndex: 0,
        zoomOnMouseWheel: false, // 마우스 휠 줌 비활성화
        moveOnMouseMove: true, // 마우스 드래그로 스크롤
        moveOnMouseWheel: true, // 마우스 휠로 스크롤
        throttle: 100, // 스크롤 반응 속도 조절
        preventDefaultMouseMove: true,
        filterMode: 'filter' // 데이터 필터링 모드로 부드러운 전환
      }
    ],
    animation: true,
    animationDuration: 300, // 스크롤 시 빠른 애니메이션
    animationEasing: 'cubicInOut' as const,
    animationDelay: 0, // 지연 없이 즉시 애니메이션
    animationDurationUpdate: 200, // 업데이트 시 애니메이션 시간
    animationEasingUpdate: 'cubicInOut' as const
  }
  

  // 차트 초기화 및 업데이트
  useEffect(() => {
    if (!chartRef.current) {
      return
    }

    // 기존 차트 인스턴스 정리
    if (chartInstance.current) {
      chartInstance.current.dispose()
    }

    // 새 차트 인스턴스 생성
    chartInstance.current = echarts.init(chartRef.current)

    // 차트 옵션 설정
    chartInstance.current.setOption(option)

    // 스크롤 중 애니메이션 제어
    chartInstance.current.on('dataZoom', function (params: any) {
      // 스크롤 중에는 애니메이션 비활성화
      chartInstance.current?.setOption({
        animation: false
      }, false)
      
      // 스크롤 완료 후 애니메이션 재활성화 (짧은 지연 후)
      setTimeout(() => {
        chartInstance.current?.setOption({
          animation: true,
          animationDuration: 100
        }, false)
      }, 200)
    })


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
  }, [data, ratioSeriesData, totalSeriesData, option])

  return (
    <div className={`relative ${className}`}>
      {/* Legend를 차트 외부에 고정 */}
      <div className="flex flex-wrap gap-4 mb-4 px-2">
        {stockNames.map((stockName, index) => (
          <div key={stockName} className="flex items-center gap-2">
            <div 
              className="w-3 h-3 rounded-sm"
              style={{ backgroundColor: colors[index % colors.length] }}
            />
            <span className="text-sm text-[#6b7280]">{stockName}</span>
          </div>
        ))}
      </div>
      
      {/* 차트 영역 - dataZoom으로 스크롤 처리 */}
      <div className="h-96">
        <div 
          ref={chartRef} 
          style={{ 
            height: '100%', 
            width: '100%'
          }} 
        />
      </div>
    </div>
  )
}