"use client"

import { useEffect, useRef } from "react"
import * as echarts from "echarts"

interface ScatterDataPoint {
  name: string
  type: string
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH'
  risk: number
  sharpe: number
  color: string
}

interface RiskEfficiencyChartProps {
  data: ScatterDataPoint[]
}

export function RiskEfficiencyChart({ data }: RiskEfficiencyChartProps) {
  const chartRef = useRef<HTMLDivElement>(null)
  const chartInstance = useRef<echarts.ECharts | null>(null)

  useEffect(() => {
    if (!data || data.length === 0 || !chartRef.current) return

    // 기존 차트 인스턴스 정리
    if (chartInstance.current) {
      chartInstance.current.dispose()
    }

    // 새 차트 인스턴스 생성
    chartInstance.current = echarts.init(chartRef.current)

    // ECharts 옵션 설정
    const option = {
      grid: {
        top: 60,
        right: 60,
        bottom: 80,
        left: 80
      },
      xAxis: {
        type: 'value',
        name: '위험도 (변동성 %)',
        nameLocation: 'middle',
        nameGap: 50,
        nameTextStyle: {
          fontSize: 18,
          fontWeight: 'bold'
        },
        axisLabel: {
          fontSize: 16
        },
        splitLine: {
          lineStyle: {
            width: 2
          }
        }
      },
      yAxis: {
        type: 'value',
        name: '효율성 (샤프비율)',
        nameLocation: 'middle',
        nameGap: 60,
        nameTextStyle: {
          fontSize: 18,
          fontWeight: 'bold'
        },
        axisLabel: {
          fontSize: 16
        },
        splitLine: {
          lineStyle: {
            width: 2
          }
        }
      },
      tooltip: {
        trigger: 'item',
        formatter: (params: any) => {
          const point = data[params.dataIndex]
          return `${point.name}<br/>변동성: ${point.risk.toFixed(2)}%<br/>샤프비율: ${point.sharpe.toFixed(2)}`
        },
        textStyle: {
          fontSize: 16,
          fontWeight: 'bold'
        },
        padding: 12
      },
      series: [
        {
          type: 'scatter',
          symbolSize: 30,
          data: data.map(item => ({
            value: [item.risk, item.sharpe],
            itemStyle: {
              color: item.color
            }
          })),
          emphasis: {
            scale: 1.2,
            itemStyle: {
              borderWidth: 3,
              borderColor: '#fff',
              shadowBlur: 10,
              shadowColor: 'rgba(0, 0, 0, 0.3)'
            }
          }
        }
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
  }, [data])

  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center p-8">
        <p className="text-gray-500">차트 데이터가 없습니다.</p>
      </div>
    )
  }

  return (
    <div className="w-full" style={{ height: '500px' }}>
      <div ref={chartRef} style={{ height: '100%', width: '100%' }} />
    </div>
  )
}

