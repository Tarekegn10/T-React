"use client"

import { createContext, useContext, useEffect, useState, type ReactNode } from "react"

export type UserRole = "admin" | "manager" | "user"

export interface User {
  id: string
  username: string
  email: string
  role: UserRole
  name: string
  departmentId?: string
  phone?: string
  department?: string
  position?: string
  avatar?: string
}

export interface ProfileUpdateInput {
  name?: string
  email?: string
  phone?: string
  department?: string
  departmentId?: string | null
  position?: string
  avatar?: string
}

interface AuthContextType {
  user: User | null
  isLoading: boolean
  login: (
    username: string,
    password: string
  ) => Promise<{ success: boolean; error?: string }>
  logout: () => Promise<void>
  updateProfile: (
    updates: ProfileUpdateInput
  ) => Promise<{ success: boolean; error?: string }>
  isAdmin: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

interface AuthApiUser {
  id: string
  username: string
  email: string
  role: UserRole
  name: string
  department_id?: string | null
  phone?: string | null
  department_name?: string | null
  position?: string | null
  avatar_url?: string | null
}

function mapAuthUser(user: AuthApiUser): User {
  return {
    id: user.id,
    username: user.username,
    email: user.email,
    role: user.role,
    name: user.name,
    departmentId: user.department_id || undefined,
    phone: user.phone || undefined,
    department: user.department_name || undefined,
    position: user.position || undefined,
    avatar: user.avatar_url || undefined,
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const controller = new AbortController()

    const loadCurrentUser = async () => {
      try {
        const response = await fetch("/api/auth/me", {
          credentials: "same-origin",
          signal: controller.signal,
        })

        if (response.status === 401) {
          setUser(null)
          return
        }

        const result = await response.json()
        if (!response.ok) {
          throw new Error(result.error || "Failed to load current user.")
        }

        setUser(mapAuthUser(result.user))
      } catch (error) {
        if ((error as Error).name !== "AbortError") {
          setUser(null)
        }
      } finally {
        setIsLoading(false)
      }
    }

    void loadCurrentUser()

    return () => controller.abort()
  }, [])

  const login = async (
    username: string,
    password: string
  ): Promise<{ success: boolean; error?: string }> => {
    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "same-origin",
        body: JSON.stringify({
          username: username.trim(),
          password,
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        return {
          success: false,
          error: result.error || "Login failed.",
        }
      }

      setUser(mapAuthUser(result.user))
      return { success: true }
    } catch {
      return {
        success: false,
        error: "Unable to reach the server.",
      }
    }
  }

  const logout = async () => {
    try {
      await fetch("/api/auth/logout", {
        method: "POST",
        credentials: "same-origin",
      })
    } finally {
      setUser(null)
      window.location.replace("/login")
    }
  }

  const updateProfile = async (
    updates: ProfileUpdateInput
  ): Promise<{ success: boolean; error?: string }> => {
    if (!user) {
      return {
        success: false,
        error: "Not authenticated.",
      }
    }

    try {
      const response = await fetch(`/api/users/${user.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "same-origin",
        body: JSON.stringify({
          name: updates.name,
          email: updates.email,
          phone: updates.phone,
          position: updates.position,
          avatar_url: updates.avatar,
          department_id: updates.departmentId,
          department_name: updates.department,
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        return {
          success: false,
          error: result.error || "Failed to update profile.",
        }
      }

      setUser(mapAuthUser(result.user))
      return { success: true }
    } catch {
      return {
        success: false,
        error: "Unable to reach the server.",
      }
    }
  }

  const isAdmin = user?.role === "admin"

  return (
    <AuthContext.Provider value={{ user, isLoading, login, logout, updateProfile, isAdmin }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
