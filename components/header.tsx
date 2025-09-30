"use client"

import { cn } from "@/lib/utils"
import { motion } from "framer-motion"
import Link from "next/link"
import { useState } from "react"
import { Menu } from "lucide-react"
import { useIsMobile } from "@/hooks/use-mobile"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"

function Header() {
  const [isOpen, setIsOpen] = useState(false)
  const isMobile = useIsMobile()

  const navigationItems = [
    { href: "/products", label: "상품" },
    { href: "/stocks", label: "종목 정보" },
    { href: "/portfolios", label: "포트폴리오" },
  ]

  return (
    <motion.header
      initial={{ y: -100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
      className="bg-white/95 backdrop-blur-sm shadow-lg"
    >
      <div className="max-w-6xl mx-auto flex justify-between items-center px-8 py-4">
        {/* Logo */}
        <Link href="/">
          <motion.div
            whileHover={{ scale: 1.05 }}
            className="text-3xl font-black text-[#009178] flex items-center gap-2 cursor-pointer"
          >
            Fi-Match<span className="text-[#DC321E]">⁺</span>
          </motion.div>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:block">
          <ul className="flex gap-16 list-none">
            {navigationItems.map((item) => (
              <li key={item.href}>
                <motion.div whileHover={{ scale: 1.1 }}>
                  {item.href.startsWith("/") ? (
                    <Link
                      href={item.href}
                      className="text-[#374151] font-semibold text-lg hover:text-[#009178] transition-all duration-300"
                    >
                      {item.label}
                    </Link>
                  ) : (
                    <a
                      href={item.href}
                      className="text-[#374151] font-semibold text-lg hover:text-[#009178] transition-all duration-300"
                    >
                      {item.label}
                    </a>
                  )}
                </motion.div>
              </li>
            ))}
          </ul>
        </nav>

        {/* Mobile Menu Button */}
        <div className="md:hidden">
          <Sheet open={isOpen} onOpenChange={setIsOpen}>
            <SheetTrigger asChild>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="p-2 text-[#374151] hover:text-[#008485] transition-colors"
              >
                <Menu size={24} />
              </motion.button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[300px] sm:w-[400px]">
              <SheetHeader>
                <SheetTitle className="text-[#009178] text-xl font-bold">Fi-Match<span className="text-[#DC321E]">⁺</span></SheetTitle>
              </SheetHeader>
              <nav className="mt-8">
                <ul className="space-y-6">
                  {navigationItems.map((item) => (
                    <li key={item.href}>
                      {item.href.startsWith("/") ? (
                        <Link
                          href={item.href}
                          onClick={() => setIsOpen(false)}
                          className="block text-[#374151] font-semibold text-lg hover:text-[#009178] transition-colors py-2"
                        >
                          {item.label}
                        </Link>
                      ) : (
                        <a
                          href={item.href}
                          onClick={() => setIsOpen(false)}
                          className="block text-[#374151] font-semibold text-lg hover:text-[#009178] transition-colors py-2"
                        >
                          {item.label}
                        </a>
                      )}
                    </li>
                  ))}
                </ul>
                <div className="mt-8 space-y-4">
                  <div className="text-center py-3">
                    <p className="text-black font-semibold text-lg">남지현님 환영합니다!</p>
                  </div>
                  <Link href="/login">
                    <button
                      onClick={() => setIsOpen(false)}
                      className="w-full px-5 py-3 border border-[#d1ebe7] rounded-lg font-semibold text-lg text-[#374151] hover:bg-[#f0f9f7] transition-all"
                    >
                      로그아웃
                    </button>
                  </Link>
                </div>
              </nav>
            </SheetContent>
          </Sheet>
        </div>

        {/* Desktop User Section */}
        <div className="hidden md:flex items-center gap-4">
          <div className="text-black font-semibold text-lg">
            남지현님 환영합니다!
          </div>
          <Link href="/login">
            <motion.button
              whileHover={{ y: -2, scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="px-5 py-3 border border-[#d1ebe7] rounded-lg font-semibold text-lg text-[#374151] hover:bg-[#f0f9f7] transition-all"
            >
              로그아웃
            </motion.button>
          </Link>
        </div>
      </div>
    </motion.header>
  )
}

export { Header }
export default Header
