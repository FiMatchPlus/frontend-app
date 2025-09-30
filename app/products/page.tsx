"use client"

import { useState, useMemo } from "react"
import { motion } from "framer-motion"
import { PageLayout } from "@/components/layout/PageLayout"
import { ProductList, ProductSearch, ProductFilterButtons, ProductPagination } from "@/components/products"
import { mockProducts, searchProducts, getProductsByRiskLevel } from "@/data/mockProductData"
import { ProductListCard as ProductListCardType } from "@/types/product"

export default function ProductsPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedRiskLevel, setSelectedRiskLevel] = useState<string | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 5

  const filteredProducts = useMemo(() => {
    let products = mockProducts

    // Apply risk level filter
    if (selectedRiskLevel) {
      products = getProductsByRiskLevel(selectedRiskLevel)
    }

    // Apply search filter
    if (searchQuery.trim()) {
      products = searchProducts(searchQuery)
    }

    // Convert to ProductListCard format
    return products.map(product => ({
      id: product.id,
      name: product.name,
      riskLevel: product.riskLevel,
      keywords: product.keywords,
      oneYearReturn: product.oneYearReturn,
      totalValue: product.totalValue,
      minInvestment: product.minInvestment
    }))
  }, [searchQuery, selectedRiskLevel])

  // Pagination logic
  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const paginatedProducts = filteredProducts.slice(startIndex, endIndex)

  // Reset to first page when filters change
  const handleSearch = (query: string) => {
    setSearchQuery(query)
    setCurrentPage(1)
  }

  const handleRiskLevelChange = (riskLevel: string | null) => {
    setSelectedRiskLevel(riskLevel)
    setCurrentPage(1)
  }

  const handlePageChange = (page: number) => {
    setCurrentPage(page)
  }

  return (
    <PageLayout>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="py-12 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto"
      >
        {/* Page Header */}
        <div className="mb-6">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">투자 상품</h1>
          <p className="text-gray-600 text-xl">
            다양한 투자 상품을 비교하고 선택해보세요
          </p>
        </div>

        {/* Search and Filter Section */}
        <div className="mb-6 space-y-6">
          <div className="flex flex-col sm:flex-row gap-6 items-start sm:items-center justify-between">
            <ProductSearch onSearch={handleSearch} />
            <ProductFilterButtons
              selectedRiskLevel={selectedRiskLevel}
              onRiskLevelChange={handleRiskLevelChange}
            />
          </div>

          {/* Results Summary */}
          <div className="text-base text-gray-600">
            총 <span className="font-semibold text-[#006b6c]">{filteredProducts.length}</span>개의 상품이 있습니다
            {searchQuery && (
              <span> (검색어: "{searchQuery}")</span>
            )}
            {selectedRiskLevel && (
              <span> (위험도: {selectedRiskLevel})</span>
            )}
            {totalPages > 1 && (
              <span> (페이지 {currentPage} / {totalPages})</span>
            )}
          </div>
        </div>

        {/* Product List Container with Fixed Height */}
        <div className="min-h-[600px] flex flex-col">
          <ProductList products={paginatedProducts} />
          
          {/* Spacer to push pagination to bottom */}
          <div className="flex-1"></div>
          
          {/* Pagination */}
          <ProductPagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={handlePageChange}
          />
        </div>
      </motion.div>
    </PageLayout>
  )
}
