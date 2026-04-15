"use client"

import { useCallback, useEffect, useState } from "react"
import Link from "next/link"
import { FileText, CheckCircle2, Clock } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useAuth } from "@/contexts/auth-context"

interface RecentUpload {
  id: string
  file_name: string | null
  title: string
  file_size: number | null
  status: string
  created_at: string
  file_url: string | null
}

function formatSize(size: number | null) {
  if (!size) {
    return "Unknown size"
  }

  if (size < 1024) {
    return `${size} B`
  }

  if (size < 1024 * 1024) {
    return `${(size / 1024).toFixed(1)} KB`
  }

  return `${(size / (1024 * 1024)).toFixed(1)} MB`
}

function formatTime(dateString: string) {
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

export function RecentUploads() {
  const { user } = useAuth()
  const [uploads, setUploads] = useState<RecentUpload[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState("")

  const loadUploads = useCallback(async () => {
    if (!user?.username) {
      setUploads([])
      setIsLoading(false)
      return
    }

    try {
      setIsLoading(true)
      setError("")

      const response = await fetch("/api/documents?limit=5")
      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || "Failed to load uploads.")
      }

      setUploads(result.documents || [])
    } catch (loadError) {
      const message =
        loadError instanceof Error ? loadError.message : "Failed to load uploads."
      setError(message)
    } finally {
      setIsLoading(false)
    }
  }, [user?.username])

  useEffect(() => {
    loadUploads()
  }, [loadUploads])

  useEffect(() => {
    const handleUploaded = () => {
      loadUploads()
    }

    window.addEventListener("document-uploaded", handleUploaded)
    return () => {
      window.removeEventListener("document-uploaded", handleUploaded)
    }
  }, [loadUploads])

  return (
    <Card className="gap-0">
      <CardHeader className="py-4">
        <CardTitle className="text-base font-semibold">Recent Uploads</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        {isLoading ? (
          <p className="px-6 py-4 text-sm text-muted-foreground">Loading uploads...</p>
        ) : error ? (
          <p className="px-6 py-4 text-sm text-destructive">{error}</p>
        ) : uploads.length === 0 ? (
          <p className="px-6 py-4 text-sm text-muted-foreground">
            No uploaded documents yet.
          </p>
        ) : (
          <div className="divide-y divide-border">
            {uploads.map((file) => (
              <div
                key={file.id}
                className="flex items-center gap-4 px-6 py-4 transition-colors hover:bg-muted/30"
              >
                <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <FileText className="size-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-foreground">
                    {file.file_url ? (
                      <Link href={file.file_url} target="_blank" className="hover:underline">
                        {file.file_name || file.title}
                      </Link>
                    ) : (
                      file.file_name || file.title
                    )}
                  </p>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {formatSize(file.file_size)} {" • "} {formatTime(file.created_at)}
                  </p>
                </div>
                {file.status === "pending" ? (
                  <Clock className="size-5 shrink-0 text-amber-500" />
                ) : (
                  <CheckCircle2 className="size-5 shrink-0 text-primary" />
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
