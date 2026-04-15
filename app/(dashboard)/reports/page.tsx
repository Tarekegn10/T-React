"use client"

import { useEffect, useMemo, useState } from "react"
import { Header } from "@/components/header"
import { ReportStats } from "@/components/reports/report-stats"
import { MonthlyActivityChart } from "@/components/reports/monthly-activity-chart"
import { StatusDistributionChart } from "@/components/reports/status-distribution-chart"
import { DepartmentChart } from "@/components/reports/department-chart"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Download, FileSpreadsheet, FileText, Calendar, Building2, Filter } from "lucide-react"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

interface DepartmentOption {
  id: string
  name: string
}

interface ReportsResponse {
  monthlyActivity: Array<{ month: string; received: number | string; sent: number | string; contract: number | string }>
  statusDistribution: Array<{ status: string; count: number | string }>
  byDepartment: Array<{ department: string; count: number | string }>
  summary: { total: number | string; received: number | string; sent: number | string; contract: number | string }
}

const reportTypes = [
  { value: "all", label: "All Reports" },
  { value: "documents", label: "Documents Report" },
  { value: "department", label: "Department Report" },
]

function toIsoDate(date: Date) {
  const adjusted = new Date(date.getTime() - date.getTimezoneOffset() * 60000)
  return adjusted.toISOString().slice(0, 10)
}

function getPeriodRange(period: string, dateFrom: string, dateTo: string) {
  if (period === "custom") {
    return { from: dateFrom, to: dateTo }
  }

  const now = new Date()
  const end = toIsoDate(now)

  if (period === "this-week") {
    const start = new Date(now)
    start.setDate(now.getDate() - 6)
    return { from: toIsoDate(start), to: end }
  }

  if (period === "this-quarter") {
    const quarterStartMonth = Math.floor(now.getMonth() / 3) * 3
    const start = new Date(now.getFullYear(), quarterStartMonth, 1)
    return { from: toIsoDate(start), to: end }
  }

  if (period === "this-year") {
    const start = new Date(now.getFullYear(), 0, 1)
    return { from: toIsoDate(start), to: end }
  }

  const start = new Date(now.getFullYear(), now.getMonth(), 1)
  return { from: toIsoDate(start), to: end }
}

function downloadFile(filename: string, content: string, type: string) {
  const blob = new Blob([content], { type })
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement("a")
  anchor.href = url
  anchor.download = filename
  anchor.click()
  URL.revokeObjectURL(url)
}

export default function ReportsPage() {
  const [period, setPeriod] = useState("this-month")
  const [departmentId, setDepartmentId] = useState("all")
  const [reportType, setReportType] = useState("all")
  const [dateFrom, setDateFrom] = useState("")
  const [dateTo, setDateTo] = useState("")
  const [isFilterOpen, setIsFilterOpen] = useState(false)
  const [departments, setDepartments] = useState<DepartmentOption[]>([])
  const [reportData, setReportData] = useState<ReportsResponse>({
    monthlyActivity: [],
    statusDistribution: [],
    byDepartment: [],
    summary: { total: 0, received: 0, sent: 0, contract: 0 },
  })
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState("")

  const effectiveRange = useMemo(
    () => getPeriodRange(period, dateFrom, dateTo),
    [period, dateFrom, dateTo]
  )

  const selectedDepartment = departments.find((department) => department.id === departmentId)

  useEffect(() => {
    const loadDepartments = async () => {
      try {
        const response = await fetch("/api/departments")
        const result = await response.json()
        if (!response.ok) {
          return
        }

        setDepartments(
          (result.departments || []).map((department: DepartmentOption) => ({
            id: department.id,
            name: department.name,
          }))
        )
      } catch {
        setDepartments([])
      }
    }

    void loadDepartments()
  }, [])

  useEffect(() => {
    const loadReports = async () => {
      try {
        setIsLoading(true)
        setError("")

        const params = new URLSearchParams()
        if (effectiveRange.from) {
          params.set("date_from", effectiveRange.from)
        }
        if (effectiveRange.to) {
          params.set("date_to", effectiveRange.to)
        }
        if (departmentId !== "all") {
          params.set("department_id", departmentId)
        }

        const response = await fetch(`/api/reports?${params.toString()}`)
        const result = await response.json()
        if (!response.ok) {
          throw new Error(result.error || "Failed to load reports.")
        }

        setReportData({
          monthlyActivity: result.monthlyActivity || [],
          statusDistribution: result.statusDistribution || [],
          byDepartment: result.byDepartment || [],
          summary: result.summary || { total: 0, received: 0, sent: 0, contract: 0 },
        })
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : "Failed to load reports.")
      } finally {
        setIsLoading(false)
      }
    }

    void loadReports()
  }, [effectiveRange.from, effectiveRange.to, departmentId])

  const handleExport = (format: "excel" | "pdf") => {
    if (format === "pdf") {
      window.print()
      return
    }

    const rows = [
      ["Metric", "Value"],
      ["Total Documents", String(reportData.summary.total)],
      ["Received", String(reportData.summary.received)],
      ["Sent", String(reportData.summary.sent)],
      ["Contract", String(reportData.summary.contract)],
      [],
      ["Department", "Documents"],
      ...reportData.byDepartment.map((item) => [item.department, String(item.count)]),
    ]

    const csv = rows.map((row) => row.join(",")).join("\n")
    downloadFile("reports.csv", csv, "text/csv;charset=utf-8;")
  }

  const applyFilters = () => {
    setIsFilterOpen(false)
  }

  const clearFilters = () => {
    setDepartmentId("all")
    setReportType("all")
    setDateFrom("")
    setDateTo("")
    setPeriod("this-month")
    setIsFilterOpen(false)
  }

  return (
    <>
      <Header title="Reports & Analytics" description="Document statistics and insights" />
      <main className="flex-1 overflow-auto p-6">
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex items-center gap-2">
                <Calendar className="size-4 text-muted-foreground" />
                <Select value={period} onValueChange={setPeriod}>
                  <SelectTrigger className="w-36">
                    <SelectValue placeholder="Select period" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="this-week">This Week</SelectItem>
                    <SelectItem value="this-month">This Month</SelectItem>
                    <SelectItem value="this-quarter">This Quarter</SelectItem>
                    <SelectItem value="this-year">This Year</SelectItem>
                    <SelectItem value="custom">Custom Range</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center gap-2">
                <Building2 className="size-4 text-muted-foreground" />
                <Select value={departmentId} onValueChange={setDepartmentId}>
                  <SelectTrigger className="w-44">
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

              <div className="flex items-center gap-2">
                <FileText className="size-4 text-muted-foreground" />
                <Select value={reportType} onValueChange={setReportType}>
                  <SelectTrigger className="w-44">
                    <SelectValue placeholder="Report type" />
                  </SelectTrigger>
                  <SelectContent>
                    {reportTypes.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <Button variant="outline" size="sm" onClick={() => setIsFilterOpen(true)}>
                <Filter className="mr-2 size-4" />
                More Filters
              </Button>

              <div className="flex-1" />

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button>
                    <Download className="mr-2 size-4" />
                    Export Report
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => handleExport("excel")}>
                    <FileSpreadsheet className="mr-2 size-4 text-green-600" />
                    Export as Excel (.xlsx)
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleExport("pdf")}>
                    <FileText className="mr-2 size-4 text-red-600" />
                    Export as PDF (.pdf)
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            {(departmentId !== "all" || reportType !== "all" || period !== "this-month" || dateFrom || dateTo) && (
              <div className="mt-4 flex items-center gap-2 border-t border-border pt-4">
                <span className="text-sm text-muted-foreground">Active filters:</span>
                {departmentId !== "all" && (
                  <span className="rounded-md bg-primary/10 px-2 py-1 text-xs text-primary">
                    {selectedDepartment?.name || "Department"}
                  </span>
                )}
                {reportType !== "all" && (
                  <span className="rounded-md bg-primary/10 px-2 py-1 text-xs text-primary">
                    {reportTypes.find((type) => type.value === reportType)?.label}
                  </span>
                )}
                {(effectiveRange.from || effectiveRange.to) && (
                  <span className="rounded-md bg-primary/10 px-2 py-1 text-xs text-primary">
                    {effectiveRange.from || "Any"} to {effectiveRange.to || "Any"}
                  </span>
                )}
                <Button variant="ghost" size="sm" onClick={clearFilters} className="text-xs">
                  Clear all
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {error ? (
          <Card className="p-6 text-sm text-destructive">{error}</Card>
        ) : (
          <>
            <ReportStats
              stats={{
                total: Number(reportData.summary.total || 0),
                received: Number(reportData.summary.received || 0),
                sent: Number(reportData.summary.sent || 0),
                contract: Number(reportData.summary.contract || 0),
              }}
            />

            {isLoading ? (
              <Card className="mt-6 p-6 text-sm text-muted-foreground">Loading reports...</Card>
            ) : (
              <>
                {(reportType === "all" || reportType === "documents") && (
                  <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
                    <MonthlyActivityChart data={reportData.monthlyActivity} />
                    <StatusDistributionChart data={reportData.statusDistribution} />
                  </div>
                )}

                {(reportType === "all" || reportType === "department") && (
                  <div className="mt-6">
                    <DepartmentChart data={reportData.byDepartment} />
                  </div>
                )}
              </>
            )}
          </>
        )}

        <Dialog open={isFilterOpen} onOpenChange={setIsFilterOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Advanced Filters</DialogTitle>
              <DialogDescription>Set custom date range and additional filters</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="date-from">Date From</Label>
                  <Input
                    id="date-from"
                    type="date"
                    value={dateFrom}
                    onChange={(event) => {
                      setDateFrom(event.target.value)
                      setPeriod("custom")
                    }}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="date-to">Date To</Label>
                  <Input
                    id="date-to"
                    type="date"
                    value={dateTo}
                    onChange={(event) => {
                      setDateTo(event.target.value)
                      setPeriod("custom")
                    }}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="filter-dept">Department</Label>
                <Select value={departmentId} onValueChange={setDepartmentId}>
                  <SelectTrigger id="filter-dept">
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
                <Label htmlFor="filter-type">Report Type</Label>
                <Select value={reportType} onValueChange={setReportType}>
                  <SelectTrigger id="filter-type">
                    <SelectValue placeholder="Select report type" />
                  </SelectTrigger>
                  <SelectContent>
                    {reportTypes.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={clearFilters}>
                Clear All
              </Button>
              <Button onClick={applyFilters}>Apply Filters</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </main>
    </>
  )
}
