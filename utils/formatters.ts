// Data formatting utilities for Fi-Match⁺

/**
 * Format number as Korean Won currency
 */
export const formatCurrency = (amount: number): string => {
  if (amount >= 100000000) {
    return `${(amount / 10000).toLocaleString()}만원`
  } else {
    return `${amount.toLocaleString()}원`
  }
}

/**
 * Format percentage with sign and color indication
 */
export const formatPercent = (value: number, showSign = true): string => {
  const formatted = new Intl.NumberFormat("ko-KR", {
    style: "percent",
    minimumFractionDigits: 1,
    maximumFractionDigits: 2,
    signDisplay: showSign ? "always" : "auto"
  }).format(value / 100)

  return formatted
}

/**
 * Format large numbers with Korean units
 */
export const formatNumber = (num: number): string => {
  if (num >= 100000000) {
    return `${(num / 100000000).toFixed(1)}억`
  } else if (num >= 10000) {
    return `${(num / 10000).toFixed(1)}만`
  } else {
    return num.toLocaleString()
  }
}

/**
 * Get color class based on change value
 */
export const getChangeColor = (change: number): string => {
  if (change > 0) return "text-red-500"    // 상승: 빨강
  if (change < 0) return "text-blue-500"   // 하강: 파랑
  return "text-gray-500"
}

/**
 * Format timestamp to readable date
 */
export const formatDate = (timestamp: number, format: "short" | "long" = "short"): string => {
  const date = new Date(timestamp)

  if (format === "long") {
    return date.toLocaleDateString("ko-KR", {
      year: "numeric",
      month: "long",
      day: "numeric",
      weekday: "long",
    })
  }

  return date.toLocaleDateString("ko-KR", {
    month: "2-digit",
    day: "2-digit",
  })
}

/**
 * Format time to HH:MM
 */
export const formatTime = (timestamp: number): string => {
  return new Date(timestamp).toLocaleTimeString("ko-KR", {
    hour: "2-digit",
    minute: "2-digit",
  })
}
