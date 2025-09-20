"use client"

import { useState, useEffect } from "react"
import { TrendingUp, TrendingDown, Calendar, Target, Bell, Activity, PieChart, Plus, Loader2, Play, CheckCircle, XCircle } from "lucide-react"
import type { PortfolioWithDetails } from "@/lib/api/portfolios"
import type { BacktestResponse, BacktestStatus } from "@/types/portfolio"
import { formatCurrency, formatPercent } from "@/utils/formatters"
import { PortfolioPieChart } from "./portfolio-pie-chart"
import { fetchPortfolioBacktests, executeBacktest } from "@/lib/api"
import { getPortfolioBacktestStatuses } from "@/lib/api/backtests"
import Link from "next/link"

interface PortfolioDetailPanelProps {
  portfolio: PortfolioWithDetails
}

type TabType = "holdings" | "strategy" | "backtests" | "alerts"

export function PortfolioDetailPanel({ portfolio }: PortfolioDetailPanelProps) {
  const [activeTab, setActiveTab] = useState<TabType>("holdings")
  const [backtests, setBacktests] = useState<BacktestResponse[]>([])
  const [isLoadingBacktests, setIsLoadingBacktests] = useState(false)
  const [backtestError, setBacktestError] = useState<string | null>(null)
  const [executingBacktests, setExecutingBacktests] = useState<Set<number>>(new Set())
  const [lastKnownStatuses, setLastKnownStatuses] = useState<Record<string, string>>({})

  // 날짜 포맷팅 함수
  const formatDateTime = (dateString: string) => {
    try {
      const date = new Date(dateString)
      if (isNaN(date.getTime())) return dateString // 유효하지 않은 날짜면 원본 반환
      
      const year = date.getFullYear()
      const month = String(date.getMonth() + 1).padStart(2, '0')
      const day = String(date.getDate()).padStart(2, '0')
      const hours = String(date.getHours()).padStart(2, '0')
      const minutes = String(date.getMinutes()).padStart(2, '0')
      const seconds = String(date.getSeconds()).padStart(2, '0')
      
      return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`
    } catch (error) {
      return dateString // 에러 발생시 원본 반환
    }
  }

  // 백테스트 실행 상태 가져오기 (서버 상태만 사용)
  const getBacktestDisplayStatus = (backtest: BacktestResponse): BacktestStatus => {
    // 디버깅용 로그
    console.log(`[Status Debug] Backtest ${backtest.id}: Original status = "${backtest.status}"`)
    
    // 서버에서 받은 상태를 사용 (대소문자 구분 없이)
    const serverStatus = backtest.status?.toLowerCase()
    console.log(`[Status Debug] Backtest ${backtest.id}: Processed status = "${serverStatus}"`)
    
    if (serverStatus === 'completed' || serverStatus === 'failed' || serverStatus === 'running' || serverStatus === 'created') {
      console.log(`[Status Debug] Backtest ${backtest.id}: Returning status = "${serverStatus}"`)
      return serverStatus as BacktestStatus
    }
    
    // 기본값
    console.log(`[Status Debug] Backtest ${backtest.id}: Returning default status = "created"`)
    return 'created'
  }

  // 백테스트 실행 함수
  const handleExecuteBacktest = async (backtestId: number) => {
    setExecutingBacktests(prev => new Set([...prev, backtestId]))
    
    try {
      console.log(`[UI] 백테스트 실행 요청 시작: ${backtestId}`)
      const result = await executeBacktest(backtestId)
      
      console.log(`[UI] 백테스트 실행 응답 받음:`, result)
      console.log(`[UI] - success: ${result.success}`)
      console.log(`[UI] - message: ${result.message}`)
      console.log(`[UI] - backtestId: ${result.backtestId}`)
      
      // 실행 성공 후 백테스트 목록 새로고침
      await loadBacktests()
    } catch (error) {
      console.error("[UI] 백테스트 실행 실패:", error)
      
      // 에러 알림 (간단한 alert 사용, 추후 토스트로 변경 가능)
      alert(error instanceof Error ? error.message : "백테스트 실행에 실패했습니다.")
    } finally {
      setExecutingBacktests(prev => {
        const newSet = new Set(prev)
        newSet.delete(backtestId)
        return newSet
      })
    }
  }

  // 백테스트 내역을 가져오는 함수
  const loadBacktests = async () => {
    if (isLoadingBacktests) return
    
    setIsLoadingBacktests(true)
    setBacktestError(null)
    
    try {
      const backtestData = await fetchPortfolioBacktests(portfolio.id.toString())
      setBacktests(backtestData)
      
      // 초기 상태 정보 설정
      try {
        const currentStatuses = await getPortfolioBacktestStatuses(portfolio.id.toString())
        setLastKnownStatuses(currentStatuses)
        console.log("[BacktestSync] 초기 상태 정보 설정:", currentStatuses)
      } catch (statusError) {
        console.warn("[BacktestSync] 초기 상태 정보 설정 실패:", statusError)
        // 상태 조회 실패해도 백테스트 목록은 표시
      }
    } catch (error) {
      console.error("Failed to fetch backtests:", error)
      setBacktestError(error instanceof Error ? error.message : "백테스트 내역을 불러오는데 실패했습니다.")
    } finally {
      setIsLoadingBacktests(false)
    }
  }

  // 백테스트 탭이 활성화될 때 데이터 로드
  const handleTabChange = (tabId: TabType) => {
    setActiveTab(tabId)
    if (tabId === "backtests" && backtests.length === 0 && !isLoadingBacktests) {
      loadBacktests()
    }
  }

  // 효율적인 상태 동기화: 상태만 조회 후 변경 시에만 전체 목록 재조회
  const syncBacktestStatuses = async () => {
    try {
      const currentStatuses = await getPortfolioBacktestStatuses(portfolio.id.toString())
      
      // 상태 변경 감지
      const hasStatusChanged = Object.keys(currentStatuses).some(id => 
        lastKnownStatuses[id] !== currentStatuses[id]
      )
      
      if (hasStatusChanged) {
        console.log("[BacktestSync] 상태 변경 감지, 전체 목록 재조회")
        setLastKnownStatuses(currentStatuses)
        await loadBacktests()
      } else {
        console.log("[BacktestSync] 상태 변경 없음")
      }
    } catch (error) {
      console.error("[BacktestSync] 상태 동기화 실패:", error)
      // 상태 조회 실패 시 fallback으로 전체 목록 재조회
      await loadBacktests()
    }
  }

  // 실행 중인 백테스트가 있으면 주기적으로 효율적인 상태 동기화
  useEffect(() => {
    if (activeTab === "backtests" && backtests.length > 0) {
      const runningBacktests = backtests.filter(bt => getBacktestDisplayStatus(bt) === 'running')
      
      if (runningBacktests.length > 0) {
        // 실행 중인 백테스트가 있으면 3초마다 상태만 조회 (더 빠른 동기화)
        const interval = setInterval(() => {
          syncBacktestStatuses()
        }, 3000)
        
        return () => clearInterval(interval)
      }
    }
  }, [backtests, activeTab, lastKnownStatuses])

  const tabs = [
    { id: "holdings" as TabType, label: "보유종목", icon: PieChart },
    { id: "strategy" as TabType, label: "매매신호", icon: Target },
    { id: "backtests" as TabType, label: "백테스트 내역", icon: Activity },
    { id: "alerts" as TabType, label: "알림", icon: Bell },
  ]

  return (
    <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-xl border border-[#008485] p-6 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-[#1f2937]">{portfolio.name}</h2>
          <p className="text-[#6b7280] mt-1">{portfolio.description}</p>
        </div>
        <div className="text-right">
          <div className="text-2xl font-bold text-[#1f2937]">{formatCurrency(portfolio.totalAssets)}</div>
          <div className={`flex items-center gap-1 ${portfolio.dailyRate >= 0 ? "text-[#008485]" : "text-[#dc2626]"}`}>
            {portfolio.dailyRate >= 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
            <span className="font-semibold">{formatPercent(portfolio.dailyRate)}</span>
            <span className="text-sm">
              ({portfolio.dailyChange >= 0 ? "+" : ""}
              {formatCurrency(portfolio.dailyChange)})
            </span>
          </div>
        </div>
      </div>

      <div className="flex gap-2 mb-6 p-1 bg-[#f0f9f7] rounded-xl">
        {tabs.map((tab) => {
          const Icon = tab.icon
          return (
            <button
              key={tab.id}
              onClick={() => handleTabChange(tab.id)}
              className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
                activeTab === tab.id
                  ? "bg-white text-[#008485] shadow-sm"
                  : "text-[#6b7280] hover:text-[#1f2937] hover:bg-white/50"
              }`}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          )
        })}
      </div>

      <div className="min-h-[400px]">
        {activeTab === "holdings" && (
          <div className="bg-[#f0f9f7] rounded-xl p-4">
            <h3 className="text-lg font-semibold text-[#1f2937] mb-4">자산 구성 및 보유 종목</h3>

            <div className="flex flex-col lg:flex-row gap-6">
              {/* Pie Chart - Visual only */}
              <div className="lg:w-1/3 flex-shrink-0 flex items-center justify-center py-4">
                <PortfolioPieChart
                  data={portfolio.holdingStocks.map((stock, index) => ({
                    name: stock.name,
                    percent: stock.weight,
                    trend: stock.dailyRate,
                    color: `hsl(${(index * 137.5) % 360}, 70%, 50%)`, // Generate colors dynamically
                    amount: stock.value,
                  }))}
                  height={`${portfolio.holdingStocks.length * 80 + 16}px`} // 각 항목 높이(80px) + 여백(16px)
                />
              </div>

              {/* Holdings List with detailed information */}
              <div className="lg:w-2/3 space-y-3">
                {portfolio.holdingStocks.map((stock, index) => (
                  <div key={index} className="flex items-center justify-between p-4 bg-white rounded-lg shadow-sm">
                    <div className="flex items-center gap-3">
                      <div 
                        className="w-4 h-4 rounded-full" 
                        style={{ backgroundColor: `hsl(${(index * 137.5) % 360}, 70%, 50%)` }} 
                      />
                      <div>
                        <div className="font-semibold text-[#1f2937]">{stock.name}</div>
                        <div className="text-sm text-[#6b7280]">비중: {stock.weight.toFixed(2)}%</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-[#1f2937] text-lg">{formatCurrency(stock.value)}</div>
                      <div
                        className={`text-sm font-medium ${stock.dailyRate >= 0 ? "text-[#008485]" : "text-[#dc2626]"}`}
                      >
                        {formatPercent(stock.dailyRate)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === "strategy" && (
          <div className="bg-[#f0f9f7] rounded-xl p-4">
            <div className="flex items-center gap-2 mb-4">
              <Target className="w-5 h-5 text-[#008485]" />
              <h3 className="text-lg font-semibold text-[#1f2937]">매매신호</h3>
            </div>
            <div className="text-center py-12">
              <div className="text-lg text-[#6b7280]">매매신호 기능은 준비 중입니다.</div>
            </div>
          </div>
        )}

        {activeTab === "backtests" && (
          <div className="bg-[#f0f9f7] rounded-xl p-4">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Activity className="w-5 h-5 text-[#008485]" />
                <h3 className="text-lg font-semibold text-[#1f2937]">백테스트 내역</h3>
              </div>
              <Link href={`/portfolios/${portfolio.id}/backtests/create`}>
                <button className="flex items-center gap-2 bg-[#008485] text-white px-3 py-2 rounded-lg text-sm hover:bg-[#006b6c]">
                  <Plus className="w-4 h-4" /> 백테스트 추가
                </button>
              </Link>
            </div>
            {isLoadingBacktests && (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-[#008485]" />
                <span className="ml-2 text-[#6b7280]">백테스트 내역을 불러오는 중...</span>
              </div>
            )}
            
            {backtestError && (
              <div className="text-center py-12">
                <h3 className="text-xl font-semibold text-[#1f2937] mb-2">백테스트 내역이 없습니다</h3>
                <p className="text-[#6b7280] mb-6 max-w-sm mx-auto">
                  이 포트폴리오에 대한 백테스트 내역이<br />아직 생성되지 않았습니다.
                </p>
                
                <div className="space-y-3">
                  <Link href={`/portfolios/${portfolio.id}/backtests/create`}>
                    <button className="bg-[#008485] text-white px-6 py-3 rounded-lg font-semibold hover:bg-[#006b6c] transition-colors">
                      백테스트 생성하기
                    </button>
                  </Link>
                  <div className="text-sm text-[#6b7280]">
                    또는 <button 
                      onClick={loadBacktests}
                      className="text-[#008485] hover:text-[#006b6c] underline"
                    >
                      다시 시도
                    </button>
                  </div>
                </div>
              </div>
            )}
            
            {!isLoadingBacktests && !backtestError && (
              <div className="space-y-2">
                {backtests.map((bt) => {
                  const displayStatus = getBacktestDisplayStatus(bt)
                  const isExecuting = executingBacktests.has(bt.id)
                  const canExecute = displayStatus === 'created' && !isExecuting
                  const canViewDetails = displayStatus === 'completed' && bt.metrics
                  
                  
                  return (
                    <div key={bt.id} className="p-3 bg-white rounded-lg shadow-sm">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <div className="font-medium text-[#1f2937]">{bt.name}</div>
                            {/* 상태 표시 */}
                            {displayStatus === 'running' && (
                              <div className="flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs">
                                실행중
                              </div>
                            )}
                            {displayStatus === 'completed' && (
                              <div className="flex items-center gap-1 px-2 py-1 bg-green-100 text-green-800 rounded text-xs">
                                <CheckCircle className="w-3 h-3" />
                                완료
                              </div>
                            )}
                            {displayStatus === 'failed' && (
                              <div className="flex items-center gap-1 px-2 py-1 bg-red-100 text-red-800 rounded text-xs">
                                <XCircle className="w-3 h-3" />
                                실패
                              </div>
                            )}
                            {displayStatus === 'created' && (
                              <div className="px-2 py-1 bg-gray-100 text-gray-600 rounded text-xs">
                                미실행
                              </div>
                            )}
                          </div>
                          <div className="text-xs text-[#6b7280] flex items-center gap-1 mt-0.5">
                            <Calendar className="w-3 h-3" /> {formatDateTime(bt.createdAt)} · 기간 {bt.period}
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-3">
                          {/* 결과 표시 (완료된 경우만) */}
                          {canViewDetails && bt.metrics && (
                            <div className="text-right">
                              <div className={`font-semibold ${(bt.metrics.totalReturn || 0) >= 0 ? "text-[#008485]" : "text-[#dc2626]"}`}>
                                {(bt.metrics.totalReturn || 0).toFixed(1)}%
                              </div>
                              <div className="text-xs text-[#6b7280]">샤프 {(bt.metrics.sharpeRatio || 0).toFixed(2)}</div>
                            </div>
                          )}
                          
                          {/* 액션 버튼 */}
                          <div className="flex items-center gap-2">
                            {/* CREATED 상태이거나 상태가 없는 경우: 실행 버튼 */}
                            {(!displayStatus || displayStatus === 'created') && !isExecuting && (
                              <button
                                onClick={() => handleExecuteBacktest(bt.id)}
                                className="flex items-center gap-1 bg-[#008485] text-white px-3 py-1.5 rounded text-sm hover:bg-[#006b6c] transition-colors"
                              >
                                <Play className="w-3 h-3" />
                                실행
                              </button>
                            )}
                            
                            {/* RUNNING 상태: 실행중 표시 */}
                            {displayStatus === 'running' && (
                              <div className="flex items-center gap-1 px-3 py-1.5 text-blue-600 text-sm">
                                <Loader2 className="w-3 h-3 animate-spin" />
                                실행중...
                              </div>
                            )}
                            
                            {/* COMPLETED 상태: 상세보기 버튼 */}
                            {displayStatus === 'completed' && (
                              <Link href={`/portfolios/backtests/${bt.id}`}>
                                <button className="px-3 py-1.5 border border-[#008485] text-[#008485] rounded text-sm hover:bg-[#f0f9f7] transition-colors">
                                  상세보기
                                </button>
                              </Link>
                            )}
                            
                            {/* FAILED 상태: 재실행 버튼 또는 재실행 중 스피너 */}
                            {displayStatus === 'failed' && !isExecuting && (
                              <button
                                onClick={() => handleExecuteBacktest(bt.id)}
                                className="flex items-center gap-1 bg-orange-500 text-white px-3 py-1.5 rounded text-sm hover:bg-orange-600 transition-colors"
                              >
                                <Play className="w-3 h-3" />
                                재실행
                              </button>
                            )}
                            
                            {/* FAILED 상태에서 재실행 중: 스피너 표시 */}
                            {displayStatus === 'failed' && isExecuting && (
                              <div className="flex items-center gap-1 px-3 py-1.5 text-orange-600 text-sm">
                                <Loader2 className="w-3 h-3 animate-spin" />
                                재실행 중...
                              </div>
                            )}
                            
                          </div>
                        </div>
                      </div>
                    </div>
                  )
                })}
                {backtests.length === 0 && (
                  <div className="text-center py-12">
                    <h3 className="text-xl font-semibold text-[#1f2937] mb-2">백테스트 내역이 없습니다</h3>
                    <p className="text-[#6b7280] mb-6 max-w-sm mx-auto">
                      이 포트폴리오에 대한 백테스트 내역이<br />아직 생성되지 않았습니다.
                    </p>
                    
                    <Link href={`/portfolios/${portfolio.id}/backtests/create`}>
                      <button className="bg-[#008485] text-white px-6 py-3 rounded-lg font-semibold hover:bg-[#006b6c] transition-colors">
                        백테스트 생성하기
                      </button>
                    </Link>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {activeTab === "alerts" && (
          <div className="bg-[#f0f9f7] rounded-xl p-4">
            <div className="flex items-center gap-2 mb-4">
              <Bell className="w-5 h-5 text-[#008485]" />
              <h3 className="text-lg font-semibold text-[#1f2937]">알림</h3>
            </div>
            <div className="text-center py-12">
              <div className="text-lg text-[#6b7280]">알림 기능은 준비 중입니다.</div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
