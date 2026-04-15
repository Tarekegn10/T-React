"use client"

import { useEffect, useState } from "react"
import { FileText, Inbox, FileSignature, Send, Archive } from "lucide-react"
import { Card } from "@/components/ui/card"

interface DashboardStatsResponse {
  stats?: {
    total: number
    received: number
    sent: number
    contract: number
    archived: number
    growthRate: number
  }
}

const statMeta = [
  {
    key: "total",
    label: "Total Documents",
    icon: FileText,
    iconBg: "bg-primary/10",
    iconColor: "text-primary",
  },
  {
    key: "received",
    label: "Received",
    icon: Inbox,
    iconBg: "bg-blue-50",
    iconColor: "text-blue-600",
  },
  {
    key: "contract",
    label: "Contract",
    icon: FileSignature,
    iconBg: "bg-amber-50",
    iconColor: "text-amber-600",
  },
  {
    key: "sent",
    label: "Sent",
    icon: Send,
    iconBg: "bg-slate-100",
    iconColor: "text-slate-600",
  },
  {
    key: "archived",
    label: "Archived",
    icon: Archive,
    iconBg: "bg-slate-100",
    iconColor: "text-slate-600",
  },
] as const

export function DashboardStats() {
  const [stats, setStats] = useState<DashboardStatsResponse["stats"] | null>(null)
  const [error, setError] = useState("")

  useEffect(() => {
    const loadStats = async () => {
      try {
        setError("")
        const response = await fetch("/api/dashboard/stats")
        const result: DashboardStatsResponse = await response.json()

        if (!response.ok) {
          throw new Error((result as { error?: string }).error || "Failed to load dashboard stats.")
        }

        setStats(result.stats || null)
      } catch (loadError) {
        setStats(null)
        setError(loadError instanceof Error ? loadError.message : "Failed to load dashboard stats.")
      }
    }

    void loadStats()
  }, [])

  if (error) {
    return (
      <Card className="p-4 text-sm text-destructive">
        {error}
      </Card>
    )
  }

  return (
    <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-6">
      {statMeta.map((stat) => {
        const value = stats?.[stat.key] ?? 0

        return (
          <Card key={stat.key} className="gap-0 p-4">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-muted-foreground">{stat.label}</p>
                <p className="mt-1 text-2xl font-semibold text-foreground">{value}</p>
                {stat.key === "total" && stats && (
                  <p className="mt-1 text-xs text-primary">
                    {stats.growthRate >= 0 ? "+" : ""}
                    {stats.growthRate}% from last month
                  </p>
                )}
              </div>
              <div className={`rounded-lg p-2 ${stat.iconBg}`}>
                <stat.icon className={`size-5 ${stat.iconColor}`} />
              </div>
            </div>
          </Card>
        )
      })}
    </div>
  )
}
