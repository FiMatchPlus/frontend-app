"use client"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Header from "@/components/header"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { motion, AnimatePresence } from "framer-motion"
import { X, Plus, ArrowLeft, ChevronDown, ChevronRight, Pencil } from "lucide-react"
import { CreatePortfolioData, StockHolding, Rule, RuleItem } from "@/types/portfolio"
import { StockSearch } from "@/components/stocks/StockSearch"
import FloatingChatbot from "@/components/ui/FloatingChatbot"
import type { Stock } from "@/types/stock"
import { createPortfolio } from "@/lib/api"
import { fetchCurrentPriceByCode } from "@/lib/api/stockNow"

// 카테고리 상수 정의
const RULE_CATEGORIES = {
  rebalance: ["해당없음", "정기", "비중 이탈"],
  stopLoss: ["해당없음", "베타 일정값 초과", "VaR 초과", "MDD 초과", "손실 한계선"],
  takeProfit: ["해당없음", "단일 종목 목표 수익률 달성"]
} as const

export default function CreatePortfolioPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [formData, setFormData] = useState<CreatePortfolioData>({
    name: "",
    totalValue: 0,           // 자동 계산되는 포트폴리오 가치
    description: "",
    stockHoldings: [],
    rule: {
      memo: "",
      rebalance: [],
      stopLoss: [],
      takeProfit: []
    }
  })

  const [newStock, setNewStock] = useState<Partial<StockHolding>>({
    symbol: "",
    name: "",
    shares: undefined,
    currentPrice: undefined,
    totalValue: undefined,
    change: undefined,
    changePercent: undefined,
    weight: undefined
  })

  const [selectedStock, setSelectedStock] = useState<Stock | null>(null)

  const [newRuleItem, setNewRuleItem] = useState<{
    type: keyof Omit<Rule, 'memo'>
    category: string
    threshold: string
    description: string
  }>({
    type: "rebalance",
    category: "",
    threshold: "",
    description: ""
  })

  // 각 섹션별 토글 상태
  const [openSections, setOpenSections] = useState<{
    rebalance: boolean
    stopLoss: boolean
    takeProfit: boolean
  }>({
    rebalance: false,
    stopLoss: false,
    takeProfit: false
  })

  const [isSubmitting, setIsSubmitting] = useState(false)

  // URL 파라미터에서 템플릿 데이터 처리
  useEffect(() => {
    const isTemplate = searchParams.get('template')
    const templateData = searchParams.get('data')
    
    if (isTemplate === 'true' && templateData) {
      try {
        const parsedData = JSON.parse(templateData)
        
        // Product의 holdings 데이터를 StockHolding 형식으로 변환
        // 1단계: 최소 투자 금액을 보장하는 방식으로 계산
        const baseInvestment = 1000000 // 100만원
        const minInvestmentPerStock = 50000 // 종목당 최소 5만원
        
        // 각 종목의 최소 주식 수 계산 (최소 1주)
        const tempHoldings = parsedData.holdings.map((holding: any) => {
          const minShares = Math.max(1, Math.ceil(minInvestmentPerStock / holding.price))
          const targetValue = (baseInvestment * holding.weight) / 100
          const targetShares = Math.max(minShares, Math.round(targetValue / holding.price))
          
          return {
            ...holding,
            shares: targetShares,
            minValue: minShares * holding.price,
            targetValue: targetShares * holding.price
          }
        })
        
        // 2단계: 총 목표 금액과 실제 필요 금액 비교 후 조정
        const totalTargetValue = tempHoldings.reduce((sum, h) => sum + h.targetValue, 0)
        const adjustmentRatio = baseInvestment / totalTargetValue
        
        const stockHoldings: StockHolding[] = tempHoldings.map((holding: any) => {
          // 조정된 주식 수 계산 (최소 1주 보장)
          const adjustedShares = Math.max(1, Math.round(holding.shares * adjustmentRatio))
          const actualTotalValue = adjustedShares * holding.price
          
          return {
            symbol: holding.symbol,
            name: holding.name,
            shares: adjustedShares,
            currentPrice: holding.price,
            totalValue: actualTotalValue,
            change: holding.change || 0,
            changePercent: holding.changePercent || 0,
            weight: holding.weight // 원래 비중 유지 (나중에 재계산됨)
          }
        })
        
        // 총 투자 금액 계산
        const totalValue = stockHoldings.reduce((sum, holding) => sum + holding.totalValue, 0)
        
        // 비중 재계산 (실제 투자 금액 기준)
        const updatedHoldings = stockHoldings.map(holding => ({
          ...holding,
          weight: totalValue > 0 ? (holding.totalValue / totalValue) * 100 : 0
        }))
        
        setFormData(prev => ({
          ...prev,
          name: parsedData.name || "",
          description: parsedData.description || "",
          stockHoldings: updatedHoldings,
          totalValue: totalValue
        }))
        
      } catch (error) {
        console.error('템플릿 데이터 파싱 실패:', error)
      }
    }
  }, [searchParams])

  const toggleSection = (section: keyof typeof openSections) => {
    setOpenSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }))
  }

  // 임계값 유효성 검사 함수
  const validateThreshold = (category: string, threshold: string): boolean => {
    if (category === "해당없음") {
      return true // 해당없음은 임계값 검사 불필요
    }
    
    if (!threshold.trim()) {
      return false // 해당없음이 아닌 경우 임계값 필수
    }
    
    // 숫자 또는 퍼센트 형식 검사
    const numberPattern = /^-?\d+(\.\d+)?%?$/
    return numberPattern.test(threshold.trim())
  }

  const handleInputChange = (field: keyof CreatePortfolioData, value: any) => {
    setFormData(prev => {
      const newData = {
        ...prev,
        [field]: value
      }
      
      // portfolioTotalValue 변경 시에는 비중 재계산하지 않음 (onBlur에서 처리)
      
      return newData
    })
  }

  const handleStockInputChange = (field: keyof StockHolding, value: any) => {
    setNewStock(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleStockSelect = async (stock: Stock) => {
    // Optimistically set selected stock with placeholders
    setSelectedStock(stock)
    setNewStock(prev => ({
      ...prev,
      symbol: stock.symbol,
      name: stock.name,
      currentPrice: stock.price,
      change: 0,
      changePercent: stock.changePercent,
      shares: undefined,
      totalValue: undefined,
      weight: undefined
    }))

    // Fetch live current price and daily rate
    const now = await fetchCurrentPriceByCode(stock.symbol)
    if (now) {
      setSelectedStock(prev => prev ? { ...prev, price: now.price, changePercent: now.changePercent } : prev)
      setNewStock(prev => ({
        ...prev,
        currentPrice: now.price,
        changePercent: now.changePercent,
      }))
    }
  }

  const handleSharesChange = (shares: number) => {
    if (selectedStock) {
      // 음수 입력 방지
      const validShares = Math.max(0, shares)
      const totalValue = validShares * selectedStock.price
      
      // 기존 포트폴리오 가치 계산 (이미 추가된 종목들)
      const existingPortfolioValue = formData.stockHoldings.reduce((sum, holding) => sum + holding.totalValue, 0)
      
      // 총 포트폴리오 가치 (기존 + 새 종목)
      const totalPortfolioValue = existingPortfolioValue + totalValue
      
      // 비중 계산 (총 포트폴리오 가치 기준)
      const weight = totalPortfolioValue > 0 ? (totalValue / totalPortfolioValue) * 100 : 0
      
      setNewStock(prev => ({
        ...prev,
        shares: validShares,
        totalValue,
        weight
      }))
    }
  }


  const handleAmountChange = (amount: number) => {
    if (selectedStock) {
      // 음수 입력 방지
      const validAmount = Math.max(0, amount)
      const shares = Math.floor(validAmount / selectedStock.price)
      const actualTotalValue = shares * selectedStock.price
      
      // 기존 포트폴리오 가치 계산 (이미 추가된 종목들)
      const existingPortfolioValue = formData.stockHoldings.reduce((sum, holding) => sum + holding.totalValue, 0)
      
      // 총 포트폴리오 가치 (기존 + 새 종목)
      const totalPortfolioValue = existingPortfolioValue + actualTotalValue
      
      // 비중 계산 (총 포트폴리오 가치 기준)
      const weight = totalPortfolioValue > 0 ? (actualTotalValue / totalPortfolioValue) * 100 : 0
      
      setNewStock(prev => ({
        ...prev,
        shares,
        totalValue: actualTotalValue,
        weight
      }))
    }
  }

  const handleSharesBlur = () => {
    if (selectedStock && newStock.shares) {
      handleSharesChange(newStock.shares)
    }
  }


  const handleAmountBlur = () => {
    if (selectedStock && newStock.totalValue) {
      handleAmountChange(newStock.totalValue)
    }
  }



  const addStock = () => {
    if (selectedStock && newStock.shares && newStock.shares > 0) {
      const stock: StockHolding = {
        symbol: selectedStock.symbol,
        name: selectedStock.name,
        shares: newStock.shares!,
        currentPrice: selectedStock.price,
        totalValue: newStock.totalValue!,
        change: 0,
        changePercent: selectedStock.changePercent,
        weight: 0 // Will be calculated after adding
      }
      
      setFormData(prev => {
        const newHoldings = [...prev.stockHoldings, stock]
        const newTotalValue = newHoldings.reduce((sum, s) => sum + s.totalValue, 0)
        
        // Calculate weights for all stocks based on total value
        const updatedHoldings = newHoldings.map(s => ({
          ...s,
          weight: newTotalValue > 0 ? (s.totalValue / newTotalValue) * 100 : 0
        }))
        
        return {
          ...prev,
          stockHoldings: updatedHoldings,
          // 자동 계산되는 포트폴리오 가치 업데이트
          totalValue: newTotalValue
        }
      })
      
      // Reset form
      setSelectedStock(null)
      setNewStock({
        symbol: "",
        name: "",
        shares: undefined,
        currentPrice: undefined,
        totalValue: undefined,
        change: undefined,
        changePercent: undefined,
        weight: undefined
      })
    }
  }

  const calculateTotalValue = () => {
    return formData.stockHoldings.reduce((sum, stock) => sum + stock.totalValue, 0)
  }

  const updateStockWeights = () => {
    const totalValue = calculateTotalValue()
    if (totalValue > 0) {
      setFormData(prev => ({
        ...prev,
        stockHoldings: prev.stockHoldings.map(stock => ({
          ...stock,
          weight: (stock.totalValue / totalValue) * 100
        }))
      }))
    }
  }

  const removeStock = (index: number) => {
    setFormData(prev => {
      const newHoldings = prev.stockHoldings.filter((_, i) => i !== index)
      const newTotalValue = newHoldings.reduce((sum, s) => sum + s.totalValue, 0)
      
      // Recalculate weights for remaining stocks based on total value
      const updatedHoldings = newHoldings.map(s => ({
        ...s,
        weight: newTotalValue > 0 ? (s.totalValue / newTotalValue) * 100 : 0
      }))
      
      return {
        ...prev,
        stockHoldings: updatedHoldings,
        // 자동 계산되는 포트폴리오 가치 업데이트
        totalValue: newTotalValue
      }
    })
  }

  const editStock = (index: number) => {
    setFormData(prev => {
      const target = prev.stockHoldings[index]
      if (!target) return prev

      // Remove the stock from holdings first
      const remaining = prev.stockHoldings.filter((_, i) => i !== index)
      const newTotalValue = remaining.reduce((sum, s) => sum + s.totalValue, 0)
      const updatedHoldings = remaining.map(s => ({
        ...s,
        weight: newTotalValue > 0 ? (s.totalValue / newTotalValue) * 100 : 0
      }))

      // Load into edit form
      setSelectedStock({
        symbol: target.symbol,
        name: target.name,
        price: target.currentPrice,
        change: target.change ?? 0,
        changePercent: target.changePercent ?? 0,
        volume: 0,
        marketCap: 0,
        sector: "",
      })
      setNewStock({
        symbol: target.symbol,
        name: target.name,
        shares: target.shares,
        currentPrice: target.currentPrice,
        totalValue: target.totalValue,
        change: target.change ?? 0,
        changePercent: target.changePercent ?? 0,
        weight: undefined,
      })

      return {
        ...prev,
        stockHoldings: updatedHoldings,
        totalValue: newTotalValue,
      }
    })
  }

  const addRuleItem = () => {
    if (newRuleItem.category.trim()) {
      // 유효성 검사
      if (!validateThreshold(newRuleItem.category, newRuleItem.threshold)) {
        alert("해당없음을 제외한 카테고리는 유효한 임계값을 입력해주세요. (예: 5%, 10, 1.5)")
        return
      }
      
      const ruleItem: RuleItem = {
        category: newRuleItem.category.trim(),
        threshold: newRuleItem.category === "해당없음" ? undefined : (newRuleItem.threshold.trim() || undefined),
        description: newRuleItem.description.trim() || undefined
      }
      
      setFormData(prev => ({
        ...prev,
        rule: {
          ...prev.rule,
          [newRuleItem.type]: [...prev.rule[newRuleItem.type], ruleItem]
        }
      }))
      
      setNewRuleItem({
        type: "rebalance",
        category: "",
        threshold: "",
        description: ""
      })
    }
  }

  const removeRuleItem = (type: keyof Omit<Rule, 'memo'>, index: number) => {
    setFormData(prev => ({
      ...prev,
      rule: {
        ...prev.rule,
        [type]: prev.rule[type].filter((_, i) => i !== index)
      }
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Validation
    if (!formData.name.trim()) {
      alert("포트폴리오 이름을 입력해주세요.")
      return
    }
    
    if (formData.stockHoldings.length === 0) {
      alert("최소 하나의 종목을 추가해주세요.")
      return
    }

    // Additional payload validation for diagnostics
    const invalidHoldings = formData.stockHoldings.filter(h => {
      const hasSymbol = typeof h.symbol === 'string' && h.symbol.trim().length > 0
      const validShares = typeof h.shares === 'number' && isFinite(h.shares) && h.shares > 0
      const validPrice = typeof h.currentPrice === 'number' && isFinite(h.currentPrice) && h.currentPrice > 0
      const validTotal = typeof h.totalValue === 'number' && isFinite(h.totalValue) && h.totalValue > 0
      return !hasSymbol || !validShares || !validPrice || !validTotal
    })
    if (invalidHoldings.length > 0) {
      console.error('[CreatePortfolio] Invalid holdings detected:', invalidHoldings)
      alert('종목 데이터가 올바르지 않습니다. 수량/현재가/평가금액을 확인하세요.')
      return
    }

    // Log payload for verification
    try {
      console.log('[CreatePortfolio] Request payload:', JSON.parse(JSON.stringify(formData)))
    } catch (_) {
      console.log('[CreatePortfolio] Request payload (raw):', formData)
    }
    
    setIsSubmitting(true)
    
    try {
      console.log("Creating portfolio:", formData)
      
      // API 호출
      const result = await createPortfolio(formData)
      
      console.log("Portfolio created successfully:", result)
      alert("포트폴리오가 성공적으로 생성되었습니다!")
      router.push("/portfolios")
    } catch (error: unknown) {
      console.error("Failed to create portfolio:", error)
      const errorMessage = error instanceof Error ? error.message : "알 수 없는 오류가 발생했습니다."
      alert(`포트폴리오 생성에 실패했습니다: ${errorMessage}`)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#f0f9f7]">
      <Header />
      
      <main className="max-w-4xl mx-auto pt-8 px-4 pb-8">
        <div className="mb-8">
          <Button
            variant="ghost"
            onClick={() => router.back()}
            className="mb-4 text-[#1f2937] hover:text-[#059669]"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            뒤로가기
          </Button>
          <h1 className="text-3xl font-bold text-[#1f2937]">새 포트폴리오 생성</h1>
          <p className="text-[#6b7280] mt-2">포트폴리오의 기본 정보와 전략을 설정하세요</p>
          {searchParams.get('template') === 'true' && (
            <div className="mt-4 p-4 bg-[#008485]/10 border border-[#008485]/20 rounded-lg">
              <p className="text-[#008485] font-medium">
                📋 템플릿에서 구성이 복사되었습니다. 원하는 대로 수정하여 나만의 포트폴리오를 만들어보세요!
              </p>
            </div>
          )}
          <div className="mt-2 text-sm text-[#6b7280]">
            백테스트를 생성하려면 상단의 포트폴리오 상세 내 백테스트 탭에서 "백테스트 추가"를 사용하세요.
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle className="text-xl text-[#1f2937]">기본 정보</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="name">포트폴리오 이름</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => handleInputChange("name", e.target.value)}
                  placeholder="포트폴리오 이름을 입력하세요"
                  required
                />
              </div>
              

              <div>
                <Label htmlFor="description">설명</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => handleInputChange("description", e.target.value)}
                  placeholder="포트폴리오에 대한 설명이나 목표를 입력해주세요"
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>

          {/* Stock Holdings */}
          <Card>
            <CardHeader>
              <CardTitle className="text-xl text-[#1f2937]">보유 종목</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Add New Stock */}
              <div className="p-4 bg-[#f8fafc] rounded-lg space-y-4">
                {/* Stock Search */}
                <div>
                  <Label className="text-base font-medium">종목 검색</Label>
                  <StockSearch
                    onSelectStock={handleStockSelect}
                    className="mt-2"
                    showPriceChange={false}
                  />
                  {selectedStock && (
                    <div className="mt-2 p-3 bg-white rounded-lg border">
                      <div className="flex justify-between items-center">
                        <div>
                          <div className="font-medium">{selectedStock.name} ({selectedStock.symbol})</div>
                          <div className="text-sm text-[#6b7280]">
                            현재가: {selectedStock.price.toLocaleString()}원
                            <span className={`ml-2 ${selectedStock.changePercent >= 0 ? 'text-red-500' : 'text-blue-500'}`}>
                              {selectedStock.changePercent >= 0 ? '+' : ''}{selectedStock.changePercent.toFixed(2)}%
                            </span>
                          </div>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setSelectedStock(null)
                            setNewStock({
                              symbol: "",
                              name: "",
                              shares: undefined,
                              currentPrice: undefined,
                              totalValue: undefined,
                              change: undefined,
                              changePercent: undefined,
                              weight: undefined
                            })
                          }}
                          className="text-red-500 hover:text-red-700"
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Input Fields */}
                {selectedStock && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="stockShares">보유수량 (주)</Label>
                      <Input
                        id="stockShares"
                        type="number"
                        min="0"
                        value={newStock.shares || ''}
                        onChange={(e) => setNewStock(prev => ({ ...prev, shares: Number(e.target.value) || 0 }))}
                        onBlur={handleSharesBlur}
                        placeholder="보유할 주식 수량을 입력하세요"
                      />
                    </div>
                    
                    <div>
                      <Label>투자금액 (원)</Label>
                      <Input
                        readOnly
                        value={newStock.totalValue && newStock.totalValue > 0 ? `${newStock.totalValue.toLocaleString()}원` : ''}
                        placeholder="투자금액을 입력하세요"
                      />
                    </div>
                  </div>
                )}

                {/* Add Button */}
                {selectedStock && newStock.shares && newStock.shares > 0 && (
                  <div className="flex justify-end">
                    <Button 
                      type="button" 
                      onClick={addStock} 
                      className="bg-[#008485] hover:bg-[#006b6c]"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      종목 추가
                    </Button>
                  </div>
                )}
              </div>

              {/* Portfolio Summary */}
              <div className="p-4 bg-[#f9fafb] rounded-lg border">
                <div className="flex justify-between items-center">
                  <div className="text-lg font-semibold text-[#1f2937]">
                    총 투자금액: {calculateTotalValue().toLocaleString()}원
                  </div>
                  <div className="text-sm text-[#6b7280]">
                    {formData.stockHoldings.length}개 종목
                  </div>
                </div>
              </div>

              {/* Stock List */}
              {formData.stockHoldings.length > 0 && (
                <div className="space-y-2">
                  <h4 className="font-medium text-[#1f2937]">추가된 종목</h4>
                  {formData.stockHoldings.map((stock, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-white rounded-lg border">
                      <div className="flex-1">
                        <div className="font-medium">{stock.name} ({stock.symbol})</div>
                        <div className="text-sm text-[#6b7280]">
                          {stock.shares}주 × {stock.currentPrice.toLocaleString()}원 = {stock.totalValue.toLocaleString()}원
                          <span className="ml-2 text-[#059669] font-medium">({stock.weight.toFixed(1)}%)</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => editStock(index)}
                          className="text-[#374151] hover:text-[#111827]"
                        >
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeStock(index)}
                          className="text-red-500 hover:text-red-700"
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* 매매 신호 */}
          <Card>
            <CardHeader>
              <CardTitle className="text-xl text-[#1f2937]">매매 신호</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* 메모 */}
              <div>
                <Label htmlFor="ruleMemo" className="text-base font-medium">메모</Label>
                <Textarea
                  id="ruleMemo"
                  value={formData.rule.memo}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    rule: { ...prev.rule, memo: e.target.value }
                  }))}
                  placeholder="매매 신호에 대한 추가 설명이나 메모를 입력하세요"
                  rows={3}
                  className="mt-2"
                />
              </div>

              {/* 리밸런싱 */}
              <div>
                <div className="flex items-center gap-2">
                  <Button 
                    type="button"
                    variant="ghost" 
                    size="sm" 
                    className="p-2"
                    onClick={() => toggleSection("rebalance")}
                  >
                    {openSections.rebalance ? (
                      <ChevronDown className="w-4 h-4" />
                    ) : (
                      <ChevronRight className="w-4 h-4" />
                    )}
                  </Button>
                  <Label className="text-base font-medium">리밸런싱</Label>
                </div>
                
                <AnimatePresence>
                  {openSections.rebalance && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3, ease: "easeInOut" }}
                      className="overflow-hidden"
                    >
                      <div className="mt-2 space-y-4">
                  <div className="p-4 bg-[#f8fafc] rounded-lg space-y-3">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <div>
                        <Label htmlFor="rebalanceCategory">카테고리</Label>
                        <Select
                          value={newRuleItem.type === "rebalance" ? newRuleItem.category : ""}
                          onValueChange={(value) => setNewRuleItem(prev => ({
                            ...prev,
                            type: "rebalance",
                            category: value
                          }))}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="카테고리 선택" />
                          </SelectTrigger>
                          <SelectContent>
                            {RULE_CATEGORIES.rebalance.map((category) => (
                              <SelectItem key={category} value={category}>
                                {category}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor="rebalanceThreshold">임계값</Label>
                        <Input
                          id="rebalanceThreshold"
                          value={newRuleItem.type === "rebalance" ? newRuleItem.threshold : ""}
                          onChange={(e) => setNewRuleItem(prev => ({
                            ...prev,
                            type: "rebalance",
                            threshold: e.target.value
                          }))}
                          placeholder={newRuleItem.category === "해당없음" ? "해당없음 선택 시 불필요" : "예: 5%, 10%"}
                          disabled={newRuleItem.category === "해당없음"}
                          className={newRuleItem.category === "해당없음" ? "bg-gray-100" : ""}
                        />
                      </div>
                      <div>
                        <Label htmlFor="rebalanceDescription">설명</Label>
                    <Input
                          id="rebalanceDescription"
                          value={newRuleItem.type === "rebalance" ? newRuleItem.description : ""}
                          onChange={(e) => setNewRuleItem(prev => ({
                            ...prev,
                            type: "rebalance",
                            description: e.target.value
                          }))}
                          placeholder="추가 설명"
                        />
                      </div>
                    </div>
                    <div className="flex justify-end">
                    <Button
                      type="button"
                      onClick={() => {
                          setNewRuleItem(prev => ({ ...prev, type: "rebalance" }))
                          addRuleItem()
                      }}
                        className="bg-[#008485] hover:bg-[#006b6c]"
                        disabled={!newRuleItem.category || newRuleItem.type !== "rebalance"}
                    >
                        <Plus className="w-4 h-4 mr-2" />
                      추가
                    </Button>
                  </div>
                  </div>
                  
                  {/* 추가된 리밸런싱 규칙들 */}
                  {formData.rule.rebalance.length > 0 && (
                    <div className="space-y-2">
                      {formData.rule.rebalance.map((item, index) => (
                        <div key={index} className="flex items-center justify-between p-3 bg-white rounded-lg border">
                          <div className="flex-1">
                            <div className="font-medium">{item.category}</div>
                            <div className="text-sm text-[#6b7280]">
                              {item.threshold && `임계값: ${item.threshold}`}
                              {item.description && ` | ${item.description}`}
                            </div>
                          </div>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => removeRuleItem("rebalance", index)}
                            className="text-red-500 hover:text-red-700"
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* 손절 */}
              <div>
                <div className="flex items-center gap-2">
                  <Button 
                    type="button"
                    variant="ghost" 
                    size="sm" 
                    className="p-2"
                    onClick={() => toggleSection("stopLoss")}
                  >
                    {openSections.stopLoss ? (
                      <ChevronDown className="w-4 h-4" />
                    ) : (
                      <ChevronRight className="w-4 h-4" />
                    )}
                  </Button>
                  <Label className="text-base font-medium">손절</Label>
                </div>
                
                <AnimatePresence>
                  {openSections.stopLoss && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3, ease: "easeInOut" }}
                      className="overflow-hidden"
                    >
                      <div className="mt-2 space-y-4">
                  <div className="p-4 bg-[#f8fafc] rounded-lg space-y-3">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <div>
                        <Label htmlFor="stopLossCategory">카테고리</Label>
                        <Select
                          value={newRuleItem.type === "stopLoss" ? newRuleItem.category : ""}
                          onValueChange={(value) => setNewRuleItem(prev => ({
                            ...prev,
                            type: "stopLoss",
                            category: value
                          }))}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="카테고리 선택" />
                          </SelectTrigger>
                          <SelectContent>
                            {RULE_CATEGORIES.stopLoss.map((category) => (
                              <SelectItem key={category} value={category}>
                                {category}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor="stopLossThreshold">임계값</Label>
                        <Input
                          id="stopLossThreshold"
                          value={newRuleItem.type === "stopLoss" ? newRuleItem.threshold : ""}
                          onChange={(e) => setNewRuleItem(prev => ({
                            ...prev,
                            type: "stopLoss",
                            threshold: e.target.value
                          }))}
                          placeholder={newRuleItem.category === "해당없음" ? "해당없음 선택 시 불필요" : "예: 1.5, 5%"}
                          disabled={newRuleItem.category === "해당없음"}
                          className={newRuleItem.category === "해당없음" ? "bg-gray-100" : ""}
                        />
                      </div>
                      <div>
                        <Label htmlFor="stopLossDescription">설명</Label>
                    <Input
                          id="stopLossDescription"
                          value={newRuleItem.type === "stopLoss" ? newRuleItem.description : ""}
                          onChange={(e) => setNewRuleItem(prev => ({
                            ...prev,
                            type: "stopLoss",
                            description: e.target.value
                          }))}
                          placeholder="추가 설명"
                        />
                      </div>
                    </div>
                    <div className="flex justify-end">
                    <Button
                      type="button"
                      onClick={() => {
                          setNewRuleItem(prev => ({ ...prev, type: "stopLoss" }))
                          addRuleItem()
                      }}
                        className="bg-[#008485] hover:bg-[#006b6c]"
                        disabled={!newRuleItem.category || newRuleItem.type !== "stopLoss"}
                    >
                        <Plus className="w-4 h-4 mr-2" />
                      추가
                    </Button>
                  </div>
                  </div>
                  
                  {/* 추가된 손절 규칙들 */}
                  {formData.rule.stopLoss.length > 0 && (
                    <div className="space-y-2">
                      {formData.rule.stopLoss.map((item, index) => (
                        <div key={index} className="flex items-center justify-between p-3 bg-white rounded-lg border">
                          <div className="flex-1">
                            <div className="font-medium">{item.category}</div>
                            <div className="text-sm text-[#6b7280]">
                              {item.threshold && `임계값: ${item.threshold}`}
                              {item.description && ` | ${item.description}`}
                            </div>
                          </div>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => removeRuleItem("stopLoss", index)}
                            className="text-red-500 hover:text-red-700"
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* 익절 */}
              <div>
                <div className="flex items-center gap-2">
                  <Button 
                    type="button"
                    variant="ghost" 
                    size="sm" 
                    className="p-2"
                    onClick={() => toggleSection("takeProfit")}
                  >
                    {openSections.takeProfit ? (
                      <ChevronDown className="w-4 h-4" />
                    ) : (
                      <ChevronRight className="w-4 h-4" />
                    )}
                  </Button>
                  <Label className="text-base font-medium">익절</Label>
                </div>
                
                <AnimatePresence>
                  {openSections.takeProfit && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3, ease: "easeInOut" }}
                      className="overflow-hidden"
                    >
                      <div className="mt-2 space-y-4">
                  <div className="p-4 bg-[#f8fafc] rounded-lg space-y-3">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <div>
                        <Label htmlFor="takeProfitCategory">카테고리</Label>
                        <Select
                          value={newRuleItem.type === "takeProfit" ? newRuleItem.category : ""}
                          onValueChange={(value) => setNewRuleItem(prev => ({
                            ...prev,
                            type: "takeProfit",
                            category: value
                          }))}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="카테고리 선택" />
                          </SelectTrigger>
                          <SelectContent>
                            {RULE_CATEGORIES.takeProfit.map((category) => (
                              <SelectItem key={category} value={category}>
                                {category}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor="takeProfitThreshold">임계값</Label>
                        <Input
                          id="takeProfitThreshold"
                          value={newRuleItem.type === "takeProfit" ? newRuleItem.threshold : ""}
                          onChange={(e) => setNewRuleItem(prev => ({
                            ...prev,
                            type: "takeProfit",
                            threshold: e.target.value
                          }))}
                          placeholder={newRuleItem.category === "해당없음" ? "해당없음 선택 시 불필요" : "예: 20%, 30%"}
                          disabled={newRuleItem.category === "해당없음"}
                          className={newRuleItem.category === "해당없음" ? "bg-gray-100" : ""}
                        />
                      </div>
              <div>
                        <Label htmlFor="takeProfitDescription">설명</Label>
                    <Input
                          id="takeProfitDescription"
                          value={newRuleItem.type === "takeProfit" ? newRuleItem.description : ""}
                          onChange={(e) => setNewRuleItem(prev => ({
                            ...prev,
                            type: "takeProfit",
                            description: e.target.value
                          }))}
                          placeholder="추가 설명"
                        />
                      </div>
                    </div>
                    <div className="flex justify-end">
                    <Button
                      type="button"
                      onClick={() => {
                          setNewRuleItem(prev => ({ ...prev, type: "takeProfit" }))
                          addRuleItem()
                      }}
                        className="bg-[#008485] hover:bg-[#006b6c]"
                        disabled={!newRuleItem.category || newRuleItem.type !== "takeProfit"}
                    >
                        <Plus className="w-4 h-4 mr-2" />
                      추가
                    </Button>
                  </div>
                  </div>
                  
                  {/* 추가된 익절 규칙들 */}
                  {formData.rule.takeProfit.length > 0 && (
                    <div className="space-y-2">
                      {formData.rule.takeProfit.map((item, index) => (
                        <div key={index} className="flex items-center justify-between p-3 bg-white rounded-lg border">
                          <div className="flex-1">
                            <div className="font-medium">{item.category}</div>
                            <div className="text-sm text-[#6b7280]">
                              {item.threshold && `임계값: ${item.threshold}`}
                              {item.description && ` | ${item.description}`}
                </div>
              </div>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => removeRuleItem("takeProfit", index)}
                            className="text-red-500 hover:text-red-700"
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </CardContent>
          </Card>

          {/* Submit Buttons */}
          <div className="flex justify-end gap-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.back()}
              size="lg"
            >
              취소
            </Button>
            <Button
              type="submit"
              size="lg"
              className="bg-[#008485] hover:bg-[#006b6c]"
              disabled={isSubmitting}
            >
              {isSubmitting ? "생성 중..." : "포트폴리오 생성"}
            </Button>
          </div>
        </form>
      </main>
      
      {/* 플로팅 챗봇 */}
      <FloatingChatbot context="create-portfolio" />
    </div>
  )
}
