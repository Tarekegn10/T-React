"use client"

import { useEffect } from "react"
import { useAuth } from "@/contexts/auth-context"
import { Spinner } from "@/components/ui/spinner"

interface AuthGuardProps {
  children: React.ReactNode
  requireAdmin?: boolean
}

export function AuthGuard({ children, requireAdmin = false }: AuthGuardProps) {
  const { user, isLoading, isAdmin } = useAuth()

  useEffect(() => {
    if (!isLoading) {
      if (!user) {
        window.location.replace("/login")
      } else if (requireAdmin && !isAdmin) {
        window.location.replace("/")
      }
    }
  }, [user, isLoading, isAdmin, requireAdmin])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Spinner className="size-8 text-primary" />
      </div>
    )
  }

  if (!user) {
    return null
  }

  if (requireAdmin && !isAdmin) {
    return null
  }

  return <>{children}</>
}
