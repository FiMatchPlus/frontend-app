// Data formatting utilities for StockOne19

/**
 * Format number as Korean Won currency
 */
export const formatCurrency = (amount: number): string => {
  if (amount >= 1000000000000) {
    return `${(amount / 1000000000000).toFixed(1)}조원`
  } else if (amount >= 100000000) {
    return `${(amount / 100000000).toFixed(1)}억원`
  } else if (amount >= 10000) {
    return `${(amount / 10000).toFixed(1)}만원`
  } else {
    return `${amount.toLocaleString()}원`
  }
}

/**
 * Format percentage with sign and color indication
 */
export const formatPercent = (percent: number, includeSign = true): string => {
  const sign = includeSign && percent > 0 ? "+" : ""
  return `${sign}${percent.toFixed(2)}%`
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
  if (change > 0) return "text-green-500"
  if (change < 0) return "text-red-500"
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
