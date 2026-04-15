"use client"

import { useEffect, useState } from "react"
import { CheckCircle2, FileText, Share2, Pencil, Eye } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

interface ActivityItem {
  id: string
  action: string
  created_at: string
  user_name: string
  document_title: string
}

function formatRelativeTime(dateString: string) {
  const created = new Date(dateString).getTime()
  const diffMinutes = Math.max(1, Math.round((Date.now() - created) / 60000))

  if (diffMinutes < 60) {
    return `${diffMinutes} min ago`
  }

  const diffHours = Math.round(diffMinutes / 60)
  if (diffHours < 24) {
    return `${diffHours} hr ago`
  }

  const diffDays = Math.round(diffHours / 24)
  return `${diffDays} day ago`
}

function getActivityMeta(action: string) {
  switch (action) {
    case "shared":
      return { icon: Share2, iconColor: "text-blue-600", iconBg: "bg-blue-50" }
    case "edited":
      return { icon: Pencil, iconColor: "text-amber-600", iconBg: "bg-amber-50" }
    case "viewed":
      return { icon: Eye, iconColor: "text-slate-600", iconBg: "bg-slate-100" }
    case "created":
    default:
      return { icon: FileText, iconColor: "text-primary", iconBg: "bg-primary/10" }
  }
}

function actionLabel(action: string) {
  if (action === "created") {
    return "uploaded"
  }

  return action
}

export function RecentActivity() {
  const [activities, setActivities] = useState<ActivityItem[]>([])
  const [error, setError] = useState("")
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const loadActivity = async () => {
      try {
        setError("")
        setIsLoading(true)
        const response = await fetch("/api/dashboard/stats")
        const result = await response.json()

        if (!response.ok) {
          throw new Error(result.error || "Failed to load activity.")
        }

        setActivities(result.recentActivity || [])
      } catch (loadError) {
        setActivities([])
        setError(loadError instanceof Error ? loadError.message : "Failed to load activity.")
      } finally {
        setIsLoading(false)
      }
    }

    void loadActivity()
  }, [])

  return (
    <Card className="gap-0">
      <CardHeader className="py-4">
        <CardTitle className="text-base font-semibold">Recent Activity</CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        {isLoading ? (
          <p className="text-sm text-muted-foreground">Loading activity...</p>
        ) : error ? (
          <p className="text-sm text-destructive">{error}</p>
        ) : activities.length === 0 ? (
          <p className="text-sm text-muted-foreground">No recent activity.</p>
        ) : (
          <div className="space-y-4">
            {activities.map((activity) => {
              const meta = getActivityMeta(activity.action)
              return (
                <div key={activity.id} className="flex items-start gap-3">
                  <div className={`shrink-0 rounded-full p-2 ${meta.iconBg}`}>
                    <meta.icon className={`size-4 ${meta.iconColor}`} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm text-foreground">
                      <span className="font-medium">{activity.user_name}</span>{" "}
                      <span className="text-muted-foreground">{actionLabel(activity.action)}</span>
                    </p>
                    <p className="truncate text-sm text-foreground">{activity.document_title}</p>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {formatRelativeTime(activity.created_at)}
                    </p>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
