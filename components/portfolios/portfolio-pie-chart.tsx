"use client"

interface PortfolioItem {
  name: string
  percent: number
  trend: number
  color: string
  amount: number
}

interface PortfolioPieChartProps {
  data: PortfolioItem[]
  className?: string
}

export function PortfolioPieChart({ data, className = "" }: PortfolioPieChartProps) {
  if (!data || data.length === 0) {
    return (
      <div className={`flex items-center justify-center p-8 ${className}`}>
        <p className="text-gray-500">포트폴리오 데이터가 없습니다.</p>
      </div>
    )
  }

  // Calculate conic-gradient segments
  let currentDegree = 0
  const gradientSegments = data
    .map((item) => {
      const startDegree = currentDegree
      const endDegree = currentDegree + (item.percent / 100) * 360
      currentDegree = endDegree
      return `${item.color} ${startDegree}deg ${endDegree}deg`
    })
    .join(", ")

  return (
    <div className={`flex justify-center ${className}`}>
      {/* Pie Chart */}
      <div
        className="w-48 h-48 rounded-full relative flex items-center justify-center animate-in zoom-in duration-1000 delay-200"
        style={{
          background: `conic-gradient(${gradientSegments})`,
        }}
      >
        <div className="w-28 h-28 bg-white rounded-full absolute"></div>
      </div>
    </div>
  )
}
