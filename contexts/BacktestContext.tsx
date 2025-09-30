"use client"

import React, { createContext, useContext, useReducer, useEffect, useCallback, useMemo } from 'react'
import { getPortfolioBacktestStatuses } from '@/lib/api/backtests'

// 백테스트 상태 타입
export type BacktestStatus = 'CREATED' | 'RUNNING' | 'COMPLETED' | 'FAILED'

// 백테스트 상태 정보
export interface BacktestStateInfo {
  id: string
  status: BacktestStatus
  lastUpdated: number
}

// Context 상태 타입
interface BacktestContextState {
  // 포트폴리오별 백테스트 상태 맵
  backtestStates: Record<string, Record<string, BacktestStateInfo>>
  // 폴링 중인 포트폴리오 ID들
  pollingPortfolios: Set<string>
  // 에러 상태
  errors: Record<string, string>
}

// Context 액션 타입
type BacktestContextAction =
  | { type: 'SET_BACKTEST_STATES'; portfolioId: string; states: Record<string, BacktestStateInfo> }
  | { type: 'UPDATE_BACKTEST_STATE'; portfolioId: string; backtestId: string; status: BacktestStatus }
  | { type: 'START_POLLING'; portfolioId: string }
  | { type: 'STOP_POLLING'; portfolioId: string }
  | { type: 'SET_ERROR'; portfolioId: string; error: string }
  | { type: 'CLEAR_ERROR'; portfolioId: string }

// 초기 상태
const initialState: BacktestContextState = {
  backtestStates: {},
  pollingPortfolios: new Set(),
  errors: {}
}

// Reducer
function backtestReducer(state: BacktestContextState, action: BacktestContextAction): BacktestContextState {
  switch (action.type) {
    case 'SET_BACKTEST_STATES':
      return {
        ...state,
        backtestStates: {
          ...state.backtestStates,
          [action.portfolioId]: action.states
        },
        errors: {
          ...state.errors,
          [action.portfolioId]: undefined
        }
      }
    
    case 'UPDATE_BACKTEST_STATE':
      return {
        ...state,
        backtestStates: {
          ...state.backtestStates,
          [action.portfolioId]: {
            ...state.backtestStates[action.portfolioId],
            [action.backtestId]: {
              id: action.backtestId,
              status: action.status,
              lastUpdated: Date.now()
            }
          }
        }
      }
    
    case 'START_POLLING':
      return {
        ...state,
        pollingPortfolios: new Set([...state.pollingPortfolios, action.portfolioId])
      }
    
    case 'STOP_POLLING':
      const newPollingPortfolios = new Set(state.pollingPortfolios)
      newPollingPortfolios.delete(action.portfolioId)
      return {
        ...state,
        pollingPortfolios: newPollingPortfolios
      }
    
    case 'SET_ERROR':
      return {
        ...state,
        errors: {
          ...state.errors,
          [action.portfolioId]: action.error
        }
      }
    
    case 'CLEAR_ERROR':
      const newErrors = { ...state.errors }
      delete newErrors[action.portfolioId]
      return {
        ...state,
        errors: newErrors
      }
    
    default:
      return state
  }
}

// Context 생성
const BacktestContext = createContext<{
  state: BacktestContextState
  dispatch: React.Dispatch<BacktestContextAction>
  // 유틸리티 함수들
  getBacktestStatus: (portfolioId: string, backtestId: string) => BacktestStatus | null
  isPolling: (portfolioId: string) => boolean
  hasRunningBacktests: (portfolioId: string) => boolean
  startPolling: (portfolioId: string) => void
  stopPolling: (portfolioId: string) => void
  updateBacktestStatus: (portfolioId: string, backtestId: string, status: BacktestStatus) => void
} | null>(null)

// Provider 컴포넌트
export function BacktestProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(backtestReducer, initialState)

  // 백테스트 상태 조회 함수
  const getBacktestStatus = useCallback((portfolioId: string, backtestId: string): BacktestStatus | null => {
    return state.backtestStates[portfolioId]?.[backtestId]?.status || null
  }, [state.backtestStates])

  // 폴링 상태 확인
  const isPolling = useCallback((portfolioId: string): boolean => {
    return state.pollingPortfolios.has(portfolioId)
  }, [state.pollingPortfolios])

  // 실행 중인 백테스트가 있는지 확인
  const hasRunningBacktests = useCallback((portfolioId: string): boolean => {
    const portfolioStates = state.backtestStates[portfolioId]
    if (!portfolioStates) return false
    
    return Object.values(portfolioStates).some(backtest => backtest.status === 'RUNNING')
  }, [state.backtestStates])

  // 폴링 시작
  const startPolling = useCallback((portfolioId: string) => {
    dispatch({ type: 'START_POLLING', portfolioId })
  }, [])

  // 폴링 중지
  const stopPolling = useCallback((portfolioId: string) => {
    dispatch({ type: 'STOP_POLLING', portfolioId })
  }, [])

  // 백테스트 상태 업데이트
  const updateBacktestStatus = useCallback((portfolioId: string, backtestId: string, status: BacktestStatus) => {
    dispatch({ type: 'UPDATE_BACKTEST_STATE', portfolioId, backtestId, status })
  }, [])

  // 폴링할 포트폴리오 목록 메모이제이션
  const pollingPortfoliosArray = useMemo(() => 
    Array.from(state.pollingPortfolios), 
    [state.pollingPortfolios]
  )

  // 폴링 로직
  useEffect(() => {
    const pollInterval = 3000 // 3초마다 폴링

    const pollBacktestStatuses = async () => {
      // 병렬로 모든 포트폴리오 상태 조회
      const promises = pollingPortfoliosArray.map(async (portfolioId) => {
        try {
          const currentStatuses = await getPortfolioBacktestStatuses(portfolioId)
          
          // 현재 상태와 비교하여 변경된 것만 업데이트
          const currentStates = state.backtestStates[portfolioId] || {}
          const hasChanges = Object.keys(currentStatuses).some(id => 
            currentStates[id]?.status !== currentStatuses[id]
          )

          if (hasChanges) {
            console.log(`[BacktestContext] 포트폴리오 ${portfolioId} 상태 변경 감지`)
            
            // 새로운 상태로 업데이트
            const newStates: Record<string, BacktestStateInfo> = {}
            Object.entries(currentStatuses).forEach(([id, status]) => {
              newStates[id] = {
                id,
                status: status as BacktestStatus,
                lastUpdated: Date.now()
              }
            })
            
            dispatch({ type: 'SET_BACKTEST_STATES', portfolioId, states: newStates })
          }

          // 실행 중인 백테스트가 없으면 폴링 중지
          const hasRunning = Object.values(currentStatuses).some(status => status === 'RUNNING')
          if (!hasRunning) {
            console.log(`[BacktestContext] 포트폴리오 ${portfolioId} 실행 중인 백테스트 없음, 폴링 중지`)
            dispatch({ type: 'STOP_POLLING', portfolioId })
          }
        } catch (error) {
          console.error(`[BacktestContext] 포트폴리오 ${portfolioId} 폴링 실패:`, error)
          dispatch({ 
            type: 'SET_ERROR', 
            portfolioId, 
            error: error instanceof Error ? error.message : '상태 조회 실패' 
          })
        }
      })

      // 모든 요청을 병렬로 실행
      await Promise.allSettled(promises)
    }

    if (pollingPortfoliosArray.length > 0) {
      const interval = setInterval(pollBacktestStatuses, pollInterval)
      return () => clearInterval(interval)
    }
  }, [pollingPortfoliosArray, state.backtestStates])

  const contextValue = useMemo(() => ({
    state,
    dispatch,
    getBacktestStatus,
    isPolling,
    hasRunningBacktests,
    startPolling,
    stopPolling,
    updateBacktestStatus
  }), [
    state,
    getBacktestStatus,
    isPolling,
    hasRunningBacktests,
    startPolling,
    stopPolling,
    updateBacktestStatus
  ])

  return (
    <BacktestContext.Provider value={contextValue}>
      {children}
    </BacktestContext.Provider>
  )
}

// Hook
export function useBacktest() {
  const context = useContext(BacktestContext)
  if (!context) {
    throw new Error('useBacktest must be used within a BacktestProvider')
  }
  return context
}
