"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { FileText, Clock } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

interface RecentDocument {
  id: string
  document_number: string
  title: string
  document_type: string
  status: string
  priority: string
  created_at: string
  department_name: string | null
}

const statusStyles: Record<string, string> = {
  pending: "bg-amber-50 text-amber-700 border-amber-200",
  approved: "bg-emerald-50 text-emerald-700 border-emerald-200",
  sent: "bg-blue-50 text-blue-700 border-blue-200",
  received: "bg-cyan-50 text-cyan-700 border-cyan-200",
  archived: "bg-slate-100 text-slate-600 border-slate-200",
}

const priorityStyles: Record<string, string> = {
  low: "bg-slate-100 text-slate-600 border-slate-200",
  medium: "bg-amber-50 text-amber-700 border-amber-200",
  high: "bg-red-50 text-red-700 border-red-200",
  urgent: "bg-red-100 text-red-800 border-red-300",
}

function formatLabel(value: string | null | undefined) {
  if (!value) {
    return "Unknown"
  }

  return value
    .replace(/_/g, " ")
    .split(" ")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ")
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

export function RecentDocuments() {
  const [documents, setDocuments] = useState<RecentDocument[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    const loadRecentDocuments = async () => {
      try {
        setIsLoading(true)
        setError("")

        const response = await fetch("/api/dashboard/stats")
        const result = await response.json()

        if (!response.ok) {
          throw new Error(result.error || "Failed to load recent documents.")
        }

        setDocuments(result.recentDocuments || [])
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : "Failed to load recent documents.")
        setDocuments([])
      } finally {
        setIsLoading(false)
      }
    }

    void loadRecentDocuments()
  }, [])

  return (
    <Card className="gap-0">
      <CardHeader className="flex flex-row items-center justify-between py-4">
        <CardTitle className="text-base font-semibold">Recent Documents</CardTitle>
        <Link href="/documents" className="text-sm font-medium text-primary hover:underline">
          View all
        </Link>
      </CardHeader>
      <CardContent className="p-0">
        {isLoading ? (
          <p className="px-6 py-4 text-sm text-muted-foreground">Loading documents...</p>
        ) : error ? (
          <p className="px-6 py-4 text-sm text-destructive">{error}</p>
        ) : documents.length === 0 ? (
          <p className="px-6 py-4 text-sm text-muted-foreground">No documents found.</p>
        ) : (
          <div className="divide-y divide-border">
            {documents.map((document) => (
              <div
                key={document.id}
                className="flex items-center gap-4 px-6 py-4 transition-colors hover:bg-muted/50"
              >
                <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <FileText className="size-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-foreground">{document.title}</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {document.document_number} | {document.department_name || "Unassigned"}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <Badge
                    variant="outline"
                    className={statusStyles[document.status] || statusStyles.pending}
                  >
                    {formatLabel(document.status)}
                  </Badge>
                  <Badge
                    variant="outline"
                    className={priorityStyles[document.priority] || priorityStyles.medium}
                  >
                    {formatLabel(document.priority)}
                  </Badge>
                </div>
                <div className="flex shrink-0 items-center gap-1 text-xs text-muted-foreground">
                  <Clock className="size-3" />
                  <span>{formatRelativeTime(document.created_at)}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
