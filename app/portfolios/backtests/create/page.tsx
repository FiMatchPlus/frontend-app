"use client"

import { useRouter } from "next/navigation"
import Header from "@/components/header"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { motion, AnimatePresence } from "framer-motion"
import { useState } from "react"
import { ArrowLeft, Play, Plus, X, ChevronDown, ChevronRight } from "lucide-react"
import { CreateBacktestData, StopCondition } from "@/types/portfolio"

// 중지 조건 타입 옵션
const STOP_CONDITION_TYPES = [
  { value: 'stopLoss', label: '손절', description: '손실 한계선 설정' },
  { value: 'takeProfit', label: '익절', description: '수익 목표 달성' },
  { value: 'period', label: '기간 설정', description: '시작일과 종료일 설정' }
] as const

// 손절/익절 기준 옵션 (포트폴리오 생성 폼과 동일)
const STOP_LOSS_CRITERIA = ["베타 일정값 초과", "VaR 초과", "MDD 초과", "손실 한계선"]
const TAKE_PROFIT_CRITERIA = ["단일 종목 목표 수익률 달성"]

export default function CreateBacktestPage() {
  const router = useRouter()
  const [submitting, setSubmitting] = useState(false)
  const [formData, setFormData] = useState<CreateBacktestData>({
    name: "",
    memo: "",
    stopConditions: []
  })

  const [newStopCondition, setNewStopCondition] = useState<{
    type: 'stopLoss' | 'takeProfit' | 'period'
    criteria?: string
    value?: string
    startDate?: string
    endDate?: string
    description?: string
  }>({
    type: 'period',
    criteria: '',
    value: '',
    startDate: '',
    endDate: '',
    description: ''
  })

  const [openSections, setOpenSections] = useState<{
    stopLoss: boolean
    takeProfit: boolean
    period: boolean
  }>({
    stopLoss: false,
    takeProfit: false,
    period: true // 기간 설정은 기본으로 열어둠
  })

  const toggleSection = (section: keyof typeof openSections) => {
    setOpenSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }))
  }

  const handleInputChange = (field: keyof CreateBacktestData, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleStopConditionChange = (field: string, value: any) => {
    setNewStopCondition(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleStopConditionTypeChange = (type: 'stopLoss' | 'takeProfit' | 'period') => {
    setNewStopCondition(prev => {
      // 이미 같은 타입이면 초기화하지 않음
      if (prev.type === type) {
        return prev
      }
      
      return {
        ...prev,
        type,
        criteria: '',
        value: '',
        startDate: '',
        endDate: '',
        description: ''
      }
    })
  }

  const addStopCondition = () => {
    // 기간 설정의 경우 시작일과 종료일 검증
    if (newStopCondition.type === 'period') {
      if (!newStopCondition.startDate || !newStopCondition.endDate) {
        alert("기간 설정의 경우 시작일과 종료일을 모두 입력해주세요.")
        return
      }
      if (new Date(newStopCondition.startDate) >= new Date(newStopCondition.endDate)) {
        alert("시작일은 종료일보다 이전이어야 합니다.")
        return
      }
    }

    // 손절/익절의 경우 기준과 값 검증
    if (newStopCondition.type === 'stopLoss' || newStopCondition.type === 'takeProfit') {
      if (!newStopCondition.criteria?.trim()) {
        alert("손절/익절의 경우 기준을 선택해주세요.")
        return
      }
      if (!newStopCondition.value?.trim()) {
        alert("손절/익절의 경우 값을 입력해주세요.")
        return
      }
    }

    const stopCondition: StopCondition = {
      id: Date.now().toString(),
      type: newStopCondition.type,
      criteria: newStopCondition.criteria?.trim(),
      value: newStopCondition.value?.trim(),
      startDate: newStopCondition.startDate,
      endDate: newStopCondition.endDate,
      description: newStopCondition.description?.trim()
    }

    setFormData(prev => ({
      ...prev,
      stopConditions: [...prev.stopConditions, stopCondition]
    }))

    // 폼 초기화
    setNewStopCondition({
      type: 'period',
      criteria: '',
      value: '',
      startDate: '',
      endDate: '',
      description: ''
    })
  }

  const removeStopCondition = (id: string) => {
    setFormData(prev => ({
      ...prev,
      stopConditions: prev.stopConditions.filter(condition => condition.id !== id)
    }))
  }

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // 유효성 검사
    if (!formData.name.trim()) {
      alert("백테스트 이름을 입력해주세요.")
      return
    }

    // 기간 설정이 최소 하나는 있어야 함
    const hasPeriodCondition = formData.stopConditions.some(condition => condition.type === 'period')
    if (!hasPeriodCondition) {
      alert("기간 설정은 필수입니다. 최소 하나의 기간 설정을 추가해주세요.")
      return
    }

    setSubmitting(true)
    try {
      // TODO: integrate with backend API when available
      await new Promise((r) => setTimeout(r, 600))
      alert("백테스트 생성 요청이 제출되었습니다. 결과는 목록에서 확인하세요.")
      router.push("/portfolios")
    } finally {
      setSubmitting(false)
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
          <h1 className="text-3xl font-bold text-[#1f2937]">백테스트 생성</h1>
          <p className="text-[#6b7280] mt-2">중지 조건을 설정하여 백테스트를 실행하세요</p>
        </div>

        <form onSubmit={onSubmit} className="space-y-8">
          {/* 기본 정보 */}
          <Card>
            <CardHeader>
              <CardTitle className="text-xl text-[#1f2937]">기본 정보</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="name">백테스트 이름</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => handleInputChange("name", e.target.value)}
                  placeholder="백테스트 이름을 입력하세요"
                  required
                />
              </div>
              <div>
                <Label htmlFor="memo">메모</Label>
                <Textarea
                  id="memo"
                  value={formData.memo}
                  onChange={(e) => handleInputChange("memo", e.target.value)}
                  placeholder="백테스트에 대한 추가 설명이나 메모를 입력하세요"
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>

          {/* 중지 조건 설정 */}
          <Card>
            <CardHeader>
              <CardTitle className="text-xl text-[#1f2937]">중지 조건 설정</CardTitle>
              <p className="text-sm text-[#6b7280]">기간 설정은 필수이며, 손절/익절은 선택사항입니다.</p>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* 기간 설정 (필수) */}
              <div>
                <div className="flex items-center gap-2">
                  <Button 
                    type="button"
                    variant="ghost" 
                    size="sm" 
                    className="p-2"
                    onClick={() => toggleSection("period")}
                  >
                    {openSections.period ? (
                      <ChevronDown className="w-4 h-4" />
                    ) : (
                      <ChevronRight className="w-4 h-4" />
                    )}
                  </Button>
                  <Label className="text-base font-medium">기간 설정</Label>
                  <Badge variant="destructive" className="text-xs">필수</Badge>
                </div>
                
                <AnimatePresence>
                  {openSections.period && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3, ease: "easeInOut" }}
                      className="overflow-hidden"
                    >
                      <div className="mt-2 space-y-4">
                        <div className="p-4 bg-[#f8fafc] rounded-lg space-y-3">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            <div>
                              <Label htmlFor="startDate">시작 날짜</Label>
                              <Input
                                id="startDate"
                                type="date"
                                value={newStopCondition.type === 'period' ? newStopCondition.startDate || '' : ''}
                                onChange={(e) => {
                                  // 기간 설정 섹션에서는 타입 변경 없이 값만 업데이트
                                  setNewStopCondition(prev => ({
                                    ...prev,
                                    type: 'period',
                                    startDate: e.target.value
                                  }))
                                }}
                              />
                            </div>
                            <div>
                              <Label htmlFor="endDate">종료 날짜</Label>
                              <Input
                                id="endDate"
                                type="date"
                                value={newStopCondition.type === 'period' ? newStopCondition.endDate || '' : ''}
                                onChange={(e) => {
                                  // 기간 설정 섹션에서는 타입 변경 없이 값만 업데이트
                                  setNewStopCondition(prev => ({
                                    ...prev,
                                    type: 'period',
                                    endDate: e.target.value
                                  }))
                                }}
                              />
                            </div>
                          </div>
                          <div className="flex justify-end">
                            <Button
                              type="button"
                              onClick={() => {
                                setNewStopCondition(prev => ({ ...prev, type: 'period' }))
                                addStopCondition()
                              }}
                              className="bg-[#008485] hover:bg-[#006b6c]"
                              disabled={!newStopCondition.startDate || !newStopCondition.endDate || newStopCondition.type !== 'period'}
                            >
                              <Plus className="w-4 h-4 mr-2" />
                              기간 조건 추가
                            </Button>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* 손절 (선택) */}
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
                  <Badge variant="secondary" className="text-xs">선택</Badge>
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
                              <Label htmlFor="stopLossCriteria">기준</Label>
                              <Select
                                value={newStopCondition.type === 'stopLoss' ? newStopCondition.criteria || '' : ''}
                                onValueChange={(value) => {
                                  handleStopConditionTypeChange('stopLoss')
                                  handleStopConditionChange('criteria', value)
                                }}
                              >
                                <SelectTrigger>
                                  <SelectValue placeholder="기준 선택" />
                                </SelectTrigger>
                                <SelectContent>
                                  {STOP_LOSS_CRITERIA.map((criteria) => (
                                    <SelectItem key={criteria} value={criteria}>
                                      {criteria}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                            <div>
                              <Label htmlFor="stopLossValue">값</Label>
                              <Input
                                id="stopLossValue"
                                value={newStopCondition.type === 'stopLoss' ? newStopCondition.value || '' : ''}
                                onChange={(e) => {
                                  setNewStopCondition(prev => ({
                                    ...prev,
                                    type: 'stopLoss',
                                    value: e.target.value
                                  }))
                                }}
                                placeholder="예: -10%, 1.5"
                              />
                            </div>
                            <div>
                              <Label htmlFor="stopLossDescription">설명</Label>
                              <Input
                                id="stopLossDescription"
                                value={newStopCondition.type === 'stopLoss' ? newStopCondition.description || '' : ''}
                                onChange={(e) => {
                                  setNewStopCondition(prev => ({
                                    ...prev,
                                    type: 'stopLoss',
                                    description: e.target.value
                                  }))
                                }}
                                placeholder="추가 설명"
                              />
                            </div>
                          </div>
                          <div className="flex justify-end">
                            <Button
                              type="button"
                              onClick={() => {
                                setNewStopCondition(prev => ({ ...prev, type: 'stopLoss' }))
                                addStopCondition()
                              }}
                              className="bg-[#008485] hover:bg-[#006b6c]"
                              disabled={!newStopCondition.criteria || !newStopCondition.value || newStopCondition.type !== 'stopLoss'}
                            >
                              <Plus className="w-4 h-4 mr-2" />
                              손절 조건 추가
                            </Button>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* 익절 (선택) */}
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
                  <Badge variant="secondary" className="text-xs">선택</Badge>
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
                              <Label htmlFor="takeProfitCriteria">기준</Label>
                              <Select
                                value={newStopCondition.type === 'takeProfit' ? newStopCondition.criteria || '' : ''}
                                onValueChange={(value) => {
                                  handleStopConditionTypeChange('takeProfit')
                                  handleStopConditionChange('criteria', value)
                                }}
                              >
                                <SelectTrigger>
                                  <SelectValue placeholder="기준 선택" />
                                </SelectTrigger>
                                <SelectContent>
                                  {TAKE_PROFIT_CRITERIA.map((criteria) => (
                                    <SelectItem key={criteria} value={criteria}>
                                      {criteria}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                            <div>
                              <Label htmlFor="takeProfitValue">값</Label>
                              <Input
                                id="takeProfitValue"
                                value={newStopCondition.type === 'takeProfit' ? newStopCondition.value || '' : ''}
                                onChange={(e) => {
                                  setNewStopCondition(prev => ({
                                    ...prev,
                                    type: 'takeProfit',
                                    value: e.target.value
                                  }))
                                }}
                                placeholder="예: 20%, 30%"
                              />
                            </div>
                            <div>
                              <Label htmlFor="takeProfitDescription">설명</Label>
                              <Input
                                id="takeProfitDescription"
                                value={newStopCondition.type === 'takeProfit' ? newStopCondition.description || '' : ''}
                                onChange={(e) => {
                                  setNewStopCondition(prev => ({
                                    ...prev,
                                    type: 'takeProfit',
                                    description: e.target.value
                                  }))
                                }}
                                placeholder="추가 설명"
                              />
                            </div>
                          </div>
                          <div className="flex justify-end">
                            <Button
                              type="button"
                              onClick={() => {
                                setNewStopCondition(prev => ({ ...prev, type: 'takeProfit' }))
                                addStopCondition()
                              }}
                              className="bg-[#008485] hover:bg-[#006b6c]"
                              disabled={!newStopCondition.criteria || !newStopCondition.value || newStopCondition.type !== 'takeProfit'}
                            >
                              <Plus className="w-4 h-4 mr-2" />
                              익절 조건 추가
                            </Button>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* 추가된 중지 조건들 */}
              {formData.stopConditions.length > 0 && (
                <div className="space-y-2">
                  <h4 className="font-medium text-[#1f2937]">추가된 중지 조건</h4>
                  {formData.stopConditions.map((condition) => (
                    <div key={condition.id} className="flex items-center justify-between p-3 bg-white rounded-lg border">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <Badge variant={condition.type === 'period' ? 'destructive' : 'secondary'}>
                            {STOP_CONDITION_TYPES.find(t => t.value === condition.type)?.label}
                          </Badge>
                        </div>
                        <div className="text-sm text-[#6b7280]">
                          {condition.type === 'period' && condition.startDate && condition.endDate && 
                            `기간: ${condition.startDate} ~ ${condition.endDate}`
                          }
                          {condition.type !== 'period' && condition.criteria && condition.value && 
                            `${condition.criteria}: ${condition.value}`
                          }
                          {condition.description && ` | ${condition.description}`}
                        </div>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeStopCondition(condition.id)}
                        className="text-red-500 hover:text-red-700"
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* 제출 버튼 */}
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
              disabled={submitting}
            >
              <Play className="w-4 h-4 mr-2" />
              {submitting ? "생성 중..." : "백테스트 실행"}
            </Button>
          </div>
        </form>
      </main>
    </div>
  )
}


