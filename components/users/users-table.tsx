"use client"

import { useEffect, useState } from "react"
import { Eye, Loader2, Mail, MoreHorizontal, Pencil, Phone, Plus, Search, Trash2 } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Label } from "@/components/ui/label"
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

type EmployeeStatus = "active" | "inactive"

interface Department {
  id: string
  name: string
}

interface Employee {
  id: string
  name: string
  email: string
  phone?: string | null
  position?: string | null
  department_id?: string | null
  department_name?: string | null
  status: EmployeeStatus
  last_active?: string | null
}

interface SharedDocument {
  id: string
  file_name: string | null
  title: string
  document_number: string
  shared_at: string
}

interface EmployeeForm {
  name: string
  email: string
  phone: string
  position: string
  departmentId: string
  status: EmployeeStatus
}

interface EmployeesTableProps {
  showAddButton?: boolean
  onAddClick?: () => void
}

const NO_DEPARTMENT = "__none__"

const statusStyles: Record<EmployeeStatus, string> = {
  active: "bg-primary/10 text-primary border-primary/20",
  inactive: "bg-slate-100 text-slate-600 border-slate-200",
}

function getInitials(name: string) {
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .toUpperCase()
    .slice(0, 2)
}

function formatLastActive(value?: string | null) {
  if (!value) return "Never"
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return "Unknown"
  const diffMinutes = Math.floor((Date.now() - date.getTime()) / 60000)
  if (diffMinutes < 1) return "Just now"
  if (diffMinutes < 60) return `${diffMinutes} minute${diffMinutes === 1 ? "" : "s"} ago`
  const diffHours = Math.floor(diffMinutes / 60)
  if (diffHours < 24) return `${diffHours} hour${diffHours === 1 ? "" : "s"} ago`
  const diffDays = Math.floor(diffHours / 24)
  if (diffDays < 7) return `${diffDays} day${diffDays === 1 ? "" : "s"} ago`
  return date.toLocaleDateString()
}

function emptyForm(): EmployeeForm {
  return {
    name: "",
    email: "",
    phone: "",
    position: "",
    departmentId: NO_DEPARTMENT,
    status: "active",
  }
}

function toForm(employee: Employee): EmployeeForm {
  return {
    name: employee.name,
    email: employee.email,
    phone: employee.phone || "",
    position: employee.position || "",
    departmentId: employee.department_id || NO_DEPARTMENT,
    status: employee.status,
  }
}

export function UsersTable({ showAddButton = false, onAddClick }: EmployeesTableProps) {
  const [employees, setEmployees] = useState<Employee[]>([])
  const [departments, setDepartments] = useState<Department[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [message, setMessage] = useState("")
  const [error, setError] = useState("")
  const [viewEmployee, setViewEmployee] = useState<Employee | null>(null)
  const [viewSharedDocuments, setViewSharedDocuments] = useState<SharedDocument[]>([])
  const [isViewLoading, setIsViewLoading] = useState(false)
  const [editEmployee, setEditEmployee] = useState<Employee | null>(null)
  const [editForm, setEditForm] = useState<EmployeeForm | null>(null)
  const [deleteEmployee, setDeleteEmployee] = useState<Employee | null>(null)
  const [isAddOpen, setIsAddOpen] = useState(false)
  const [newEmployee, setNewEmployee] = useState<EmployeeForm>(emptyForm())

  const filteredEmployees = employees.filter((employee) => {
    const query = searchQuery.trim().toLowerCase()
    if (!query) return true
    return (
      employee.name.toLowerCase().includes(query) ||
      employee.email.toLowerCase().includes(query) ||
      (employee.phone || "").toLowerCase().includes(query) ||
      (employee.position || "").toLowerCase().includes(query)
    )
  })

  const loadEmployees = async () => {
    const response = await fetch("/api/employees", { credentials: "same-origin" })
    const result = await response.json()
    if (!response.ok) throw new Error(result.error || "Failed to load employees.")
    setEmployees(result.employees || [])
  }

  const loadDepartments = async () => {
    const response = await fetch("/api/departments", { credentials: "same-origin" })
    const result = await response.json()
    if (!response.ok) throw new Error(result.error || "Failed to load departments.")
    setDepartments(result.departments || [])
  }

  useEffect(() => {
    let ignore = false
    const loadData = async () => {
      try {
        setIsLoading(true)
        setError("")
        await Promise.all([loadEmployees(), loadDepartments()])
      } catch (loadError) {
        if (!ignore) setError(loadError instanceof Error ? loadError.message : "Failed to load employees.")
      } finally {
        if (!ignore) setIsLoading(false)
      }
    }
    void loadData()
    return () => {
      ignore = true
    }
  }, [])

  const clearFeedback = () => {
    setMessage("")
    setError("")
  }

  const refreshEmployees = async () => {
    await loadEmployees()
  }

  const handleAdd = async () => {
    clearFeedback()
    setIsSaving(true)
    try {
      const response = await fetch("/api/employees", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({
          name: newEmployee.name.trim(),
          email: newEmployee.email.trim(),
          phone: newEmployee.phone.trim() || null,
          position: newEmployee.position.trim() || null,
          department_id: newEmployee.departmentId === NO_DEPARTMENT ? null : newEmployee.departmentId,
          status: newEmployee.status,
        }),
      })
      const result = await response.json()
      if (!response.ok) throw new Error(result.error || "Failed to create employee.")
      await refreshEmployees()
      setMessage("Employee saved successfully.")
      setIsAddOpen(false)
      setNewEmployee(emptyForm())
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Failed to create employee.")
    } finally {
      setIsSaving(false)
    }
  }

  const handleEdit = async () => {
    if (!editEmployee || !editForm) return
    clearFeedback()
    setIsSaving(true)
    try {
      const response = await fetch(`/api/employees/${editEmployee.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({
          name: editForm.name.trim(),
          email: editForm.email.trim(),
          phone: editForm.phone.trim() || null,
          position: editForm.position.trim() || null,
          department_id: editForm.departmentId === NO_DEPARTMENT ? null : editForm.departmentId,
          status: editForm.status,
        }),
      })
      const result = await response.json()
      if (!response.ok) throw new Error(result.error || "Failed to update employee.")
      await refreshEmployees()
      setMessage("Employee updated successfully.")
      setEditEmployee(null)
      setEditForm(null)
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Failed to update employee.")
    } finally {
      setIsSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!deleteEmployee) return
    clearFeedback()
    setIsDeleting(true)
    try {
      const response = await fetch(`/api/employees/${deleteEmployee.id}`, {
        method: "DELETE",
        credentials: "same-origin",
      })
      const result = await response.json()
      if (!response.ok) throw new Error(result.error || "Failed to delete employee.")
      await refreshEmployees()
      setMessage("Employee deleted successfully.")
      setDeleteEmployee(null)
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : "Failed to delete employee.")
    } finally {
      setIsDeleting(false)
    }
  }

  const openAdd = () => {
    onAddClick?.()
    clearFeedback()
    setNewEmployee(emptyForm())
    setIsAddOpen(true)
  }

  const openEdit = (employee: Employee) => {
    clearFeedback()
    setEditEmployee(employee)
    setEditForm(toForm(employee))
  }

  const openView = async (employee: Employee) => {
    clearFeedback()
    setViewEmployee(employee)
    setViewSharedDocuments([])
    setIsViewLoading(true)

    try {
      const response = await fetch(`/api/employees/${employee.id}`, {
        credentials: "same-origin",
      })
      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || "Failed to load employee details.")
      }

      setViewEmployee(result.employee || employee)
      setViewSharedDocuments(result.shared_documents || [])
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Failed to load employee details.")
    } finally {
      setIsViewLoading(false)
    }
  }

  return (
    <>
      <Card className="gap-0 overflow-hidden py-0">
        <div className="flex items-center justify-between gap-4 border-b border-border p-4">
          <div className="relative max-w-md flex-1">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search employees..."
              className="h-10 bg-background pl-9"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
            />
          </div>
          {showAddButton && (
            <Button onClick={openAdd}>
              <Plus className="mr-2 size-4" />
              Add Employee
            </Button>
          )}
        </div>

        {(error || message) && (
          <div className="border-b border-border px-4 py-3 text-sm">
            {error ? <p className="text-destructive">{error}</p> : <p className="text-emerald-600">{message}</p>}
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">Employee</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">Phone</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">Position</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">Department</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">Last Active</th>
                <th className="w-12 px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="px-6 py-10 text-center text-sm text-muted-foreground">
                    <span className="inline-flex items-center gap-2">
                      <Loader2 className="size-4 animate-spin" />
                      Loading employees...
                    </span>
                  </td>
                </tr>
              ) : filteredEmployees.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-10 text-center text-sm text-muted-foreground">No employees found.</td>
                </tr>
              ) : (
                filteredEmployees.map((employee) => (
                  <tr key={employee.id} className="transition-colors hover:bg-muted/30">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <Avatar className="size-9 border-2 border-primary/20">
                          <AvatarFallback className="bg-primary/10 text-sm font-medium text-primary">
                            {getInitials(employee.name)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="text-sm font-medium text-foreground">{employee.name}</p>
                          <p className="text-xs text-muted-foreground">{employee.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-foreground">{employee.phone || "Not provided"}</td>
                    <td className="px-6 py-4 text-sm text-foreground">{employee.position || "Not set"}</td>
                    <td className="px-6 py-4 text-sm text-foreground">{employee.department_name || "No department"}</td>
                    <td className="px-6 py-4">
                      <Badge variant="outline" className={statusStyles[employee.status]}>{employee.status}</Badge>
                    </td>
                    <td className="px-6 py-4 text-sm text-muted-foreground">{formatLastActive(employee.last_active)}</td>
                    <td className="px-6 py-4">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="size-8">
                            <MoreHorizontal className="size-4" />
                            <span className="sr-only">Actions</span>
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => void openView(employee)}>
                            <Eye className="mr-2 size-4" />
                            View
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => openEdit(employee)}>
                            <Pencil className="mr-2 size-4" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() => setDeleteEmployee(employee)}
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

      <Dialog open={!!viewEmployee} onOpenChange={() => setViewEmployee(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Employee Details</DialogTitle>
            <DialogDescription>View employee information</DialogDescription>
          </DialogHeader>
          {viewEmployee && (
            <div className="space-y-4 py-4">
              <div className="flex items-center gap-4">
                <Avatar className="size-16 border-2 border-primary/20">
                  <AvatarFallback className="bg-primary/10 text-lg font-medium text-primary">{getInitials(viewEmployee.name)}</AvatarFallback>
                </Avatar>
                <div>
                  <p className="text-lg font-semibold">{viewEmployee.name}</p>
                  <p className="text-sm text-muted-foreground">{viewEmployee.position || "No position set"}</p>
                </div>
              </div>
              <div className="space-y-3 pt-2">
                <div className="flex items-center gap-3 text-sm">
                  <Mail className="size-4 text-muted-foreground" />
                  <span>{viewEmployee.email}</span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <Phone className="size-4 text-muted-foreground" />
                  <span>{viewEmployee.phone || "Not provided"}</span>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4 pt-2">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Department</p>
                  <p className="text-sm">{viewEmployee.department_name || "No department"}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Status</p>
                  <Badge variant="outline" className={statusStyles[viewEmployee.status]}>{viewEmployee.status}</Badge>
                </div>
              </div>
              <div className="pt-2">
                <p className="mb-2 text-sm font-medium text-muted-foreground">Sent Files</p>
                {isViewLoading ? (
                  <p className="text-sm text-muted-foreground">Loading file list...</p>
                ) : viewSharedDocuments.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No files have been sent to this employee yet.</p>
                ) : (
                  <div className="max-h-40 space-y-2 overflow-auto rounded-md border border-border p-3">
                    {viewSharedDocuments.map((document) => (
                      <p key={`${document.id}-${document.shared_at}`} className="text-sm text-foreground">
                        {document.file_name || document.title}
                      </p>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setViewEmployee(null)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!editForm} onOpenChange={(open) => !open && !isSaving && (setEditEmployee(null), setEditForm(null))}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Employee</DialogTitle>
            <DialogDescription>Update employee information</DialogDescription>
          </DialogHeader>
          {editForm && (
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="edit-name">Full Name *</Label>
                <Input id="edit-name" value={editForm.name} onChange={(event) => setEditForm({ ...editForm, name: event.target.value })} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-email">Email *</Label>
                <Input id="edit-email" type="email" value={editForm.email} onChange={(event) => setEditForm({ ...editForm, email: event.target.value })} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-phone">Phone</Label>
                <Input id="edit-phone" value={editForm.phone} onChange={(event) => setEditForm({ ...editForm, phone: event.target.value })} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-position">Position</Label>
                <Input id="edit-position" value={editForm.position} onChange={(event) => setEditForm({ ...editForm, position: event.target.value })} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-department">Department</Label>
                  <Select value={editForm.departmentId} onValueChange={(value) => setEditForm({ ...editForm, departmentId: value })}>
                    <SelectTrigger id="edit-department"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value={NO_DEPARTMENT}>No department</SelectItem>
                      {departments.map((department) => (
                        <SelectItem key={department.id} value={department.id}>{department.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-status">Status</Label>
                  <Select value={editForm.status} onValueChange={(value: EmployeeStatus) => setEditForm({ ...editForm, status: value })}>
                    <SelectTrigger id="edit-status"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="inactive">Inactive</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => { setEditEmployee(null); setEditForm(null) }} disabled={isSaving}>Cancel</Button>
            <Button onClick={handleEdit} disabled={isSaving || !editForm?.name.trim() || !editForm?.email.trim()}>
              {isSaving ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isAddOpen} onOpenChange={(open) => !open && !isSaving ? (setIsAddOpen(false), setNewEmployee(emptyForm())) : setIsAddOpen(open)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Add New Employee</DialogTitle>
            <DialogDescription>Create a separate employee record</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="new-name">Full Name *</Label>
              <Input id="new-name" value={newEmployee.name} onChange={(event) => setNewEmployee({ ...newEmployee, name: event.target.value })} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="new-email">Email *</Label>
              <Input id="new-email" type="email" value={newEmployee.email} onChange={(event) => setNewEmployee({ ...newEmployee, email: event.target.value })} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="new-phone">Phone</Label>
              <Input id="new-phone" value={newEmployee.phone} onChange={(event) => setNewEmployee({ ...newEmployee, phone: event.target.value })} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="new-position">Position</Label>
              <Input id="new-position" value={newEmployee.position} onChange={(event) => setNewEmployee({ ...newEmployee, position: event.target.value })} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="new-department">Department</Label>
                <Select value={newEmployee.departmentId} onValueChange={(value) => setNewEmployee({ ...newEmployee, departmentId: value })}>
                  <SelectTrigger id="new-department"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value={NO_DEPARTMENT}>No department</SelectItem>
                    {departments.map((department) => (
                      <SelectItem key={department.id} value={department.id}>{department.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="new-status">Status</Label>
                <Select value={newEmployee.status} onValueChange={(value: EmployeeStatus) => setNewEmployee({ ...newEmployee, status: value })}>
                  <SelectTrigger id="new-status"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setIsAddOpen(false); setNewEmployee(emptyForm()) }} disabled={isSaving}>Cancel</Button>
            <Button onClick={handleAdd} disabled={isSaving || !newEmployee.name.trim() || !newEmployee.email.trim()}>
              {isSaving ? "Saving..." : "Add Employee"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteEmployee} onOpenChange={() => setDeleteEmployee(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Employee</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete &quot;{deleteEmployee?.name}&quot;? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} disabled={isDeleting} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              {isDeleting ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
