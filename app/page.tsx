"use client"

import Header from "@/components/header"
import { motion, AnimatePresence } from "framer-motion"
import Link from "next/link"
import { ArrowRight, BarChart3, TrendingUp, Shield, Zap, Users, FileText, Target, ChevronLeft, ChevronRight } from "lucide-react"
import { useState, useEffect } from "react"

const features = [
  {
    icon: <TrendingUp className="w-8 h-8" />,
    title: "포트폴리오 관리",
    description: "여러 종목을 한 곳에서 관리하고 비중을 조절하며 수익률을 추적할 수 있어요"
  },
  {
    icon: <Zap className="w-8 h-8" />,
    title: "백테스트 분석",
    description: "과거 데이터로 내 투자 전략을 미리 검증해보고 예상 수익률을 확인하세요"
  },
  {
    icon: <FileText className="w-8 h-8" />,
    title: "투자 성향 리포팅",
    description: "MPT와 CAPM 이론을 기반으로 실제 포트폴리오 구성을 분석하여 설문지가 아닌 데이터로 투자성향을 과학적으로 진단해드려요"
  },
  {
    icon: <Target className="w-8 h-8" />,
    title: "모델 포트폴리오 제공",
    description: "전문가가 설계한 다양한 투자 전략과 모델 포트폴리오를 참고하여 투자하세요"
  }
]

export default function LandingPage() {
  const [currentSection, setCurrentSection] = useState(0)
  const totalSections = 5

  const nextSection = () => {
    setCurrentSection((prev) => (prev + 1) % totalSections)
  }

  const prevSection = () => {
    setCurrentSection((prev) => (prev - 1 + totalSections) % totalSections)
  }

  // 키보드 이벤트 처리
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'ArrowLeft') {
        prevSection()
      } else if (event.key === 'ArrowRight') {
        nextSection()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  const slideVariants = {
    enter: (direction: number) => ({
      x: direction > 0 ? 1000 : -1000,
      opacity: 0
    }),
    center: {
      zIndex: 1,
      x: 0,
      opacity: 1
    },
    exit: (direction: number) => ({
      zIndex: 0,
      x: direction < 0 ? 1000 : -1000,
      opacity: 0
    })
  }

  const swipeConfidenceThreshold = 10000
  const swipePower = (offset: number, velocity: number) => {
    return Math.abs(offset) * velocity
  }

  const SectionWrapper = ({ children, sectionKey }: { children: React.ReactNode, sectionKey: string }) => (
    <motion.section
      key={sectionKey}
      custom={currentSection}
      variants={slideVariants}
      initial="enter"
      animate="center"
      exit="exit"
      transition={{
        x: { type: "spring", stiffness: 300, damping: 30 },
        opacity: { duration: 0.2 }
      }}
      drag="x"
      dragConstraints={{ left: 0, right: 0 }}
      dragElastic={1}
      onDragEnd={(e, { offset, velocity }) => {
        const swipe = swipePower(offset.x, velocity.x)

        if (swipe < -swipeConfidenceThreshold) {
          nextSection()
        } else if (swipe > swipeConfidenceThreshold) {
          prevSection()
        }
      }}
      className="absolute inset-0 flex flex-col justify-center px-8 py-4 overflow-y-auto"
    >
      <div className="max-w-6xl mx-auto w-full flex-1 flex items-center">
        {children}
      </div>
      
      {/* Section Indicators */}
      <div className="flex justify-center pb-8">
        <div className="flex gap-3">
          {Array.from({ length: totalSections }).map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentSection(index)}
              className={`w-3 h-3 rounded-full transition-all ${
                index === currentSection 
                  ? 'bg-[#009178] scale-125' 
                  : 'bg-gray-400/50 hover:bg-gray-400/80'
              }`}
            />
          ))}
        </div>
      </div>
    </motion.section>
  )

  return (
    <div className="h-screen bg-[#f0f9f7] flex flex-col overflow-hidden">
      <Header />

      {/* Navigation Buttons */}
      <div className="fixed top-1/2 left-4 z-50 transform -translate-y-1/2">
        <button
          onClick={prevSection}
          className="bg-white/80 hover:bg-white text-[#009178] p-3 rounded-full shadow-lg transition-all hover:scale-110"
        >
          <ChevronLeft className="w-6 h-6" />
        </button>
      </div>
      
      <div className="fixed top-1/2 right-4 z-50 transform -translate-y-1/2">
        <button
          onClick={nextSection}
          className="bg-white/80 hover:bg-white text-[#009178] p-3 rounded-full shadow-lg transition-all hover:scale-110"
        >
          <ChevronRight className="w-6 h-6" />
        </button>
      </div>

      {/* Sections Container */}
      <div className="relative flex-1 pt-8">
        <AnimatePresence initial={false} custom={currentSection}>
          {/* Section 1: Hero */}
          {currentSection === 0 && (
            <SectionWrapper sectionKey="hero">
              <div className="w-full">
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-center"
                >
                  {/* 표어 */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, delay: 0.1 }}
                    className="text-[#009178] text-5xl font-bold mb-4"
                  >
                    나누고 맞추고 플러스로 키우다
                  </motion.div>
                  
                  <motion.h1 
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, delay: 0.2 }}
                    className="text-5xl font-bold text-[#1f2937] mb-6 leading-tight"
                  >
                    <span className="text-[#009178]">Fi-Match<span className="text-[#DC321E]">⁺</span></span>
                  </motion.h1>
                  
                  <motion.p 
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, delay: 0.4 }}
                    className="text-lg text-[#6b7280] mb-8 max-w-3xl mx-auto leading-relaxed"
                  >
                    <strong>Fi</strong>(파이)로 자산을 나누고, 최적의 조합을 <strong>Match</strong>해서<br />
                    수익을 키워<strong>(+)</strong>나가는 스마트한 포트폴리오 플랫폼
                  </motion.p>

          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.6 }}
            className="flex flex-col sm:flex-row gap-6 justify-center items-center"
          >
            <Link href="/login">
              <motion.button
                whileHover={{ y: -3, scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="bg-[#009178] text-white px-10 py-4 rounded-xl font-semibold text-xl hover:bg-[#004e42] transition-all shadow-lg flex items-center gap-3"
              >
                무료로 시작하기
                <ArrowRight className="w-6 h-6" />
              </motion.button>
            </Link>
            
            <Link href="/portfolios">
              <motion.button
                whileHover={{ y: -3, scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="border-2 border-[#009178] text-[#009178] px-10 py-4 rounded-xl font-semibold text-xl hover:bg-[#009178] hover:text-white transition-all"
              >
                포트폴리오 보기
              </motion.button>
            </Link>
          </motion.div>
        </motion.div>
              </div>
            </SectionWrapper>
          )}

          {/* Section 2: Features */}
          {currentSection === 1 && (
            <SectionWrapper sectionKey="features">
              <div className="w-full">
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8 }}
                className="text-center mb-6"
        >
                <h2 className="text-3xl font-bold text-[#1f2937] mb-3">
            <span className="text-[#009178]">Fi-Match<span className="text-[#DC321E]">⁺</span></span>로 뭘 할 수 있나요?
          </h2>
          <p className="text-lg text-[#6b7280] max-w-3xl mx-auto">
            투자 초보자도 전문가처럼! 복잡한 투자 관리를 쉽고 체계적으로 할 수 있어요
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {features.map((feature, index) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: index * 0.1 }}
              whileHover={{ y: -5, scale: 1.02 }}
              className="bg-white/95 backdrop-blur-sm rounded-2xl p-6 shadow-xl border border-[#009178] hover:shadow-2xl transition-all"
            >
              <div className="text-[#009178] mb-3">
                {feature.icon}
              </div>
              <h3 className="text-xl font-bold text-[#1f2937] mb-3">{feature.title}</h3>
              <p className="text-base text-[#6b7280] leading-relaxed">{feature.description}</p>
            </motion.div>
          ))}
        </div>
                </div>
            </SectionWrapper>
          )}

          {/* Section 3: Analysis */}
          {currentSection === 2 && (
            <SectionWrapper sectionKey="analysis">
              <div className="w-full">
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8 }}
                className="text-center mb-12"
          >
                <h2 className="text-4xl font-bold text-[#1f2937] mb-4">
              <span className="text-[#009178]">과학적 데이터</span>로 알아보는 나의 투자 분석
            </h2>
            <p className="text-xl text-[#6b7280] max-w-3xl mx-auto">
              설문지가 아닌 실제 포트폴리오 구성으로 투자 성향부터 전문 분석까지 한 번에!
            </p>
          </motion.div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Investment Style Analysis */}
            <motion.div
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.8, delay: 0.2 }}
              className="bg-white rounded-2xl p-8 shadow-xl border border-[#009178]"
            >
              <h3 className="text-2xl font-bold text-[#1f2937] mb-6 text-center">투자 성향 진단</h3>
              <div className="space-y-4">
                <div className="p-4 bg-[#f0f9f7] rounded-lg">
                  <h4 className="font-bold text-[#1f2937] mb-2">위험 선호도</h4>
                  <p className="text-[#6b7280] text-sm">안전 vs 고위험 자산 비중으로 리스크 성향 파악</p>
                </div>
                <div className="p-4 bg-[#f0f9f7] rounded-lg">
                  <h4 className="font-bold text-[#1f2937] mb-2">시장 민감도</h4>
                  <p className="text-[#6b7280] text-sm">폭락장에서 내 포트폴리오 반응 정도 측정</p>
                </div>
                <div className="p-4 bg-[#f0f9f7] rounded-lg">
                  <h4 className="font-bold text-[#1f2937] mb-2">포트폴리오 효율성</h4>
                  <p className="text-[#6b7280] text-sm">위험 대비 수익률 최적화 수준 분석</p>
                </div>
              </div>
            </motion.div>

            {/* Performance Analysis */}
            <motion.div
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.8, delay: 0.4 }}
              className="bg-white rounded-2xl p-8 shadow-xl border border-[#009178]"
            >
              <h3 className="text-2xl font-bold text-[#1f2937] mb-6 text-center">성과 분석</h3>
              <div className="space-y-4">
                <div className="p-4 bg-[#f0f9f7] rounded-lg">
                  <h4 className="font-bold text-[#1f2937] mb-2">시장 대비 성과</h4>
                  <p className="text-[#6b7280] text-sm">KOSPI 대비 내 투자 전략의 우수성 확인</p>
                </div>
                <div className="p-4 bg-[#f0f9f7] rounded-lg">
                  <h4 className="font-bold text-[#1f2937] mb-2">위험 조정 수익률</h4>
                  <p className="text-[#6b7280] text-sm">샤프 비율로 효율적 수익 창출 여부 분석</p>
                </div>
                <div className="p-4 bg-[#f0f9f7] rounded-lg">
                  <h4 className="font-bold text-[#1f2937] mb-2">종목 기여도</h4>
                  <p className="text-[#6b7280] text-sm">어떤 주식이 수익에 도움이 되었는지 분석</p>
                </div>
              </div>
            </motion.div>

            {/* Risk Analysis */}
            <motion.div
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.8, delay: 0.6 }}
              className="bg-white rounded-2xl p-8 shadow-xl border border-[#009178]"
            >
              <h3 className="text-2xl font-bold text-[#1f2937] mb-6 text-center">리스크 분석</h3>
              <div className="space-y-4">
                <div className="p-4 bg-[#f0f9f7] rounded-lg">
                  <h4 className="font-bold text-[#1f2937] mb-2">최대 손실 예상</h4>
                  <p className="text-[#6b7280] text-sm">최악의 상황에서 예상되는 최대 낙폭</p>
                </div>
                <div className="p-4 bg-[#f0f9f7] rounded-lg">
                  <h4 className="font-bold text-[#1f2937] mb-2">변동성 측정</h4>
                  <p className="text-[#6b7280] text-sm">포트폴리오의 가격 변동 정도 수치화</p>
                </div>
                <div className="p-4 bg-[#f0f9f7] rounded-lg">
                  <h4 className="font-bold text-[#1f2937] mb-2">하방 위험</h4>
                  <p className="text-[#6b7280] text-sm">손실이 날 때만의 위험도 별도 측정</p>
                </div>
              </div>
            </motion.div>
          </div>
              </div>
            </SectionWrapper>
          )}

          {/* Section 4: How to Use */}
          {currentSection === 3 && (
            <SectionWrapper sectionKey="howto">
              <div className="w-full">
                <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8 }}
                className="text-center mb-12"
        >
                <h2 className="text-4xl font-bold text-[#1f2937] mb-4">
            어떻게 사용하나요?
          </h2>
          <p className="text-xl text-[#6b7280] max-w-3xl mx-auto">
            3단계만 따라하면 바로 투자 전문가처럼 포트폴리오를 관리할 수 있어요
          </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.2 }}
            className="text-center"
          >
            <div className="w-16 h-16 bg-[#009178] text-white rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-6">1</div>
            <h3 className="text-2xl font-bold text-[#1f2937] mb-4">종목 검색 & 차트 확인</h3>
            <p className="text-lg text-[#6b7280] leading-relaxed">
              관심 있는 종목을 검색하고 실시간 차트로 주가 흐름을 확인해보세요. 
              1일부터 1년까지 다양한 기간으로 볼 수 있어요.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.4 }}
            className="text-center"
          >
            <div className="w-16 h-16 bg-[#009178] text-white rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-6">2</div>
            <h3 className="text-2xl font-bold text-[#1f2937] mb-4">포트폴리오 만들기</h3>
            <p className="text-lg text-[#6b7280] leading-relaxed">
              마음에 드는 종목들을 선택하고 투자 비중을 정해서 나만의 포트폴리오를 만들어보세요. 
              파이 차트로 한눈에 확인할 수 있어요.
            </p>
          </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 50 }}
                animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.6 }}
            className="text-center"
          >
            <div className="w-16 h-16 bg-[#009178] text-white rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-6">3</div>
            <h3 className="text-2xl font-bold text-[#1f2937] mb-4">백테스트로 검증하기</h3>
            <p className="text-lg text-[#6b7280] leading-relaxed">
              내 투자 전략이 과거에 어떤 성과를 냈을지 미리 시뮬레이션해보고 
              수익률과 위험도를 확인한 후 투자하세요.
            </p>
          </motion.div>
        </div>
              </div>
            </SectionWrapper>
          )}

          {/* Section 5: CTA */}
          {currentSection === 4 && (
            <SectionWrapper sectionKey="cta">
              <div className="w-full">
                <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8 }}
                className="bg-gradient-to-r from-[#009178] to-[#004e42] rounded-3xl p-12 text-center text-white shadow-2xl"
        >
                <h2 className="text-4xl font-bold mb-4">투자 관리, 이제 더 쉽게!</h2>
                <p className="text-lg mb-6 opacity-90">
            복잡한 투자 분석이 클릭 몇 번으로! 지금 바로 체험해보세요
          </p>
          
          <div className="flex flex-col sm:flex-row gap-6 justify-center items-center">
            <Link href="/login">
              <motion.button
                whileHover={{ y: -3, scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="bg-white text-[#009178] px-10 py-4 rounded-xl font-semibold text-xl hover:bg-gray-100 transition-all shadow-lg flex items-center gap-3"
              >
                <Users className="w-6 h-6" />
                회원가입하고 시작하기
              </motion.button>
            </Link>
            
            <Link href="/stocks">
              <motion.button
                whileHover={{ y: -3, scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="border-2 border-white text-white px-10 py-4 rounded-xl font-semibold text-xl hover:bg-white hover:text-[#009178] transition-all"
              >
                종목 차트 먼저 보기
              </motion.button>
            </Link>
          </div>

      {/* Footer */}
                <div className="mt-12 pt-6 border-t border-white/20">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="mb-6 md:mb-0">
                      <h3 className="text-3xl font-bold mb-2">Fi-Match<span className="text-[#DC321E]">⁺</span></h3>
                      <p className="text-white/70">스마트한 투자의 시작</p>
            </div>
            
            <div className="flex gap-8">
                      <Link href="/products" className="hover:text-white/80 transition-colors">상품</Link>
                      <Link href="/stocks" className="hover:text-white/80 transition-colors">종목 정보</Link>
                      <Link href="/portfolios" className="hover:text-white/80 transition-colors">포트폴리오</Link>
                    </div>
                  </div>
                  
                  <div className="mt-6 pt-4 text-center border-t border-white/20">
                    <p className="text-white/70">© 2025 Fi-Match<span className="text-[#DC321E]">⁺</span>. All rights reserved.</p>
                  </div>
              </div>
                </motion.div>
              </div>
            </SectionWrapper>
          )}
        </AnimatePresence>
      </div>

      {/* Simplified Footer */}
      <footer className="bg-[#004e42] text-white">
        <div className="py-8">
          <div className="max-w-6xl mx-auto px-8">
            {/* Main Footer Content */}
            <div className="flex flex-col md:flex-row justify-between items-center mb-6">
              {/* Company Info */}
              <div className="mb-4 md:mb-0 text-center md:text-left">
                <h3 className="text-2xl font-bold mb-2">Fi-Match<span className="text-[#DC321E]">⁺</span></h3>
                <p className="text-gray-300 text-sm">
                  나누고 맞추고 플러스로 키우다
                </p>
              </div>

              {/* Contact Info */}
              <div className="text-center md:text-right text-sm text-gray-300">
                <p className="font-semibold text-white mb-1">고객센터</p>
                <p>1588-0000</p>
                <p className="text-xs text-gray-400">평일 09:00~18:00</p>
              </div>
            </div>

            {/* Bottom Section */}
            <div className="border-t border-gray-600 pt-4">
              <div className="flex flex-col md:flex-row justify-between items-center text-xs text-gray-400">
                <div className="mb-2 md:mb-0">
                  <p>© 2025 Fi-Match<span className="text-[#DC321E]">⁺</span>. All rights reserved.</p>
                </div>
                <div className="flex gap-4">
                  <Link href="#" className="hover:text-gray-300 transition-colors">개인정보처리방침</Link>
                  <Link href="#" className="hover:text-gray-300 transition-colors">이용약관</Link>
                  <Link href="#" className="hover:text-gray-300 transition-colors">투자유의사항</Link>
                </div>
              </div>
              
              <div className="mt-3 text-xs text-gray-500 leading-relaxed text-center md:text-left">
                <p>투자 위험 고지: 모든 투자에는 원금 손실의 위험이 있습니다. 과거 수익률이 미래 수익률을 보장하지 않습니다.</p>
                <p>본 서비스는 투자 참고용이며, 투자 결정은 본인의 판단과 책임하에 이루어져야 합니다.</p>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}