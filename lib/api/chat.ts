/**
 * 챗봇 API 통신 함수
 */

import { API_CONFIG } from '@/lib/api'

export interface ChatResponse {
  answer: string
  success: boolean
  error?: string
}

/**
 * 챗봇 API 데이터 구조
 */
export interface ChatApiData {
  category: string
  categoryDescription: string
  question: string
  answer: string
}

/**
 * 챗봇 API 응답 구조
 */
export interface ChatApiResponse {
  status: string
  message: string
  timestamp: string
  data: ChatApiData
}

/**
 * 챗봇에게 질문을 전송하고 답변을 받아오는 함수
 * @param category - 챗봇 카테고리 ('loss', 'profit', 또는 'benchmark')
 * @param question - 사용자 질문
 * @returns Promise<ChatResponse>
 */
export async function sendChatMessage(category: 'loss' | 'profit' | 'benchmark', question: string): Promise<ChatResponse> {
  try {
    const response = await fetch(`${API_CONFIG.baseUrl}/api/chat/${category}?question=${encodeURIComponent(question)}`, {
      method: 'GET',
      headers: API_CONFIG.headers,
    })

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    const result: ChatApiResponse = await response.json()
    
    if (result.status !== 'success') {
      throw new Error(result.message || '답변을 가져오는데 문제가 발생했습니다.')
    }
    
    return {
      answer: result.data.answer || '답변을 가져오는데 문제가 발생했습니다.',
      success: true
    }
  } catch (error) {
    console.error('챗봇 API 오류:', error)
    
    return {
      answer: '죄송합니다. 현재 서비스에 접속할 수 없습니다. 잠시 후 다시 시도해주세요.',
      success: false,
      error: error instanceof Error ? error.message : '알 수 없는 오류'
    }
  }
}

/**
 * POST 방식으로 챗봇에게 질문을 전송하는 함수 (향후 확장용)
 * @param category - 챗봇 카테고리 ('loss', 'profit', 또는 'benchmark')  
 * @param question - 사용자 질문
 * @param context - 추가 컨텍스트 정보 (옵션)
 * @returns Promise<ChatResponse>
 */
export async function sendChatMessagePost(
  category: 'loss' | 'profit' | 'benchmark', 
  question: string, 
  context?: Record<string, any>
): Promise<ChatResponse> {
  try {
    const response = await fetch(`${API_CONFIG.baseUrl}/api/chat/${category}`, {
      method: 'POST',
      headers: API_CONFIG.headers,
      body: JSON.stringify({
        question,
        context
      })
    })

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    const result: ChatApiResponse = await response.json()
    
    if (result.status !== 'success') {
      throw new Error(result.message || '답변을 가져오는데 문제가 발생했습니다.')
    }
    
    return {
      answer: result.data.answer || '답변을 가져오는데 문제가 발생했습니다.',
      success: true
    }
  } catch (error) {
    console.error('챗봇 API 오류:', error)
    
    return {
      answer: '죄송합니다. 현재 서비스에 접속할 수 없습니다. 잠시 후 다시 시도해주세요.',
      success: false,
      error: error instanceof Error ? error.message : '알 수 없는 오류'
    }
  }
}

/**
 * 컨텍스트 기반 챗봇에게 질문을 전송하는 함수
 * @param context - 챗봇 컨텍스트 ('portfolio', 'backtest', 또는 'create-portfolio')
 * @param question - 사용자 질문
 * @returns Promise<ChatResponse>
 */
export async function sendContextChatMessage(
  context: 'portfolio' | 'backtest' | 'create-portfolio',
  question: string
): Promise<ChatResponse> {
  try {
    const response = await fetch(`${API_CONFIG.baseUrl}/api/chat/${context}?question=${encodeURIComponent(question)}`, {
      method: 'GET',
      headers: API_CONFIG.headers,
    })

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    const result: ChatApiResponse = await response.json()
    
    if (result.status !== 'success') {
      throw new Error(result.message || '답변을 가져오는데 문제가 발생했습니다.')
    }
    
    return {
      answer: result.data.answer || '답변을 가져오는데 문제가 발생했습니다.',
      success: true
    }
  } catch (error) {
    return {
      answer: '죄송합니다. 현재 서비스에 접속할 수 없습니다. 잠시 후 다시 시도해주세요.',
      success: false,
      error: error instanceof Error ? error.message : '알 수 없는 오류'
    }
  }
}
