"use client"

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useBacktest } from '@/contexts/BacktestContext'
import { CheckCircle, XCircle, AlertCircle } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

interface BacktestNotificationProps {
  portfolioId: string
}

export function BacktestNotification({ portfolioId }: BacktestNotificationProps) {
  const { state } = useBacktest()
  const router = useRouter()
  const [notifications, setNotifications] = useState<Array<{
    id: string
    backtestId: string
    status: 'COMPLETED' | 'FAILED'
    timestamp: number
  }>>([])

  // 백테스트 상태 변경 감지
  useEffect(() => {
    const portfolioStates = state.backtestStates[portfolioId]
    if (!portfolioStates) return

    // 완료 또는 실패 상태로 변경된 백테스트 감지
    Object.entries(portfolioStates).forEach(([backtestId, backtestState]) => {
      if (backtestState.status === 'COMPLETED' || backtestState.status === 'FAILED') {
        // 이미 알림을 보낸 백테스트인지 확인
        const existingNotification = notifications.find(n => n.backtestId === backtestId)
        
        if (!existingNotification) {
          // 새로운 알림 추가
          const newNotification = {
            id: `${portfolioId}-${backtestId}-${Date.now()}`,
            backtestId,
            status: backtestState.status,
            timestamp: backtestState.lastUpdated
          }
          
          setNotifications(prev => [...prev, newNotification])
          
          // 5초 후 알림 자동 제거
          setTimeout(() => {
            setNotifications(prev => prev.filter(n => n.id !== newNotification.id))
          }, 5000)
        }
      }
    })
  }, [state.backtestStates, portfolioId, notifications])

  // 알림 제거 함수
  const removeNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id))
  }

  // 백테스트 상세 페이지로 이동 (선택적)
  const goToBacktestDetail = (backtestId: string) => {
    router.push(`/portfolios/backtests/${backtestId}`)
    // 알림은 제거하지 않음 - 사용자가 직접 닫을 때까지 유지
  }

  return (
    <div className="fixed top-4 right-4 z-50 space-y-2">
      <AnimatePresence>
        {notifications.map((notification) => (
          <motion.div
            key={notification.id}
            initial={{ opacity: 0, x: 300, scale: 0.8 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 300, scale: 0.8 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            className={`
              flex items-center gap-3 p-4 rounded-lg shadow-lg border backdrop-blur-sm cursor-pointer
              ${notification.status === 'COMPLETED' 
                ? 'bg-green-50 border-green-200 text-green-800 hover:bg-green-100' 
                : 'bg-red-50 border-red-200 text-red-800 hover:bg-red-100'
              }
            `}
            onClick={() => goToBacktestDetail(notification.backtestId)}
          >
            <div className="flex-shrink-0">
              {notification.status === 'COMPLETED' ? (
                <CheckCircle className="w-5 h-5 text-green-600" />
              ) : (
                <XCircle className="w-5 h-5 text-red-600" />
              )}
            </div>
            
            <div className="flex-1 min-w-0">
              <div className="font-semibold text-sm">
                백테스트 {notification.status === 'COMPLETED' ? '완료' : '실패'}
              </div>
              <div className="text-xs opacity-75">
                백테스트 ID: {notification.backtestId}
              </div>
              <div className="text-xs opacity-60 mt-1">
                클릭하여 결과 확인
              </div>
            </div>
            
            <button
              onClick={(e) => {
                e.stopPropagation()
                removeNotification(notification.id)
              }}
              className="flex-shrink-0 p-1 hover:bg-black/10 rounded transition-colors"
            >
              <XCircle className="w-4 h-4" />
            </button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  )
}
