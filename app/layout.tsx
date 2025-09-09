import type React from "react"
import type { Metadata } from "next"
import { GeistSans } from "geist/font/sans"
import { GeistMono } from "geist/font/mono"
import "./globals.css"
import { StockProvider } from "@/contexts/StockContext"

export const metadata: Metadata = {
  title: "StockOne19 - 주식 포트폴리오 관리",
  description: "스마트한 주식 투자를 위한 포트폴리오 관리 플랫폼",
  generator: "v0.app",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="ko" className={`${GeistSans.variable} ${GeistMono.variable}`}>
      <body className="font-sans">
        <StockProvider>{children}</StockProvider>
      </body>
    </html>
  )
}
