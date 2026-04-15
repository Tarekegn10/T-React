"use client"

import { useEffect, useState } from "react"
import {
  DollarSign,
  Users,
  Landmark,
  Settings,
  LayoutGrid,
  Monitor,
  ArrowLeft,
  FileText,
  Plus,
  Loader2,
} from "lucide-react"
import { useAuth } from "@/contexts/auth-context"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "@/components/ui/use-toast"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

interface CategoryItem {
  id: string
  name: string
  document_count: string | number
}

interface DepartmentDocument {
  id: string
  title: string
  document_number: string
  status: string
  priority: string
  created_at: string
}

const iconMap = [
  { matcher: "finance", icon: DollarSign, iconBg: "bg-red-50", iconColor: "text-red-500" },
  { matcher: "human", icon: Users, iconBg: "bg-primary/10", iconColor: "text-primary" },
  { matcher: "legal", icon: Landmark, iconBg: "bg-amber-50", iconColor: "text-amber-600" },
  { matcher: "operation", icon: Settings, iconBg: "bg-primary/10", iconColor: "text-primary" },
  { matcher: "marketing", icon: LayoutGrid, iconBg: "bg-red-50", iconColor: "text-red-500" },
  { matcher: "it", icon: Monitor, iconBg: "bg-slate-100", iconColor: "text-slate-600" },
]

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

function formatDate(dateString: string) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(dateString))
}

function getDepartmentMeta(name: string) {
  const normalized = name.toLowerCase()
  const matched = iconMap.find((item) => normalized.includes(item.matcher))
  return matched || { icon: FileText, iconBg: "bg-slate-100", iconColor: "text-slate-600" }
}

export function CategoryGrid() {
  const { isAdmin } = useAuth()
  const [categories, setCategories] = useState<CategoryItem[]>([])
  const [selectedCategory, setSelectedCategory] = useState<CategoryItem | null>(null)
  const [documents, setDocuments] = useState<DepartmentDocument[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isDocumentsLoading, setIsDocumentsLoading] = useState(false)
  const [error, setError] = useState("")
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [isCreatingDepartment, setIsCreatingDepartment] = useState(false)
  const [newDepartmentName, setNewDepartmentName] = useState("")
  const [newDepartmentDescription, setNewDepartmentDescription] = useState("")

  const loadDepartments = async () => {
    try {
      setError("")
      setIsLoading(true)
      const response = await fetch("/api/departments")
      const result = await response.json()
      if (!response.ok) {
        throw new Error(result.error || "Failed to load departments.")
      }

      setCategories(result.departments || [])
    } catch (loadError) {
      setCategories([])
      setError(loadError instanceof Error ? loadError.message : "Failed to load departments.")
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    void loadDepartments()
  }, [])

  useEffect(() => {
    const loadDepartmentDocuments = async () => {
      if (!selectedCategory) {
        setDocuments([])
        return
      }

      try {
        setIsDocumentsLoading(true)
        const response = await fetch(`/api/documents?department_id=${selectedCategory.id}&limit=100`)
        const result = await response.json()
        if (!response.ok) {
          throw new Error(result.error || "Failed to load department documents.")
        }

        setDocuments(result.documents || [])
      } catch {
        setDocuments([])
      } finally {
        setIsDocumentsLoading(false)
      }
    }

    void loadDepartmentDocuments()
  }, [selectedCategory])

  const resetCreateDepartmentForm = () => {
    setNewDepartmentName("")
    setNewDepartmentDescription("")
  }

  const handleCreateDepartment = async () => {
    if (!newDepartmentName.trim()) {
      toast({
        title: "Department name required",
        description: "Enter a department name before saving.",
        variant: "destructive",
      })
      return
    }

    try {
      setIsCreatingDepartment(true)

      const response = await fetch("/api/departments", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: newDepartmentName.trim(),
          description: newDepartmentDescription.trim() || null,
        }),
      })

      const result = await response.json()
      if (!response.ok) {
        throw new Error(result.error || "Failed to create department.")
      }

      await loadDepartments()
      window.dispatchEvent(new CustomEvent("departments-updated"))
      setIsCreateOpen(false)
      resetCreateDepartmentForm()

      toast({
        title: "Department created",
        description: `${result.department?.name || newDepartmentName.trim()} is now available in Categories & Folders and upload forms.`,
      })
    } catch (createError) {
      toast({
        title: "Could not create department",
        description: createError instanceof Error ? createError.message : "Something went wrong while creating the department.",
        variant: "destructive",
      })
    } finally {
      setIsCreatingDepartment(false)
    }
  }

  if (selectedCategory) {
    return (
      <div>
        <Button
          variant="ghost"
          className="mb-4 -ml-2 text-foreground hover:text-primary"
          onClick={() => setSelectedCategory(null)}
        >
          <ArrowLeft className="mr-2 size-4" />
          Back to Departments
        </Button>

        <div className="mb-6">
          <h2 className="text-2xl font-bold text-foreground">{selectedCategory.name}</h2>
          <p className="text-sm text-muted-foreground">
            {documents.length} documents in this department
          </p>
        </div>

        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Document</TableHead>
                <TableHead>Reference</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Priority</TableHead>
                <TableHead>Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isDocumentsLoading ? (
                <TableRow>
                  <TableCell colSpan={5} className="h-32 text-center text-muted-foreground">
                    Loading documents...
                  </TableCell>
                </TableRow>
              ) : documents.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="h-32 text-center text-muted-foreground">
                    No documents in this department
                  </TableCell>
                </TableRow>
              ) : (
                documents.map((document) => (
                  <TableRow key={document.id}>
                    <TableCell>{document.title}</TableCell>
                    <TableCell>{document.document_number}</TableCell>
                    <TableCell>{formatLabel(document.status)}</TableCell>
                    <TableCell>{formatLabel(document.priority)}</TableCell>
                    <TableCell>{formatDate(document.created_at)}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </Card>
      </div>
    )
  }

  if (isLoading) {
    return <Card className="p-6 text-sm text-muted-foreground">Loading departments...</Card>
  }

  if (error) {
    return <Card className="p-6 text-sm text-destructive">{error}</Card>
  }

  return (
    <>
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-semibold text-foreground">Departments</h2>
          <p className="text-sm text-muted-foreground">Open a department to view its documents and folders.</p>
        </div>
        {isAdmin ? (
          <Button onClick={() => setIsCreateOpen(true)}>
            <Plus className="mr-2 size-4" />
            Create Department
          </Button>
        ) : null}
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {categories.map((category) => {
          const meta = getDepartmentMeta(category.name)
          const count = Number(category.document_count || 0)

          return (
            <Card
              key={category.id}
              className="group cursor-pointer p-5 transition-all hover:border-primary/50 hover:shadow-md"
              onClick={() => setSelectedCategory(category)}
            >
              <div className={`mb-4 w-fit rounded-xl p-3 ${meta.iconBg}`}>
                <meta.icon className={`size-6 ${meta.iconColor}`} />
              </div>
              <h3 className="font-semibold text-foreground transition-colors group-hover:text-primary">
                {category.name}
              </h3>
              <p className="mt-1 flex items-center gap-1 text-sm text-muted-foreground">
                <FileText className="size-3.5" />
                {count} documents
              </p>
            </Card>
          )
        })}
      </div>

      <Dialog
        open={isCreateOpen}
        onOpenChange={(open) => {
          setIsCreateOpen(open)
          if (!open) {
            resetCreateDepartmentForm()
          }
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Create Department</DialogTitle>
            <DialogDescription>Add another department so documents can be organized under it.</DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="department-name">Department Name</Label>
              <Input
                id="department-name"
                placeholder="Enter department name"
                value={newDepartmentName}
                onChange={(event) => setNewDepartmentName(event.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="department-description">Description</Label>
              <Textarea
                id="department-description"
                placeholder="Optional description"
                value={newDepartmentDescription}
                onChange={(event) => setNewDepartmentDescription(event.target.value)}
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateOpen(false)} disabled={isCreatingDepartment}>
              Cancel
            </Button>
            <Button onClick={() => void handleCreateDepartment()} disabled={isCreatingDepartment}>
              {isCreatingDepartment ? <Loader2 className="mr-2 size-4 animate-spin" /> : <Plus className="mr-2 size-4" />}
              Create Department
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
