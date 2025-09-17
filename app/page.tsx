"use client"

import Header from "@/components/header"
import { formatCurrency, formatPercent } from "@/lib/utils"
import { fetchPortfolioMain } from "@/lib/api"
import { PortfolioMainData } from "@/types/portfolio"
import { motion } from "framer-motion"
import Link from "next/link"
import { useEffect, useState } from "react"

const stockData = [
  { rank: 1, name: "삼성전자", price: 74500, change: 1200, changePercent: 1.6 },
  { rank: 2, name: "SK하이닉스", price: 128000, change: -2000, changePercent: -1.5 },
  { rank: 3, name: "LG전자", price: 89300, change: 700, changePercent: 0.8 },
  { rank: 4, name: "현대차", price: 195500, change: 1500, changePercent: 0.8 },
  { rank: 5, name: "NAVER", price: 195000, change: -1000, changePercent: -0.5 },
]


const marketData = [
  { name: "코스피", value: 2456.78, change: 12.45, changePercent: 0.51 },
  { name: "코스닥", value: 876.32, change: -5.23, changePercent: -0.59 },
  { name: "달러/원", value: 1342.5, change: 2.3, changePercent: 0.17 },
]

const insights = [
  {
    title: "반도체 섹터 상승세 지속",
    description: "메모리 반도체 가격 상승으로 관련 종목들이 강세를 보이고 있습니다.",
  },
  {
    title: "전기차 관련주 주목",
    description: "정부 전기차 보조금 정책 발표로 관련 업종에 관심이 집중되고 있습니다.",
  },
]

const features = [
  { text: "PCA 기반 포트폴리오 시각화 분석" },
  { text: "개인 맞춤형 투자 전략 추천" },
  { text: "실시간 리밸런싱 알림 서비스" },
]

export default function MainPage() {
  const [portfolioData, setPortfolioData] = useState<PortfolioMainData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const loadPortfolioData = async () => {
      try {
        setLoading(true)
        setError(null)
        const data = await fetchPortfolioMain()
        setPortfolioData(data)
      } catch (err) {
        console.error("Failed to load portfolio data:", err)
        setError(err instanceof Error ? err.message : "포트폴리오 데이터를 불러오는데 실패했습니다.")
        setPortfolioData(null) // 404나 에러 시 portfolioData를 null로 설정
      } finally {
        setLoading(false)
      }
    }

    loadPortfolioData()
  }, [])
  return (
    <div className="min-h-screen bg-[#f0f9f7]">
      <Header />

      <main className="max-w-6xl mx-auto p-8 grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Ranking Section */}
        <motion.section
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="bg-white/95 backdrop-blur-sm rounded-2xl p-8 shadow-xl border border-[#008485]"
        >
          <div className="mb-6">
            <h2 className="text-3xl font-bold text-[#1f2937] mb-2">인기 종목 순위</h2>
            <p className="text-[#6b7280] text-lg">실시간 주가 정보와 인기 종목을 확인하세요</p>
          </div>

          <ul className="space-y-0">
            {stockData.map((stock, index) => (
              <motion.li
                key={stock.rank}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.4, delay: 0.3 + index * 0.1 }}
                whileHover={{ x: 4, backgroundColor: "#f9fafb" }}
                className="flex justify-between items-center py-2 border-b border-[#f3f4f6] last:border-b-0 rounded-lg px-2 transition-all"
              >
                <div className="flex items-center gap-2">
                  <span className="bg-[#f3f4f6] text-[#6b7280] w-6 h-6 rounded-full flex items-center justify-center text-sm font-bold">
                    {stock.rank}
                  </span>
                  <span className="font-medium text-[#1f2937] text-lg">{stock.name}</span>
                </div>
                <div className="text-right">
                  <div className="font-bold text-[#1f2937] text-lg">{formatCurrency(stock.price)}</div>
                  <div className={`text-base mt-0.5 ${stock.change > 0 ? "text-[#dc2626]" : "text-[#008485]"}`}>
                    {stock.change > 0 ? "+" : ""}
                    {formatCurrency(stock.change)} ({formatPercent(stock.changePercent)})
                  </div>
                </div>
              </motion.li>
            ))}
          </ul>
        </motion.section>

        {/* Portfolio Section */}
        <motion.section
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="bg-white/95 backdrop-blur-sm rounded-2xl p-8 shadow-xl border border-[#008485] flex flex-col gap-6"
        >
          <div className="flex justify-between items-center">
            <h2 className="text-3xl font-bold text-[#1f2937]">내 포트폴리오</h2>
            {loading ? (
              <div className="text-right">
                <div className="text-2xl font-bold text-[#1f2937]">로딩 중...</div>
              </div>
            ) : portfolioData ? (
              <div className="text-right">
                <div className="text-2xl font-bold text-[#1f2937]">{formatCurrency(portfolioData.totalValue)}</div>
                <div className={`text-lg mt-1 ${portfolioData.dailySum >= 0 ? "text-[#dc2626]" : "text-[#008485]"}`}>
                  {portfolioData.dailySum >= 0 ? "+" : ""}
                  {formatCurrency(portfolioData.dailySum)} ({formatPercent((portfolioData.dailySum / portfolioData.totalValue) * 100)})
                </div>
              </div>
            ) : null}
          </div>

          {loading ? (
            <div className="flex justify-center items-center py-12 flex-1">
              <div className="text-lg text-[#6b7280]">포트폴리오 데이터를 불러오는 중...</div>
            </div>
          ) : portfolioData ? (
            <div className="flex flex-col lg:flex-row gap-6 items-center flex-1">
              <motion.div
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ duration: 0.8, delay: 0.6 }}
                className="w-48 h-48 rounded-full relative flex items-center justify-center"
                style={{
                  background: `conic-gradient(${portfolioData.holdings
                    .map((holding, index) => {
                      const colors = ["#ef4444", "#3b82f6", "#10b981", "#f59e0b", "#8b5cf6", "#ec4899", "#06b6d4", "#84cc16"]
                      const startAngle = index === 0 ? 0 : portfolioData.holdings.slice(0, index).reduce((sum, h) => sum + h.weight * 3.6, 0)
                      const endAngle = startAngle + holding.weight * 3.6
                      return `${colors[index % colors.length]} ${startAngle}deg ${endAngle}deg`
                    })
                    .join(", ")})`,
                }}
              >
                <div className="w-28 h-28 bg-white rounded-full absolute"></div>
              </motion.div>

              {/* Chart Legend */}
              <div className="flex-1 w-full">
                {portfolioData.holdings.map((holding, index) => {
                  const colors = ["#ef4444", "#3b82f6", "#10b981", "#f59e0b", "#8b5cf6", "#ec4899", "#06b6d4", "#84cc16"]
                  return (
                    <motion.div
                      key={holding.name}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.4, delay: 0.8 + index * 0.1 }}
                      className="flex justify-between items-center py-1"
                    >
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: colors[index % colors.length] }}></div>
                        <span className="text-lg text-[#374151] font-medium">{holding.name}</span>
                      </div>
                      <div className="flex flex-col items-end gap-0.5">
                        <span className="text-lg font-semibold text-[#1f2937]">{holding.weight.toFixed(1)}%</span>
                        <span className={`text-base font-medium ${holding.dailyRate >= 0 ? "text-[#dc2626]" : "text-[#008485]"}`}>
                          {holding.dailyRate >= 0 ? "+" : ""} {formatPercent(holding.dailyRate)}
                        </span>
                      </div>
                    </motion.div>
                  )
                })}
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 flex-1">
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.6, delay: 0.6 }}
                className="text-center"
              >
                <div className="w-24 h-24 bg-[#f3f4f6] rounded-full flex items-center justify-center mb-4 mx-auto">
                  <svg className="w-12 h-12 text-[#6b7280]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                  </svg>
                </div>
                <h3 className="text-2xl font-bold text-[#1f2937] mb-2">포트폴리오가 없습니다</h3>
                <p className="text-lg text-[#6b7280]">지금 시작해보세요</p>
              </motion.div>
            </div>
          )}

          <Link href={portfolioData ? "/portfolios" : "/portfolios/create"}>
            <motion.button
              whileHover={{ y: -2, scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="w-full bg-[#008485] text-white py-4 rounded-xl font-semibold text-xl hover:bg-[#006b6c] transition-all"
            >
              {portfolioData ? "포트폴리오 더보기" : "포트폴리오 만들기"}
            </motion.button>
          </Link>
        </motion.section>

        {/* Bottom Section */}
        <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Market Status Card */}
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.6 }}
            className="bg-white/95 backdrop-blur-sm rounded-2xl p-6 shadow-xl border border-[#008485]"
          >
            <div className="text-2xl font-bold text-[#1f2937] mb-4">시장 현황</div>
            <div className="flex justify-between gap-4">
              {marketData.map((market, index) => (
                <motion.div
                  key={market.name}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: 0.8 + index * 0.1 }}
                  className="text-center flex-1"
                >
                  <div className="text-lg text-[#6b7280] mb-2 font-medium">{market.name}</div>
                  <div className="text-xl font-bold text-[#1f2937]">
                    {market.name === "달러/원" ? market.value.toLocaleString() : market.value.toFixed(2)}
                  </div>
                  <div className={`text-base mt-1 ${market.change > 0 ? "text-[#dc2626]" : "text-[#008485]"}`}>
                    {market.change > 0 ? "+" : ""}
                    {market.change.toFixed(2)} ({formatPercent(market.changePercent)})
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Investment Insights Card */}
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.8 }}
            className="bg-white/95 backdrop-blur-sm rounded-2xl p-6 shadow-xl border border-[#008485]"
          >
            <div className="text-2xl font-bold text-[#1f2937] mb-4">투자 인사이트</div>
            <div className="space-y-3">
              {insights.map((insight, index) => (
                <motion.div
                  key={insight.title}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.4, delay: 1.0 + index * 0.2 }}
                  className="py-2 border-b border-[#f3f4f6] last:border-b-0"
                >
                  <div className="text-lg text-[#1f2937] mb-0.5 font-medium">{insight.title}</div>
                  <div className="text-base text-[#6b7280] leading-normal">{insight.description}</div>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Service Introduction Card */}
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 1.0 }}
            className="bg-white/95 backdrop-blur-sm rounded-2xl p-6 shadow-xl border border-[#008485]"
          >
            <div className="text-2xl font-bold text-[#1f2937] mb-4">내 포트폴리오 소식</div>
            <div className="space-y-2">
              {features.map((feature, index) => (
                <motion.div
                  key={feature.text}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.4, delay: 1.2 + index * 0.1 }}
                  whileHover={{ scale: 1.02, x: 4 }}
                  className="flex items-center gap-2 p-2 rounded-lg cursor-pointer transition-all"
                >
                  <span className="text-lg text-[#374151] font-medium">{feature.text}</span>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </main>
    </div>
  )
}
