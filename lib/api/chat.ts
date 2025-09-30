/**
 * 챗봇 API 통신 함수
 */

export interface ChatResponse {
  answer: string
  success: boolean
  error?: string
}

/**
 * 챗봇에게 질문을 전송하고 답변을 받아오는 함수
 * @param category - 챗봇 카테고리 ('loss', 'profit', 또는 'benchmark')
 * @param question - 사용자 질문
 * @returns Promise<ChatResponse>
 */
export async function sendChatMessage(category: 'loss' | 'profit' | 'benchmark', question: string): Promise<ChatResponse> {
  try {
    const response = await fetch(`/api/chat/${category}?question=${encodeURIComponent(question)}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    })

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    const data = await response.json()
    
    return {
      answer: data.answer || '답변을 가져오는데 문제가 발생했습니다.',
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
    const response = await fetch(`/api/chat/${category}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        question,
        context
      })
    })

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    const data = await response.json()
    
    return {
      answer: data.answer || '답변을 가져오는데 문제가 발생했습니다.',
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
