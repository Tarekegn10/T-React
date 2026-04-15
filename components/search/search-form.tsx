"use client"

import { useEffect, useState } from "react"
import { Search, Building2, Tag, Calendar, FileText } from "lucide-react"
import Link from "next/link"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

interface DepartmentOption {
  id: string
  name: string
}

interface SearchResult {
  id: string
  title: string
  document_number: string
  document_type: string
  department_name: string | null
  status: string
  created_at: string
  file_url: string | null
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

function formatDate(dateString: string | null | undefined) {
  if (!dateString) {
    return "Unknown date"
  }

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(dateString))
}

export function SearchForm() {
  const [departments, setDepartments] = useState<DepartmentOption[]>([])
  const [results, setResults] = useState<SearchResult[]>([])
  const [query, setQuery] = useState("")
  const [departmentId, setDepartmentId] = useState("all")
  const [documentType, setDocumentType] = useState("all")
  const [dateFrom, setDateFrom] = useState("")
  const [dateTo, setDateTo] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")

  useEffect(() => {
    const loadDepartments = async () => {
      try {
        const response = await fetch("/api/departments")
        const result = await response.json()
        if (!response.ok) {
          return
        }

        setDepartments((result.departments || []).map((department: DepartmentOption) => ({
          id: department.id,
          name: department.name,
        })))
      } catch {
        setDepartments([])
      }
    }

    void loadDepartments()
  }, [])

  const runSearch = async () => {
    try {
      setIsLoading(true)
      setError("")

      const params = new URLSearchParams({ limit: "100" })
      if (query.trim()) {
        params.set("search", query.trim())
      }
      if (departmentId !== "all") {
        params.set("department_id", departmentId)
      }
      if (documentType !== "all") {
        params.set("type", documentType)
      }
      if (dateFrom) {
        params.set("date_from", dateFrom)
      }
      if (dateTo) {
        params.set("date_to", dateTo)
      }

      const response = await fetch(`/api/documents?${params.toString()}`)
      const result = await response.json()
      if (!response.ok) {
        throw new Error(result.error || "Search failed.")
      }

      setResults(result.documents || [])
    } catch (searchError) {
      setResults([])
      setError(searchError instanceof Error ? searchError.message : "Search failed.")
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    void runSearch()
  }, [])

  useEffect(() => {
    void runSearch()
  }, [departmentId, documentType, dateFrom, dateTo])

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <div className="space-y-6">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 size-5 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search by title, reference number, or keyword..."
              className="h-12 bg-background pl-12 pr-28 text-base"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  void runSearch()
                }
              }}
            />
            <Button className="absolute right-2 top-1/2 -translate-y-1/2" onClick={() => void runSearch()}>
              Search
            </Button>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
            <div className="space-y-2">
              <Label className="flex items-center gap-2 text-sm text-muted-foreground">
                <Building2 className="size-4" />
                Department
              </Label>
              <Select value={departmentId} onValueChange={setDepartmentId}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select department" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Departments</SelectItem>
                  {departments.map((department) => (
                    <SelectItem key={department.id} value={department.id}>
                      {department.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="flex items-center gap-2 text-sm text-muted-foreground">
                <Tag className="size-4" />
                Document Type
              </Label>
              <Select value={documentType} onValueChange={setDocumentType}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="received">Received</SelectItem>
                  <SelectItem value="sent">Sent</SelectItem>
                  <SelectItem value="contract">Contract</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="flex items-center gap-2 text-sm text-muted-foreground">
                <Calendar className="size-4" />
                Date From
              </Label>
              <Input type="date" className="w-full" value={dateFrom} onChange={(event) => setDateFrom(event.target.value)} />
            </div>

            <div className="space-y-2">
              <Label className="flex items-center gap-2 text-sm text-muted-foreground">
                <Calendar className="size-4" />
                Date To
              </Label>
              <Input type="date" className="w-full" value={dateTo} onChange={(event) => setDateTo(event.target.value)} />
            </div>
          </div>

          <div className="flex justify-end">
            <Button
              variant="outline"
              onClick={() => {
                setQuery("")
                setDepartmentId("all")
                setDocumentType("all")
                setDateFrom("")
                setDateTo("")
                setError("")
              }}
            >
              Reset Filters
            </Button>
          </div>
        </div>
      </Card>

      <Card className="overflow-hidden p-0">
        <div className="border-b border-border px-6 py-4">
          <h2 className="text-base font-semibold text-foreground">Search Results</h2>
        </div>
        <div className="divide-y divide-border">
          {isLoading ? (
            <p className="px-6 py-8 text-sm text-muted-foreground">Searching documents...</p>
          ) : error ? (
            <p className="px-6 py-8 text-sm text-destructive">{error}</p>
          ) : results.length === 0 ? (
            <p className="px-6 py-8 text-sm text-muted-foreground">No documents matched your filters.</p>
          ) : (
            results.map((result) => (
              <div key={result.id} className="flex items-start gap-4 px-6 py-4">
                <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <FileText className="size-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-foreground">{result.title}</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {result.document_number} | {result.department_name || "Unassigned"} | {formatLabel(result.document_type)} | {formatLabel(result.status)}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">{formatDate(result.created_at)}</p>
                </div>
                {result.file_url && (
                  <Link href={result.file_url} target="_blank" className="text-sm text-primary hover:underline">
                    Open
                  </Link>
                )}
              </div>
            ))
          )}
        </div>
      </Card>
    </div>
  )
}
