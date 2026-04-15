"use client"

import { useState } from "react"
import { Eye, EyeOff, Lock, User } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useAuth } from "@/contexts/auth-context"

export default function LoginPage() {
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const { login } = useAuth()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setIsLoading(true)

    const result = await login(username, password)
    
    if (result.success) {
      window.location.assign("/")
    } else {
      setError(result.error || "Invalid username or password")
    }
    
    setIsLoading(false)
  }

  return (
    <div
      className="relative min-h-screen overflow-hidden bg-background"
      style={{
        backgroundImage:
          "linear-gradient(rgba(17, 24, 16, 0.22), rgba(17, 24, 16, 0.34)), url('/login.png')",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
        backgroundSize: "cover",
      }}
    >
      <div className="absolute inset-0 bg-black/10" />
      <div className="relative flex min-h-screen items-center justify-center p-4">
        <Card className="w-full max-w-[400px] border-white/15 bg-black/18 shadow-[0_20px_80px_rgba(0,0,0,0.35)] backdrop-blur-xl">
          <CardHeader className="space-y-2 px-6 pt-7">
            <CardTitle className="text-center text-4xl font-semibold tracking-[-0.02em] text-white">
              Welcome back
            </CardTitle>
            <CardDescription className="text-center text-base text-white/80">
              Sign in to your account to continue
            </CardDescription>
          </CardHeader>
          <CardContent className="px-6 pb-6">
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-2">
                <label htmlFor="username" className="text-sm font-semibold text-white/90">
                  Username
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-white/60" />
                  <Input
                    id="username"
                    type="text"
                    placeholder="Enter username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="h-12 rounded-lg border-white/10 bg-black/18 pl-10 text-white placeholder:text-white/45 focus-visible:border-white/30 focus-visible:ring-white/20"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label htmlFor="password" className="text-sm font-semibold text-white/90">
                  Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-white/60" />
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="h-12 rounded-lg border-white/10 bg-black/18 pl-10 pr-10 text-white placeholder:text-white/45 focus-visible:border-white/30 focus-visible:ring-white/20"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-white/60 transition-colors hover:text-white"
                  >
                    {showPassword ? (
                      <EyeOff className="size-4" />
                    ) : (
                      <Eye className="size-4" />
                    )}
                  </button>
                </div>
              </div>

              {error && (
                <p className="text-center text-sm text-red-200">{error}</p>
              )}

              <Button
                type="submit"
                className="h-12 w-full rounded-lg bg-[#55c947] text-base font-semibold text-white shadow-[0_8px_24px_rgba(85,201,71,0.3)] hover:bg-[#49b83d]"
                disabled={isLoading}
              >
                {isLoading ? "Signing in..." : "Sign In"}
              </Button>

              <div className="border-t border-white/10 pt-5">
                <p className="text-center text-sm text-white/70">
                  Forgot your password? Call <span className="font-semibold text-white">+251 9477 56395</span> for help.
                </p>
              </div>
            </form>
             <Card className="border-white/20 bg-white/10 shadow-xl backdrop-blur-md">
            <CardHeader className="pb-2">
              <CardTitle className="text-center text-sm font-medium text-white">Default Account</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between rounded-lg border border-white/15 bg-white/8 p-3">
                <div>
                  <p className="text-sm font-medium text-white">Admin Account</p>
                  <p className="text-xs text-white/65">Seeded backend user</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-mono text-white">admin</p>
                  <p className="text-xs font-mono text-white/65">admin123</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-mono text-white">user</p>
                  <p className="text-xs font-mono text-white/65">user123</p>
                </div>
              </div>
            </CardContent>
          </Card>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
