"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import * as d3 from "d3"
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

  const chartContainerRef = useRef<HTMLDivElement>(null)
  const svgRef = useRef<SVGSVGElement>(null)

  // Chart dimensions and margins
  const margin = { top: 20, right: 20, bottom: 60, left: 40 }
  const width = 1000 // 차트 너비를 적당하게 조정
  const height = 400

  // Convert timestamp to Date object
  const convertTimestamp = (timestamp: number): Date => {
    return new Date(timestamp)
  }

  // Create scales
  const createScales = useCallback((data: any[]) => {
    if (!data.length) return null

    const xDomain = (() => {
      const extent = d3.extent(data, d => d.date) as [Date, Date]
      if (extent[0] && extent[1]) {
        const timeRange = extent[1].getTime() - extent[0].getTime()
        const padding = timeRange * 0.1 // 10% 여백
        return [
          new Date(extent[0].getTime() - padding),
          new Date(extent[1].getTime() + padding)
        ]
      }
      return extent
    })()

    const xScale = d3.scaleTime()
      .domain(xDomain)
      .range([margin.left, width - margin.right])
      .nice() // 눈금을 깔끔하게 정리

    const yDomain = (() => {
      const minPrice = d3.min(data, d => d.low) as number
      const maxPrice = d3.max(data, d => d.high) as number
      const priceRange = maxPrice - minPrice
      const padding = priceRange * 0.1 // 10% 여백
      return [
        minPrice - padding,
        maxPrice + padding
      ]
    })()

    const yScale = d3.scaleLinear()
      .domain(yDomain)
      .range([height - margin.bottom, margin.top])
      .nice() // 눈금을 깔끔하게 정리

    const volumeScale = d3.scaleLinear()
      .domain([0, d3.max(data, d => d.volume) as number])
      .range([height - margin.bottom, height - margin.bottom - 80])

    return { xScale, yScale, volumeScale }
  }, [margin, width, height])

  // Create line chart
  const createLineChart = useCallback((data: any[], scales: any) => {
    if (!scales || !svgRef.current) return

    const svg = d3.select(svgRef.current)
    
    // Clear previous chart
    svg.selectAll("*").remove()

    // Add grid lines
    const gridLines = svg.append("g")
      .attr("class", "grid")
      .attr("stroke", "hsl(var(--muted-foreground) / 0.2)") // 연한 회색 격자
      .attr("stroke-width", 0.5)
      .attr("stroke-opacity", 0.5)

    // Horizontal grid lines
    gridLines.selectAll("line.horizontal")
      .data(scales.yScale.ticks(8))
      .enter()
      .append("line")
      .attr("class", "horizontal")
      .attr("x1", margin.left)
      .attr("x2", width - margin.right)
      .attr("y1", d => scales.yScale(d))
      .attr("y2", d => scales.yScale(d))

    // Vertical grid lines
    gridLines.selectAll("line.vertical")
      .data(scales.xScale.ticks(8))
      .enter()
      .append("line")
      .attr("class", "vertical")
      .attr("x1", d => scales.xScale(d))
      .attr("x2", d => scales.xScale(d))
      .attr("y1", margin.top)
      .attr("y2", height - margin.bottom)

    // Create line generator
    const line = d3.line<any>()
      .x(d => scales.xScale(d.date))
      .y(d => scales.yScale(d.close))

    // Add line path
    svg.append("path")
      .datum(data)
      .attr("fill", "none")
      .attr("stroke", "hsl(var(--primary))")
      .attr("stroke-width", 2)
      .attr("d", line)

    // Add data points
    svg.selectAll("circle")
      .data(data)
      .enter()
      .append("circle")
      .attr("cx", d => scales.xScale(d.date))
      .attr("cy", d => scales.yScale(d.close))
      .attr("r", 3)
      .attr("fill", "hsl(var(--primary))")
      .attr("opacity", 0.7)
      .on("mouseover", function(event, d) {
        // 툴팁 표시
        const tooltip = d3.select("#chart-tooltip")
        const dateStr = d3.timeFormat("%Y-%m-%d %H:%M")(d.date)
        
        // 차트뷰의 절대 위치를 고려한 정확한 마우스 위치 계산
        const chartContainer = event.currentTarget.closest('.chart-container') || event.currentTarget.closest('svg')?.parentElement
        const chartRect = chartContainer?.getBoundingClientRect()
        
        if (chartRect) {
          // 차트뷰 내부에서의 상대적 마우스 위치
          const relativeX = event.clientX - chartRect.left
          const relativeY = event.clientY - chartRect.top
          
          // 전체 페이지 기준 절대 위치 계산
          const absoluteX = chartRect.left + relativeX + window.pageXOffset
          const absoluteY = chartRect.top + relativeY + window.pageYOffset
          
          tooltip
            .style("opacity", 1)
            .html(`
              <div class="font-semibold">${dateStr}</div>
              <div class="text-sm space-y-1">
                <div>종가: ${formatCurrency(d.close)}</div>
                <div>거래량: ${d.volume.toLocaleString()}</div>
              </div>
            `)
            .style("left", (absoluteX + 15) + "px")
            .style("top", (absoluteY - 10) + "px")
        }
      })
      .on("mouseout", function() {
        // 툴팁 숨김
        d3.select("#chart-tooltip").style("opacity", 0)
      })

    // Add axes
    const xAxis = d3.axisBottom(scales.xScale)
      .tickFormat((d: any) => d3.timeFormat("%m/%d")(d as Date))
      .ticks(8)

    const yAxis = d3.axisRight(scales.yScale)
      .tickFormat((d: any) => formatCurrency(d as number))
      .ticks(8)

    svg.append("g")
      .attr("transform", `translate(0,${height - margin.bottom})`)
      .call(xAxis as any)
      .attr("color", "hsl(var(--muted-foreground))")

    svg.append("g")
      .attr("transform", `translate(${width - margin.right},0)`)
      .call(yAxis as any)
      .attr("color", "hsl(var(--muted-foreground))")

    // Add volume if enabled
    if (chartConfig.showVolume) {
      svg.selectAll("rect.volume")
        .data(data)
        .enter()
        .append("rect")
        .attr("class", "volume")
        .attr("x", d => scales.xScale(d.date) - 6) // 거래량 바 너비를 캔들에 맞춰 조정
        .attr("y", d => scales.volumeScale(d.volume))
        .attr("width", 12) // 거래량 바 너비를 8에서 12로 증가
        .attr("height", d => height - margin.bottom - scales.volumeScale(d.volume))
        .attr("fill", d => d.close >= d.open ? "hsl(var(--primary) / 0.3)" : "hsl(var(--destructive) / 0.3)")
    }
  }, [chartConfig.showVolume, margin, width, height])

  // Create candlestick chart
  const createCandlestickChart = useCallback((data: any[], scales: any) => {
    if (!scales || !svgRef.current) return

    const svg = d3.select(svgRef.current)
    
    // Clear previous chart
    svg.selectAll("*").remove()

    // Add grid lines
    const gridLines = svg.append("g")
      .attr("class", "grid")
      .attr("stroke", "hsl(var(--muted-foreground) / 0.2)") // 연한 회색 격자
      .attr("stroke-width", 0.5)
      .attr("stroke-opacity", 0.5)

    // Horizontal grid lines
    gridLines.selectAll("line.horizontal")
      .data(scales.yScale.ticks(8))
      .enter()
      .append("line")
      .attr("class", "horizontal")
      .attr("x1", margin.left)
      .attr("x2", width - margin.right)
      .attr("y1", d => scales.yScale(d))
      .attr("y2", d => scales.yScale(d))

    // Vertical grid lines
    gridLines.selectAll("line.vertical")
      .data(scales.xScale.ticks(8))
      .enter()
      .append("line")
      .attr("class", "vertical")
      .attr("x1", d => scales.xScale(d))
      .attr("x2", d => scales.xScale(d))
      .attr("y1", margin.top)
      .attr("y2", height - margin.bottom)

    // Create candlesticks
    const candlesticks = svg.append("g")
      .attr("class", "candlesticks")

    // Determine dynamic candle width based on time pixel spacing
    const xPositions: number[] = data.map((d) => scales.xScale(d.date))
    const deltas: number[] = xPositions.slice(1).map((p: number, i: number) => p - xPositions[i])
    const minDelta = d3.min(deltas) ?? 12
    const candleWidth = Math.max(2, Math.min(16, minDelta - 4)) // keep small gaps between candles

    // Add wicks
    candlesticks.selectAll("line.wick")
      .data(data)
      .enter()
      .append("line")
      .attr("class", "wick")
      .attr("x1", d => scales.xScale(d.date))
      .attr("x2", d => scales.xScale(d.date))
      .attr("y1", d => scales.yScale(d.high))
      .attr("y2", d => scales.yScale(d.low))
      .attr("stroke", d => d.close >= d.open ? "#26a69a" : "#ef5350")
      .attr("stroke-width", 1)

    // Add candle bodies
    candlesticks.selectAll("rect.candle")
      .data(data)
      .enter()
      .append("rect")
      .attr("class", "candle")
      .attr("x", d => scales.xScale(d.date) - candleWidth / 2)
      .attr("y", d => scales.yScale(Math.max(d.open, d.close)))
      .attr("width", candleWidth)
      .attr("height", d => Math.abs(scales.yScale(d.close) - scales.yScale(d.open)))
      .attr("fill", d => d.close >= d.open ? "#26a69a" : "#ef5350")
      .attr("stroke", d => d.close >= d.open ? "#26a69a" : "#ef5350")
      .on("mouseover", function(event, d) {
        // 툴팁 표시
        const tooltip = d3.select("#chart-tooltip")
        const dateStr = d3.timeFormat("%Y-%m-%d %H:%M")(d.date)
        
        // 차트뷰의 절대 위치를 고려한 정확한 마우스 위치 계산
        const chartContainer = event.currentTarget.closest('.chart-container') || event.currentTarget.closest('svg')?.parentElement
        const chartRect = chartContainer?.getBoundingClientRect()
        
        if (chartRect) {
          // 차트뷰 내부에서의 상대적 마우스 위치
          const relativeX = event.clientX - chartRect.left
          const relativeY = event.clientY - chartRect.top
          
          // 전체 페이지 기준 절대 위치 계산
          const absoluteX = chartRect.left + relativeX + window.pageXOffset
          const absoluteY = chartRect.top + relativeY + window.pageYOffset
          
          tooltip
            .style("opacity", 1)
            .html(`
              <div class="font-semibold">${dateStr}</div>
              <div class="text-sm space-y-1">
                <div>시가: ${formatCurrency(d.open)}</div>
                <div>고가: ${formatCurrency(d.high)}</div>
                <div>저가: ${formatCurrency(d.low)}</div>
                <div>종가: ${formatCurrency(d.close)}</div>
                <div>거래량: ${d.volume.toLocaleString()}</div>
              </div>
            `)
            .style("left", (absoluteX + 15) + "px")
            .style("top", (absoluteY - 10) + "px")
        }
      })
      .on("mouseout", function() {
        // 툴팁 숨김
        d3.select("#chart-tooltip").style("opacity", 0)
      })

    // Add axes
    const xAxis = d3.axisBottom(scales.xScale)
      .tickFormat((d: any) => d3.timeFormat("%m/%d")(d as Date))
      .ticks(8)

    const yAxis = d3.axisRight(scales.yScale)
      .tickFormat((d: any) => formatCurrency(d as number))
      .ticks(8)

    svg.append("g")
      .attr("transform", `translate(0,${height - margin.bottom})`)
      .call(xAxis as any)
      .attr("color", "hsl(var(--muted-foreground))")

    svg.append("g")
      .attr("transform", `translate(${width - margin.right},0)`)
      .call(yAxis as any)
      .attr("color", "hsl(var(--muted-foreground))")

    // Add volume if enabled
    if (chartConfig.showVolume) {
      svg.selectAll("rect.volume")
        .data(data)
        .enter()
        .append("rect")
        .attr("class", "volume")
        .attr("x", d => scales.xScale(d.date) - Math.max(2, Math.floor(candleWidth * 0.4)))
        .attr("y", d => scales.volumeScale(d.volume))
        .attr("width", Math.max(4, Math.floor(candleWidth * 0.8)))
        .attr("height", d => height - margin.bottom - scales.volumeScale(d.volume))
        .attr("fill", d => d.close >= d.open ? "hsl(var(--primary) / 0.3)" : "hsl(var(--destructive) / 0.3)")
    }
  }, [chartConfig.showVolume, margin, width, height])

  // Update chart when data or config changes
  useEffect(() => {
    if (!chartData.length || !svgRef.current) return

    const convertedData = chartData.map(item => ({
      date: convertTimestamp(item.timestamp),
      open: item.open,
      high: item.high,
      low: item.low,
      close: item.close,
      volume: item.volume
    }))

    const scales = createScales(convertedData)
    if (!scales) return

    if (chartConfig.chartType === 'candlestick') {
      createCandlestickChart(convertedData, scales)
    } else {
      createLineChart(convertedData, scales)
    }
  }, [chartData, chartConfig.chartType, chartConfig.showVolume, createScales, createLineChart, createCandlestickChart])

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
            <svg
              ref={svgRef}
              width="100%"
              height={height}
              className="h-full w-full"
              viewBox={`0 0 ${width} ${height}`}
              preserveAspectRatio="xMidYMid meet"
            />
            {/* Tooltip */}
            <div
              id="chart-tooltip"
              className="fixed pointer-events-none bg-background/95 backdrop-blur-sm border border-border rounded-lg p-3 shadow-lg opacity-0 transition-opacity duration-200 z-50"
            />
          </div>
        )}
      </div>

      {/* Attribution */}
      <div className="p-2 text-xs text-center text-muted-foreground border-t border-border">
        Powered by <a href="https://d3js.org" target="_blank" rel="noopener noreferrer" className="underline hover:text-foreground">D3.js</a>
      </div>
    </div>
  )
}
