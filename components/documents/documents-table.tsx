"use client"

import { useEffect, useState } from "react"
import { useAuth } from "@/contexts/auth-context"
import {
  Search,
  SlidersHorizontal,
  FileText,
  FileSpreadsheet,
  FileIcon,
  ImageIcon,
  MoreHorizontal,
  Eye,
  Pencil,
  Trash2,
  Share2,
} from "lucide-react"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

interface DocumentRecord {
  id: string
  title: string
  subject: string | null
  document_number: string
  document_type: string
  file_url: string | null
  file_name: string | null
  file_size: number | string | null
  file_type: string | null
  company_name: string | null
  department_id: string | null
  department_name: string | null
  status: string
  priority: string
  created_at: string
  updated_at: string
}

interface UserOption {
  id: string
  user_id?: string | null
  name: string
  email: string
}

function normalizeKey(value: string | null | undefined) {
  return (value || "").trim().toLowerCase()
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

function toNumber(value: number | string | null | undefined) {
  if (typeof value === "number") {
    return value
  }

  if (typeof value === "string") {
    const parsed = Number(value)
    return Number.isFinite(parsed) ? parsed : null
  }

  return null
}

function formatFileSize(size: number | string | null | undefined) {
  const value = toNumber(size)
  if (value === null || value <= 0) {
    return "Unknown size"
  }

  if (value < 1024) {
    return `${value} B`
  }

  if (value < 1024 * 1024) {
    return `${(value / 1024).toFixed(1)} KB`
  }

  return `${(value / (1024 * 1024)).toFixed(1)} MB`
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

function getFileKind(document: DocumentRecord) {
  const name = normalizeKey(document.file_name)
  const mime = normalizeKey(document.file_type)

  if (mime.includes("pdf") || name.endsWith(".pdf")) {
    return "PDF"
  }

  if (
    mime.includes("spreadsheet") ||
    mime.includes("excel") ||
    name.endsWith(".xls") ||
    name.endsWith(".xlsx") ||
    name.endsWith(".csv")
  ) {
    return "XLSX"
  }

  if (
    mime.includes("word") ||
    mime.includes("document") ||
    name.endsWith(".doc") ||
    name.endsWith(".docx")
  ) {
    return "DOCX"
  }

  if (
    mime.includes("image") ||
    name.endsWith(".png") ||
    name.endsWith(".jpg") ||
    name.endsWith(".jpeg") ||
    name.endsWith(".gif") ||
    name.endsWith(".webp")
  ) {
    return "IMG"
  }

  return formatLabel(document.document_type)
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

const fileIconColors: Record<string, string> = {
  PDF: "bg-red-100 text-red-600",
  DOCX: "bg-blue-100 text-blue-600",
  XLSX: "bg-green-100 text-green-600",
  IMG: "bg-violet-100 text-violet-600",
}

function FileTypeIcon({ document }: { document: DocumentRecord }) {
  const fileKind = getFileKind(document)
  const colorClass = fileIconColors[fileKind] || "bg-slate-100 text-slate-600"

  return (
    <div className={`flex size-9 items-center justify-center rounded-lg ${colorClass}`}>
      {fileKind === "XLSX" ? (
        <FileSpreadsheet className="size-5" />
      ) : fileKind === "DOCX" ? (
        <FileIcon className="size-5" />
      ) : fileKind === "IMG" ? (
        <ImageIcon className="size-5" />
      ) : (
        <FileText className="size-5" />
      )}
    </div>
  )
}

export function DocumentsTable() {
  const { user } = useAuth()
  const [documents, setDocuments] = useState<DocumentRecord[]>([])
  const [employees, setEmployees] = useState<UserOption[]>([])
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [typeFilter, setTypeFilter] = useState("all")
  const [isLoading, setIsLoading] = useState(true)
  const [isUsersLoading, setIsUsersLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [isSharing, setIsSharing] = useState(false)
  const [totalDocuments, setTotalDocuments] = useState(0)
  const [loadError, setLoadError] = useState("")
  const [actionError, setActionError] = useState("")
  const [actionSuccess, setActionSuccess] = useState("")
  const [viewDoc, setViewDoc] = useState<DocumentRecord | null>(null)
  const [editDoc, setEditDoc] = useState<DocumentRecord | null>(null)
  const [deleteDoc, setDeleteDoc] = useState<DocumentRecord | null>(null)
  const [shareDoc, setShareDoc] = useState<DocumentRecord | null>(null)
  const [selectedEmployee, setSelectedEmployee] = useState("")
  const [shareMessage, setShareMessage] = useState("")
  const [sendByEmail, setSendByEmail] = useState(true)

  const allSelected = documents.length > 0 && selectedIds.length === documents.length
  const someSelected = selectedIds.length > 0 && !allSelected

  const fetchDocuments = async () => {
    try {
      setIsLoading(true)
      setLoadError("")

      const params = new URLSearchParams({ limit: "100" })
      if (searchQuery.trim()) {
        params.set("search", searchQuery.trim())
      }
      if (statusFilter !== "all") {
        params.set("status", statusFilter)
      }
      if (typeFilter !== "all") {
        params.set("type", typeFilter)
      }

      const response = await fetch(`/api/documents?${params.toString()}`)
      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || "Failed to load documents.")
      }

      const nextDocuments = result.documents || []
      setDocuments(nextDocuments)
      setSelectedIds((current) =>
        current.filter((id) => nextDocuments.some((document: DocumentRecord) => document.id === id))
      )
      setTotalDocuments(result.pagination?.total || 0)
    } catch (error) {
      setLoadError(error instanceof Error ? error.message : "Failed to load documents.")
      setDocuments([])
      setSelectedIds([])
      setTotalDocuments(0)
    } finally {
      setIsLoading(false)
    }
  }

  const fetchEmployees = async () => {
    try {
      setIsUsersLoading(true)

      const response = await fetch("/api/employees")
      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || "Failed to load employees.")
      }

      setEmployees(
        (result.employees || []).map((employee: UserOption) => ({
          id: employee.id,
          user_id: employee.user_id,
          name: employee.name,
          email: employee.email,
        }))
      )
    } catch {
      setEmployees([])
    } finally {
      setIsUsersLoading(false)
    }
  }

  useEffect(() => {
    void fetchDocuments()
  }, [searchQuery, statusFilter, typeFilter])

  useEffect(() => {
    void fetchEmployees()
  }, [])

  const toggleAll = () => {
    if (allSelected) {
      setSelectedIds([])
      return
    }

    setSelectedIds(documents.map((document) => document.id))
  }

  const toggleOne = (id: string) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter((currentId) => currentId !== id))
      return
    }

    setSelectedIds([...selectedIds, id])
  }

  const handleDelete = async () => {
    if (!deleteDoc) {
      return
    }

    try {
      setIsDeleting(true)
      setActionError("")
      setActionSuccess("")

      const response = await fetch(`/api/documents/${deleteDoc.id}`, {
        method: "DELETE",
      })
      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || "Failed to delete document.")
      }

      setDeleteDoc(null)
      setActionSuccess("Document deleted successfully.")
      await fetchDocuments()
    } catch (error) {
      setActionError(error instanceof Error ? error.message : "Failed to delete document.")
    } finally {
      setIsDeleting(false)
    }
  }

  const handleEdit = async () => {
    if (!editDoc) {
      return
    }

    try {
      setIsSaving(true)
      setActionError("")
      setActionSuccess("")

      const response = await fetch(`/api/documents/${editDoc.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: editDoc.title,
          status: normalizeKey(editDoc.status),
          priority: normalizeKey(editDoc.priority),
        }),
      })
      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || "Failed to update document.")
      }

      setEditDoc(null)
      setActionSuccess("Document updated successfully.")
      await fetchDocuments()
    } catch (error) {
      setActionError(error instanceof Error ? error.message : "Failed to update document.")
    } finally {
      setIsSaving(false)
    }
  }

  const handleShare = async () => {
    if (!shareDoc || !selectedEmployee) {
      return
    }

    try {
      setIsSharing(true)
      setActionError("")
      setActionSuccess("")

      const response = await fetch(`/api/documents/${shareDoc.id}/share`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          employee_ids: [selectedEmployee],
          message: shareMessage || null,
          send_email: sendByEmail,
        }),
      })
      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || "Failed to share document.")
      }

      setShareDoc(null)
      setSelectedEmployee("")
      setShareMessage("")
      setSendByEmail(true)
      setActionSuccess(result.message || "Document shared successfully.")
    } catch (error) {
      setActionError(error instanceof Error ? error.message : "Failed to share document.")
    } finally {
      setIsSharing(false)
    }
  }

  return (
    <>
      <Card className="gap-0 overflow-hidden py-0">
        <div className="flex items-center justify-between gap-4 border-b border-border p-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search by title, reference, or keyword..."
              className="h-10 bg-background pl-9"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
            />
          </div>
          <div className="flex items-center gap-2">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-32">
                <SelectValue placeholder="All Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="received">Received</SelectItem>
                <SelectItem value="sent">Sent</SelectItem>
                <SelectItem value="archived">Archived</SelectItem>
              </SelectContent>
            </Select>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-36">
                <SelectValue placeholder="All Types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="received">Received</SelectItem>
                <SelectItem value="sent">Sent</SelectItem>
                <SelectItem value="contract">Contract</SelectItem>
              </SelectContent>
            </Select>
            <div className="flex items-center gap-2 rounded-md border border-border px-3 py-2 text-sm text-muted-foreground">
              <SlidersHorizontal className="size-4" />
              <span>{totalDocuments} document(s)</span>
            </div>
          </div>
        </div>

        {(actionError || actionSuccess) && (
          <div className="border-b border-border px-4 py-3">
            {actionError ? (
              <p className="rounded-md border border-destructive/20 bg-destructive/5 px-3 py-2 text-sm text-destructive">
                {actionError}
              </p>
            ) : (
              <p className="rounded-md border border-primary/20 bg-primary/5 px-3 py-2 text-sm text-primary">
                {actionSuccess}
              </p>
            )}
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                <th className="w-12 px-4 py-3">
                  <Checkbox
                    checked={allSelected}
                    onCheckedChange={toggleAll}
                    aria-label="Select all"
                    className={someSelected ? "data-[state=checked]:bg-primary" : ""}
                  />
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Document
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Reference
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Department
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Status
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Priority
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Date
                </th>
                <th className="w-12 px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {isLoading ? (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-sm text-muted-foreground">
                    Loading documents...
                  </td>
                </tr>
              ) : loadError ? (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-sm text-destructive">
                    {loadError}
                  </td>
                </tr>
              ) : documents.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-sm text-muted-foreground">
                    No documents found.
                  </td>
                </tr>
              ) : (
                documents.map((document) => (
                  <tr key={document.id} className="transition-colors hover:bg-muted/30">
                    <td className="px-4 py-3">
                      <Checkbox
                        checked={selectedIds.includes(document.id)}
                        onCheckedChange={() => toggleOne(document.id)}
                        aria-label={`Select ${document.title}`}
                      />
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <FileTypeIcon document={document} />
                        <div>
                          <p className="text-sm font-medium text-foreground">{document.title}</p>
                          <p className="text-xs text-muted-foreground">
                            {getFileKind(document)} | {formatFileSize(document.file_size)} |{" "}
                            {formatLabel(document.document_type)}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <code className="font-mono text-sm text-muted-foreground">
                        {document.document_number}
                      </code>
                    </td>
                    <td className="px-4 py-3 text-sm text-foreground">
                      {document.department_name || "Unassigned"}
                    </td>
                    <td className="px-4 py-3">
                      <Badge
                        variant="outline"
                        className={statusStyles[normalizeKey(document.status)] || statusStyles.pending}
                      >
                        {formatLabel(document.status)}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">
                      <Badge
                        variant="outline"
                        className={priorityStyles[normalizeKey(document.priority)] || priorityStyles.medium}
                      >
                        {formatLabel(document.priority)}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-sm text-muted-foreground">
                      {formatDate(document.created_at)}
                    </td>
                    <td className="px-4 py-3">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="size-8">
                            <MoreHorizontal className="size-4" />
                            <span className="sr-only">Actions</span>
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => setViewDoc(document)}>
                            <Eye className="mr-2 size-4" />
                            View
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => setEditDoc(document)}>
                            <Pencil className="mr-2 size-4" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => setShareDoc(document)}>
                            <Share2 className="mr-2 size-4" />
                            Share
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() => setDeleteDoc(document)}
                            className="text-destructive focus:text-destructive"
                          >
                            <Trash2 className="mr-2 size-4" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      <Dialog open={!!viewDoc} onOpenChange={(open) => !open && setViewDoc(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3">
              {viewDoc && <FileTypeIcon document={viewDoc} />}
              <span>Document Details</span>
            </DialogTitle>
            <DialogDescription>View document information</DialogDescription>
          </DialogHeader>
          {viewDoc && (
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Title</p>
                  <p className="text-sm text-foreground">{viewDoc.title}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Reference</p>
                  <p className="font-mono text-sm text-foreground">{viewDoc.document_number}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Department</p>
                  <p className="text-sm text-foreground">{viewDoc.department_name || "Unassigned"}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Document Type</p>
                  <p className="text-sm text-foreground">{formatLabel(viewDoc.document_type)}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">File Type</p>
                  <p className="text-sm text-foreground">{getFileKind(viewDoc)}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Size</p>
                  <p className="text-sm text-foreground">{formatFileSize(viewDoc.file_size)}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Date</p>
                  <p className="text-sm text-foreground">{formatDate(viewDoc.created_at)}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Company</p>
                  <p className="text-sm text-foreground">{viewDoc.company_name || "Not provided"}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Status</p>
                  <Badge
                    variant="outline"
                    className={statusStyles[normalizeKey(viewDoc.status)] || statusStyles.pending}
                  >
                    {formatLabel(viewDoc.status)}
                  </Badge>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Priority</p>
                  <Badge
                    variant="outline"
                    className={priorityStyles[normalizeKey(viewDoc.priority)] || priorityStyles.medium}
                  >
                    {formatLabel(viewDoc.priority)}
                  </Badge>
                </div>
              </div>
              {viewDoc.file_url && (
                <div>
                  <p className="mb-1 text-sm font-medium text-muted-foreground">File</p>
                  <a
                    href={viewDoc.file_url}
                    target="_blank"
                    rel="noreferrer"
                    className="text-sm text-primary hover:underline"
                  >
                    {viewDoc.file_name || "Open uploaded file"}
                  </a>
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setViewDoc(null)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!editDoc} onOpenChange={(open) => !open && setEditDoc(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Edit Document</DialogTitle>
            <DialogDescription>Update document information</DialogDescription>
          </DialogHeader>
          {editDoc && (
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="edit-title">Title</Label>
                <Input
                  id="edit-title"
                  value={editDoc.title}
                  onChange={(event) => setEditDoc({ ...editDoc, title: event.target.value })}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-status">Status</Label>
                  <Select
                    value={normalizeKey(editDoc.status) || "pending"}
                    onValueChange={(value) => setEditDoc({ ...editDoc, status: value })}
                  >
                    <SelectTrigger id="edit-status">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="received">Received</SelectItem>
                      <SelectItem value="sent">Sent</SelectItem>
                      <SelectItem value="archived">Archived</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-priority">Priority</Label>
                  <Select
                    value={normalizeKey(editDoc.priority) || "medium"}
                    onValueChange={(value) => setEditDoc({ ...editDoc, priority: value })}
                  >
                    <SelectTrigger id="edit-priority">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="urgent">Urgent</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDoc(null)} disabled={isSaving}>
              Cancel
            </Button>
            <Button onClick={handleEdit} disabled={isSaving}>
              {isSaving ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={!!shareDoc}
        onOpenChange={(open) => {
          if (!open) {
            setShareDoc(null)
            setSelectedEmployee("")
            setShareMessage("")
            setSendByEmail(true)
          }
        }}
      >
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Share2 className="size-5 text-primary" />
              Share Document
            </DialogTitle>
            <DialogDescription>Send this document to an employee</DialogDescription>
          </DialogHeader>
          {shareDoc && (
            <div className="space-y-4 py-4">
              <div className="rounded-lg border border-border bg-muted/50 p-3">
                <p className="text-sm font-medium">{shareDoc.title}</p>
                <p className="text-xs text-muted-foreground">{shareDoc.document_number}</p>
                <p className="mt-2 text-xs text-muted-foreground">
                  Sender: {user?.name || "Current user"}
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="share-employee">Select Employee</Label>
                <Select value={selectedEmployee} onValueChange={setSelectedEmployee}>
                  <SelectTrigger id="share-employee">
                    <SelectValue
                      placeholder={isUsersLoading ? "Loading employees..." : "Select an employee..."}
                    />
                  </SelectTrigger>
                  <SelectContent>
                    {employees.map((employee) => (
                      <SelectItem key={employee.id} value={employee.id}>
                        {employee.name} ({employee.email})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {selectedEmployee && (
                <div className="rounded-lg border border-border bg-background p-3 text-sm">
                  <p className="font-medium">Receiver</p>
                  <p className="text-muted-foreground">
                    {employees.find((employee) => employee.id === selectedEmployee)?.email || "No email"}
                  </p>
                </div>
              )}
              <div className="space-y-2">
                <Label htmlFor="share-email-mode">Delivery</Label>
                <Select
                  value={sendByEmail ? "email" : "internal"}
                  onValueChange={(value) => setSendByEmail(value === "email")}
                >
                  <SelectTrigger id="share-email-mode">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="email">Send by email</SelectItem>
                    <SelectItem value="internal">Internal share only</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="share-message">Message (optional)</Label>
                <Textarea
                  id="share-message"
                  placeholder="Add a message..."
                  value={shareMessage}
                  onChange={(event) => setShareMessage(event.target.value)}
                  rows={3}
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShareDoc(null)
                setSelectedEmployee("")
                setShareMessage("")
                setSendByEmail(true)
              }}
              disabled={isSharing}
            >
              Cancel
            </Button>
            <Button onClick={handleShare} disabled={!selectedEmployee || isSharing}>
              <Share2 className="mr-2 size-4" />
              {isSharing ? "Sending..." : "Send"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteDoc} onOpenChange={(open) => !open && setDeleteDoc(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Document</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete &quot;{deleteDoc?.title}&quot;? This action cannot
              be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
