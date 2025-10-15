"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card } from "@/components/ui/card"

export default function LoginPage() {
  const router = useRouter()
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setIsLoading(true)

    try {

      setTimeout(() => {
        router.push("/")
      }, 500)
    } catch (err) {
      setError("로그인에 실패했습니다. 다시 시도해주세요.")
    } finally {
      setIsLoading(false)
    }
  }

  const handleSignup = () => {
    router.push("/signup")
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 via-white to-green-50/30 p-4">
      <Card className="w-full max-w-md p-8 space-y-6 shadow-lg">
        <div className="space-y-2 text-center">
          <h1 className="text-3xl font-bold text-foreground">StockOne19</h1>
          <p className="text-muted-foreground">로그인하여 투자 관리를 시작하세요</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="username">아이디</Label>
            <Input
              id="username"
              type="text"
              placeholder="아이디를 입력하세요"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              disabled={isLoading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">비밀번호</Label>
            <Input
              id="password"
              type="password"
              placeholder="비밀번호를 입력하세요"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={isLoading}
            />
          </div>

          {error && (
            <div className="text-sm text-red-500 text-center">
              {error}
            </div>
          )}

          <div className="space-y-2">
            <Button
              type="submit"
              className="w-full"
              disabled={isLoading}
            >
              {isLoading ? "로그인 중..." : "로그인"}
            </Button>

            <Button
              type="button"
              variant="outline"
              className="w-full"
              onClick={handleSignup}
              disabled={isLoading}
            >
              회원가입
            </Button>
          </div>
        </form>

        <div className="text-center text-sm text-muted-foreground">
          <p>계정이 없으신가요? 회원가입을 진행해주세요.</p>
        </div>
      </Card>
    </div>
  )
}
