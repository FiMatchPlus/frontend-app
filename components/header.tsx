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
    { href: "#guide", label: "사용 설명서" },
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
            className="text-3xl font-bold text-[#008485] flex items-center gap-2 cursor-pointer"
          >
            StockOne19
          </motion.div>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:block">
          <ul className="flex gap-16 list-none">
            {navigationItems.map((item) => (
              <li key={item.href}>
                <motion.div whileHover={{ y: -2 }}>
                  {item.href.startsWith("/") ? (
                    <Link
                      href={item.href}
                      className={cn(
                        "text-[#374151] font-semibold text-lg hover:text-[#008485] transition-colors",
                        "relative after:absolute after:bottom-0 after:left-0 after:w-0 after:h-0.5",
                        "after:bg-[#008485] after:transition-all after:duration-300 hover:after:w-full",
                      )}
                    >
                      {item.label}
                    </Link>
                  ) : (
                    <a
                      href={item.href}
                      className={cn(
                        "text-[#374151] font-semibold text-lg hover:text-[#008485] transition-colors",
                        "relative after:absolute after:bottom-0 after:left-0 after:w-0 after:h-0.5",
                        "after:bg-[#008485] after:transition-all after:duration-300 hover:after:w-full",
                      )}
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
                <SheetTitle className="text-[#008485] text-xl font-bold">StockOne19</SheetTitle>
              </SheetHeader>
              <nav className="mt-8">
                <ul className="space-y-6">
                  {navigationItems.map((item) => (
                    <li key={item.href}>
                      {item.href.startsWith("/") ? (
                        <Link
                          href={item.href}
                          onClick={() => setIsOpen(false)}
                          className="block text-[#374151] font-semibold text-lg hover:text-[#008485] transition-colors py-2"
                        >
                          {item.label}
                        </Link>
                      ) : (
                        <a
                          href={item.href}
                          onClick={() => setIsOpen(false)}
                          className="block text-[#374151] font-semibold text-lg hover:text-[#008485] transition-colors py-2"
                        >
                          {item.label}
                        </a>
                      )}
                    </li>
                  ))}
                </ul>
                <div className="mt-8 space-y-4">
                  <button
                    onClick={() => setIsOpen(false)}
                    className="w-full px-5 py-3 border border-[#d1ebe7] rounded-lg font-semibold text-lg text-[#374151] hover:bg-[#f0f9f7] transition-all"
                  >
                    로그인
                  </button>
                  <button
                    onClick={() => setIsOpen(false)}
                    className="w-full px-5 py-3 bg-[#008485] text-white rounded-lg font-semibold text-lg hover:bg-[#006b6c] transition-all"
                  >
                    회원가입
                  </button>
                </div>
              </nav>
            </SheetContent>
          </Sheet>
        </div>

        {/* Desktop Auth Buttons */}
        <div className="hidden md:flex gap-4">
          <motion.button
            whileHover={{ y: -2, scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="px-5 py-3 border border-[#d1ebe7] rounded-lg font-semibold text-lg text-[#374151] hover:bg-[#f0f9f7] transition-all"
          >
            로그인
          </motion.button>
          <motion.button
            whileHover={{ y: -2, scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="px-5 py-3 bg-[#008485] text-white rounded-lg font-semibold text-lg hover:bg-[#006b6c] transition-all"
          >
            회원가입
          </motion.button>
        </div>
      </div>
    </motion.header>
  )
}

export { Header }
export default Header
