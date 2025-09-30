"use client"

import { useState, useEffect, useCallback, useMemo } from "react"
import { Calendar, Target, Activity, PieChart, Plus, Loader2, Play, CheckCircle, XCircle, Edit } from "lucide-react"
import type { PortfolioWithDetails } from "@/lib/api/portfolios"
import type { BacktestResponse, BacktestStatus } from "@/types/portfolio"
import { formatCurrency, formatPercent } from "@/utils/formatters"
import { PortfolioPieChart } from "./portfolio-pie-chart"
import { fetchPortfolioBacktests, executeBacktest } from "@/lib/api"
import { useBacktest } from "@/contexts/BacktestContext"
import Link from "next/link"

interface PortfolioTabContentProps {
  portfolio: PortfolioWithDetails
  activeTab: "holdings" | "backtests" | "analysis"
}

export function PortfolioTabContent({ portfolio, activeTab }: PortfolioTabContentProps) {
  const [backtests, setBacktests] = useState<BacktestResponse[]>([])
  const [isLoadingBacktests, setIsLoadingBacktests] = useState(false)
  const [backtestError, setBacktestError] = useState<string | null>(null)
  const [executingBacktests, setExecutingBacktests] = useState<Set<number>>(new Set())
  
  // 전역 백테스트 상태 사용
  const { 
    getBacktestStatus, 
    hasRunningBacktests, 
    startPolling, 
    stopPolling,
    updateBacktestStatus 
  } = useBacktest()

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

  // 백테스트 실행 상태 가져오기 (전역 상태 우선, 서버 상태 fallback)
  const getBacktestDisplayStatus = useCallback((backtest: BacktestResponse): BacktestStatus => {
    // 전역 상태에서 먼저 확인
    const globalStatus = getBacktestStatus(portfolio.id.toString(), backtest.id.toString())
    if (globalStatus) {
      return globalStatus.toLowerCase() as BacktestStatus
    }
    
    // 전역 상태가 없으면 서버 상태 사용
    const serverStatus = backtest.status?.toLowerCase()
    if (serverStatus === 'completed' || serverStatus === 'failed' || serverStatus === 'running' || serverStatus === 'created') {
      return serverStatus as BacktestStatus
    }
    
    // 기본값
    return 'created'
  }, [getBacktestStatus, portfolio.id])

  // 백테스트 실행 함수
  const handleExecuteBacktest = useCallback(async (backtestId: number) => {
    setExecutingBacktests(prev => new Set([...prev, backtestId]))
    
    try {
      console.log(`[UI] 백테스트 실행 요청 시작: ${backtestId}`)
      const result = await executeBacktest(backtestId)
      
      console.log(`[UI] 백테스트 실행 응답 받음:`, result)
      
      // 전역 상태에서 RUNNING 상태로 업데이트
      updateBacktestStatus(portfolio.id.toString(), backtestId.toString(), 'RUNNING')
      
      // 폴링 시작 (실행 중인 백테스트가 있으면 자동으로 폴링됨)
      startPolling(portfolio.id.toString())
      
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
  }, [portfolio.id, updateBacktestStatus, startPolling])

  // 백테스트 내역을 가져오는 함수
  const loadBacktests = useCallback(async () => {
    if (isLoadingBacktests) return
    
    setIsLoadingBacktests(true)
    setBacktestError(null)
    
    try {
      const backtestData = await fetchPortfolioBacktests(portfolio.id.toString())
      setBacktests(backtestData)
      
      // 실행 중인 백테스트가 있으면 폴링 시작
      const hasRunning = backtestData.some(bt => {
        const status = bt.status?.toLowerCase()
        return status === 'running'
      })
      
      if (hasRunning) {
        console.log(`[PortfolioTab] 실행 중인 백테스트 감지, 폴링 시작`)
        startPolling(portfolio.id.toString())
      }
    } catch (error) {
      console.error("Failed to fetch backtests:", error)
      setBacktestError(error instanceof Error ? error.message : "백테스트 내역을 불러오는데 실패했습니다.")
    } finally {
      setIsLoadingBacktests(false)
    }
  }, [portfolio.id, isLoadingBacktests, startPolling])

  // 백테스트 탭이 활성화될 때 데이터 로드
  useEffect(() => {
    if (activeTab === "backtests" && backtests.length === 0 && !isLoadingBacktests) {
      loadBacktests()
    }
  }, [activeTab, backtests.length, isLoadingBacktests, loadBacktests])

  // 실행 중인 백테스트가 있으면 폴링 시작 (전역 상태에서 자동 관리됨)
  useEffect(() => {
    if (activeTab === "backtests" && backtests.length > 0) {
      const hasRunning = backtests.some(bt => getBacktestDisplayStatus(bt) === 'running')
      
      if (hasRunning) {
        console.log(`[PortfolioTab] 실행 중인 백테스트 감지, 폴링 시작`)
        startPolling(portfolio.id.toString())
      } else {
        console.log(`[PortfolioTab] 실행 중인 백테스트 없음, 폴링 중지`)
        stopPolling(portfolio.id.toString())
      }
    }
  }, [activeTab, backtests, getBacktestDisplayStatus, startPolling, stopPolling, portfolio.id])

  return (
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
                      className={`text-sm font-medium ${stock.dailyRate >= 0 ? "text-[#009178]" : "text-[#dc2626]"}`}
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

      {activeTab === "backtests" && (
        <div className="bg-[#f0f9f7] rounded-xl p-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Activity className="w-5 h-5 text-[#009178]" />
              <h3 className="text-lg font-semibold text-[#1f2937]">백테스트 내역</h3>
            </div>
            <Link href={`/portfolios/${portfolio.id}/backtests/create`}>
              <button className="flex items-center gap-2 bg-[#009178] text-white px-3 py-2 rounded-lg text-sm hover:bg-[#004e42]">
                <Plus className="w-4 h-4" /> 백테스트 추가
              </button>
            </Link>
          </div>
          {isLoadingBacktests && (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-[#009178]" />
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
                  <button className="bg-[#009178] text-white px-6 py-3 rounded-lg font-semibold hover:bg-[#004e42] transition-colors">
                    백테스트 생성하기
                  </button>
                </Link>
                <div className="text-sm text-[#6b7280]">
                  또는 <button 
                    onClick={loadBacktests}
                    className="text-[#009178] hover:text-[#004e42] underline"
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
                        {/* 액션 버튼 */}
                        <div className="flex items-center gap-2">
                          {/* CREATED 상태이거나 상태가 없는 경우: 수정 + 실행 버튼 */}
                          {(!displayStatus || displayStatus === 'created') && !isExecuting && (
                            <>
                              <Link href={`/portfolios/${portfolio.id}/backtests/${bt.id}/edit`}>
                                <button className="flex items-center gap-1 px-3 py-1.5 border border-gray-300 text-gray-700 rounded text-sm hover:bg-gray-50 transition-colors">
                                  <Edit className="w-3 h-3" />
                                  수정
                                </button>
                              </Link>
                              <button
                                onClick={() => handleExecuteBacktest(bt.id)}
                                className="flex items-center gap-1 bg-[#009178] text-white px-3 py-1.5 rounded text-sm hover:bg-[#004e42] transition-colors"
                              >
                                <Play className="w-3 h-3" />
                                실행
                              </button>
                            </>
                          )}
                          
                          {/* RUNNING 상태: 실행중 표시 */}
                          {displayStatus === 'running' && (
                            <div className="flex items-center gap-1 px-3 py-1.5 text-blue-600 text-sm">
                              <Loader2 className="w-3 h-3 animate-spin" />
                              실행중...
                            </div>
                          )}
                          
                          {/* COMPLETED 상태: 상세보기 + 수정 + 재실행 버튼 */}
                          {displayStatus === 'completed' && (
                            <>
                              <Link href={`/portfolios/backtests/${bt.id}`}>
                                <button className="px-3 py-1.5 border border-[#009178] text-[#009178] rounded text-sm hover:bg-[#f0f9f7] transition-colors">
                                  상세보기
                                </button>
                              </Link>
                              <Link href={`/portfolios/${portfolio.id}/backtests/${bt.id}/edit`}>
                                <button className="flex items-center gap-1 px-3 py-1.5 border border-gray-300 text-gray-700 rounded text-sm hover:bg-gray-50 transition-colors">
                                  <Edit className="w-3 h-3" />
                                  수정
                                </button>
                              </Link>
                              {!isExecuting && (
                                <button
                                  onClick={() => handleExecuteBacktest(bt.id)}
                                  className="flex items-center gap-1 bg-orange-500 text-white px-3 py-1.5 rounded text-sm hover:bg-orange-600 transition-colors"
                                >
                                  <Play className="w-3 h-3" />
                                  재실행
                                </button>
                              )}
                              {isExecuting && (
                                <div className="flex items-center gap-1 px-3 py-1.5 text-orange-600 text-sm">
                                  <Loader2 className="w-3 h-3 animate-spin" />
                                  재실행 중...
                                </div>
                              )}
                            </>
                          )}
                          
                          {/* FAILED 상태: 수정 + 재실행 버튼 */}
                          {displayStatus === 'failed' && !isExecuting && (
                            <>
                              <Link href={`/portfolios/${portfolio.id}/backtests/${bt.id}/edit`}>
                                <button className="flex items-center gap-1 px-3 py-1.5 border border-gray-300 text-gray-700 rounded text-sm hover:bg-gray-50 transition-colors">
                                  <Edit className="w-3 h-3" />
                                  수정
                                </button>
                              </Link>
                              <button
                                onClick={() => handleExecuteBacktest(bt.id)}
                                className="flex items-center gap-1 bg-orange-500 text-white px-3 py-1.5 rounded text-sm hover:bg-orange-600 transition-colors"
                              >
                                <Play className="w-3 h-3" />
                                재실행
                              </button>
                            </>
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
                    <button className="bg-[#009178] text-white px-6 py-3 rounded-lg font-semibold hover:bg-[#004e42] transition-colors">
                      백테스트 생성하기
                    </button>
                  </Link>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {activeTab === "analysis" && (
        <div className="bg-[#f0f9f7] rounded-xl p-4">
          <div className="flex items-center gap-2 mb-4">
            <Target className="w-5 h-5 text-[#009178]" />
            <h3 className="text-lg font-semibold text-[#1f2937]">상세 분석</h3>
          </div>
          <div className="text-center py-12">
            <div className="text-lg text-[#6b7280]">상세 분석 기능은 준비 중입니다.</div>
          </div>
        </div>
      )}
    </div>
  )
}
