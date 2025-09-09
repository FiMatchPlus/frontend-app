"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { motion } from "framer-motion"
import { PageLayout } from "@/components/layout/PageLayout"
import { 
  ProductDetailHeader, 
  ProductHistoryChart, 
  ProductDetailMetrics,
  PortfolioHoldings
} from "@/components/products"
import { getProductById } from "@/data/mockProductData"
import { ModelPortfolio } from "@/types/product"
import { LoadingSpinner } from "@/components/ui/LoadingSpinner"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"

export default function ProductDetailPage() {
  const params = useParams()
  const router = useRouter()
  const [product, setProduct] = useState<ModelPortfolio | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const productId = params.id as string
    const foundProduct = getProductById(productId)
    
    if (foundProduct) {
      setProduct(foundProduct)
    }
    setIsLoading(false)
  }, [params.id])

  if (isLoading) {
    return (
      <PageLayout>
        <div className="flex justify-center items-center py-12">
          <LoadingSpinner size="lg" />
        </div>
      </PageLayout>
    )
  }

  if (!product) {
    return (
      <PageLayout>
        <div className="text-center py-12">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">상품을 찾을 수 없습니다</h1>
          <p className="text-gray-600 mb-6">요청하신 상품이 존재하지 않거나 삭제되었습니다.</p>
          <Button 
            onClick={() => router.push('/products')}
            className="bg-[#008485] hover:bg-[#006b6c]"
          >
            상품 목록으로 돌아가기
          </Button>
        </div>
      </PageLayout>
    )
  }

  return (
    <PageLayout>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="py-12 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto"
      >
        {/* Back Button */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="mb-6 max-w-6xl mx-auto"
        >
          <Button
            variant="ghost"
            onClick={() => router.back()}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 text-base px-3 py-2"
          >
            <ArrowLeft className="w-4 h-4" />
            뒤로가기
          </Button>
        </motion.div>

        {/* Product Detail Header */}
        <ProductDetailHeader product={product} />

        {/* Product Metrics */}
        <div className="mt-10">
          <ProductDetailMetrics product={product} />
        </div>

        {/* Portfolio Holdings */}
        <div className="mt-10">
          <PortfolioHoldings holdings={product.holdings} />
        </div>

        {/* History Chart */}
        <div className="mt-10">
          <ProductHistoryChart dailyHistory={product.dailyHistory} />
        </div>
      </motion.div>
    </PageLayout>
  )
}
