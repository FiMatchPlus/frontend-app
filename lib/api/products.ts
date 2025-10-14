/**
 * Model Portfolio Products API functions
 */

import { API_CONFIG } from '../api'

// API 응답 타입 정의
interface ApiResponse<T> {
  status: string
  message: string
  timestamp: string
  data: T
}

// 상품 목록 조회 API 응답 데이터
export interface ProductListItem {
  id: number
  name: string
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'VERY_HIGH'
  keywords: string[]
  oneYearReturn: number
  minInvestment: number
}

// 상품 상세 조회 API 응답 데이터
export interface ProductDetail {
  id: number
  name: string
  description: string
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'VERY_HIGH'
  volatilityIndex: number
  oneYearReturn: number
  mdd: number
  sharpeRatio: number
  keywords: string[]
  minInvestment: number
  holdings: {
    symbol: string
    name: string
    weight: number
    sector: string
  }[]
}

/**
 * 모델 포트폴리오 상품 목록 조회
 */
export async function fetchProducts(
  riskLevel?: string,
  search?: string
): Promise<ProductListItem[]> {
  try {
    console.log('[API] Fetching products', { riskLevel, search })

    // Query parameters 구성
    const params = new URLSearchParams()
    if (riskLevel) params.append('riskLevel', riskLevel)
    if (search) params.append('search', search)

    const queryString = params.toString()
    const apiUrl = `${API_CONFIG.baseUrl}/api/products${queryString ? `?${queryString}` : ''}`
    console.log('[API] API URL:', apiUrl)

    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), API_CONFIG.timeout)

    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: API_CONFIG.headers,
      signal: controller.signal,
    })

    clearTimeout(timeoutId)

    console.log('[API] Response Status:', response.status)
    console.log('[API] Response OK:', response.ok)

    if (!response.ok) {
      const errorText = await response.text()
      console.error('[API] Error Response:', errorText)
      throw new Error(`HTTP ${response.status}: ${response.statusText}`)
    }

    const result: ApiResponse<{ products: ProductListItem[] }> = await response.json()
    console.log('[API] Response Body:', result)

    if (result.status !== 'success') {
      throw new Error(result.message || '상품 목록 조회에 실패했습니다.')
    }

    return result.data.products
  } catch (error) {
    console.error('[API] Products fetch error:', error)
    throw error
  }
}

/**
 * 모델 포트폴리오 상품 상세 조회
 */
export async function fetchProductDetail(productId: number): Promise<ProductDetail> {
  try {
    console.log('[API] Fetching product detail:', productId)

    const apiUrl = `${API_CONFIG.baseUrl}/api/products/${productId}`
    console.log('[API] API URL:', apiUrl)

    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), API_CONFIG.timeout)

    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: API_CONFIG.headers,
      signal: controller.signal,
    })

    clearTimeout(timeoutId)

    console.log('[API] Response Status:', response.status)
    console.log('[API] Response OK:', response.ok)

    if (!response.ok) {
      const errorText = await response.text()
      console.error('[API] Error Response:', errorText)
      throw new Error(`HTTP ${response.status}: ${response.statusText}`)
    }

    const result: ApiResponse<ProductDetail> = await response.json()
    console.log('[API] Response Body:', result)

    if (result.status !== 'success') {
      throw new Error(result.message || '상품 상세 조회에 실패했습니다.')
    }

    return result.data
  } catch (error) {
    console.error('[API] Product detail fetch error:', error)
    throw error
  }
}

