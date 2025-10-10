"use client"

import { useEffect, useRef } from "react"
import * as echarts from 'echarts'

interface AnalysisPieChartProps {
  data: Array<{
    name: string
    value: number
    color: string
  }>
  width?: string | number
  height?: string | number
}

export function AnalysisPieChart({ data, width = 200, height = 200 }: AnalysisPieChartProps) {
  const chartRef = useRef<HTMLDivElement>(null)
  const chartInstanceRef = useRef<echarts.ECharts | null>(null)

  useEffect(() => {
    if (!chartRef.current) return

    // 차트 인스턴스 생성
    if (!chartInstanceRef.current) {
      chartInstanceRef.current = echarts.init(chartRef.current)
    }

    const option = {
      tooltip: {
        trigger: 'item',
        formatter: '{a} <br/>{b}: {c}% ({d}%)'
      },
      series: [
        {
          name: '비중',
          type: 'pie',
          radius: ['40%', '70%'],
          center: ['50%', '50%'],
          avoidLabelOverlap: false,
          itemStyle: {
            borderRadius: 0,
            borderColor: '#fff',
            borderWidth: 2
          },
          label: {
            show: false
          },
          emphasis: {
            label: {
              show: false
            }
          },
          labelLine: {
            show: false
          },
          data: data.map(item => ({
            name: item.name,
            value: item.value * 100, // 백분율로 변환
            itemStyle: {
              color: item.color
            }
          }))
        }
      ]
    }

    chartInstanceRef.current.setOption(option)

    // 리사이즈 핸들러
    const handleResize = () => {
      chartInstanceRef.current?.resize()
    }

    window.addEventListener('resize', handleResize)

    return () => {
      window.removeEventListener('resize', handleResize)
    }
  }, [data])

  // 컴포넌트 언마운트 시 차트 인스턴스 정리
  useEffect(() => {
    return () => {
      if (chartInstanceRef.current) {
        chartInstanceRef.current.dispose()
        chartInstanceRef.current = null
      }
    }
  }, [])

  return (
    <div 
      ref={chartRef} 
      style={{ width, height }}
      className="flex items-center justify-center"
    />
  )
}
