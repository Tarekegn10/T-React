"use client"

import { useEffect, useState } from "react"
import { Header } from "@/components/header"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { AuthGuard } from "@/components/auth-guard"
import { toast } from "@/components/ui/use-toast"
import {
  Shield,
  Download,
  Database,
  Users,
  Building2,
  FileText,
  HardDrive,
  Clock,
  CheckCircle,
  AlertTriangle,
  FileSpreadsheet,
  FileIcon,
  Plus,
  Trash2,
  Eye,
  EyeOff,
  Loader2,
} from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
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

interface SystemUser {
  id: number
  username: string
  role: "admin" | "user"
  createdAt: string
}

interface BackupStats {
  users: number
  documents: number
  employees: number
  uploadedFiles: number
  storageBytes: number
}

interface LatestBackup {
  id: string
  file_name: string | null
  file_size: string | null
  status: string
  created_at: string
}

interface BackupSettings {
  auto_backup_enabled: boolean
  backup_frequency: string
  last_backup_at: string | null
}

interface BackupMetaResponse {
  stats: BackupStats
  latestBackup: LatestBackup | null
  settings: BackupSettings | null
}

interface DepartmentSummary {
  id: string
  name: string
  description: string | null
  document_count: string | number
}

const initialUsers: SystemUser[] = [
  { id: 1, username: "admin", role: "admin", createdAt: "Jan 1, 2024" },
  { id: 2, username: "user", role: "user", createdAt: "Jan 15, 2024" },
]

function formatBytes(bytes: number) {
  if (!bytes) {
    return "0 B"
  }

  const units = ["B", "KB", "MB", "GB", "TB"]
  let value = bytes
  let unitIndex = 0

  while (value >= 1024 && unitIndex < units.length - 1) {
    value /= 1024
    unitIndex += 1
  }

  return `${value >= 10 || unitIndex === 0 ? value.toFixed(0) : value.toFixed(1)} ${units[unitIndex]}`
}

function formatDateTime(value: string | null | undefined) {
  if (!value) {
    return "Not available"
  }

  return new Date(value).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  })
}

function formatRelativeTime(value: string | null | undefined) {
  if (!value) {
    return "Never"
  }

  const target = new Date(value)
  const diffMs = Date.now() - target.getTime()
  const diffMinutes = Math.max(1, Math.round(diffMs / 60000))

  if (diffMinutes < 60) {
    return `${diffMinutes}m ago`
  }

  const diffHours = Math.round(diffMinutes / 60)
  if (diffHours < 24) {
    return `${diffHours}h ago`
  }

  const diffDays = Math.round(diffHours / 24)
  return `${diffDays}d ago`
}

function getDownloadFileName(headerValue: string | null, fallback: string) {
  if (!headerValue) {
    return fallback
  }

  const match = headerValue.match(/filename="([^"]+)"/i)
  return match?.[1] || fallback
}

export default function AdminSettingsPage() {
  const [users, setUsers] = useState(initialUsers)
  const [isAddUserOpen, setIsAddUserOpen] = useState(false)
  const [deleteUser, setDeleteUser] = useState<SystemUser | null>(null)
  const [showPassword, setShowPassword] = useState(false)
  const [newUser, setNewUser] = useState({ username: "", password: "", role: "user" })
  const [autoBackup, setAutoBackup] = useState(true)
  const [backupFrequency, setBackupFrequency] = useState("daily")
  const [backupMeta, setBackupMeta] = useState<BackupMetaResponse | null>(null)
  const [isLoadingBackupMeta, setIsLoadingBackupMeta] = useState(true)
  const [backupMetaError, setBackupMetaError] = useState("")
  const [isSavingBackupSettings, setIsSavingBackupSettings] = useState(false)
  const [isDownloadingBackup, setIsDownloadingBackup] = useState(false)
  const [departments, setDepartments] = useState<DepartmentSummary[]>([])
  const [isLoadingDepartments, setIsLoadingDepartments] = useState(true)
  const [departmentsError, setDepartmentsError] = useState("")
  const [departmentToDelete, setDepartmentToDelete] = useState<DepartmentSummary | null>(null)
  const [isDeletingDepartment, setIsDeletingDepartment] = useState(false)
  const [downloadingDepartmentId, setDownloadingDepartmentId] = useState<string | null>(null)

  const handleAddUser = () => {
    const id = Math.max(...users.map((u) => u.id)) + 1
    setUsers([
      ...users,
      {
        id,
        username: newUser.username,
        role: newUser.role as "admin" | "user",
        createdAt: new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
      },
    ])
    setIsAddUserOpen(false)
    setNewUser({ username: "", password: "", role: "user" })
  }

  const handleDeleteUser = () => {
    if (deleteUser) {
      setUsers(users.filter((u) => u.id !== deleteUser.id))
      setDeleteUser(null)
    }
  }

  const handleExport = (format: "excel" | "pdf") => {
    toast({
      title: "Export not changed yet",
      description: `The ${format.toUpperCase()} export is still a placeholder. Use Download Full Backup ZIP to save all records and uploaded documents.`,
    })
  }

  const loadBackupMeta = async () => {
    try {
      setIsLoadingBackupMeta(true)
      setBackupMetaError("")

      const response = await fetch("/api/admin/backup?mode=meta", { cache: "no-store" })
      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || "Failed to load backup details.")
      }

      setBackupMeta(result)
      setAutoBackup(Boolean(result.settings?.auto_backup_enabled))
      setBackupFrequency(result.settings?.backup_frequency || "daily")
    } catch (error) {
      setBackupMetaError(error instanceof Error ? error.message : "Failed to load backup details.")
    } finally {
      setIsLoadingBackupMeta(false)
    }
  }

  const loadDepartments = async () => {
    try {
      setIsLoadingDepartments(true)
      setDepartmentsError("")

      const response = await fetch("/api/departments", { cache: "no-store" })
      const result = await response.json()
      if (!response.ok) {
        throw new Error(result.error || "Failed to load departments.")
      }

      setDepartments(result.departments || [])
    } catch (error) {
      setDepartments([])
      setDepartmentsError(error instanceof Error ? error.message : "Failed to load departments.")
    } finally {
      setIsLoadingDepartments(false)
    }
  }

  useEffect(() => {
    void loadBackupMeta()
    void loadDepartments()
  }, [])

  const handleSaveBackupSettings = async () => {
    try {
      setIsSavingBackupSettings(true)

      const response = await fetch("/api/settings", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          auto_backup_enabled: autoBackup,
          backup_frequency: backupFrequency,
        }),
      })

      const result = await response.json()
      if (!response.ok) {
        throw new Error(result.error || "Failed to save backup settings.")
      }

      setBackupMeta((current) =>
        current
          ? {
              ...current,
              settings: {
                auto_backup_enabled: Boolean(result.settings?.auto_backup_enabled),
                backup_frequency: result.settings?.backup_frequency || backupFrequency,
                last_backup_at: result.settings?.last_backup_at || current.settings?.last_backup_at || null,
              },
            }
          : current
      )

      toast({
        title: "Backup settings saved",
        description: "Automatic backup configuration was updated successfully.",
      })
    } catch (error) {
      toast({
        title: "Could not save backup settings",
        description: error instanceof Error ? error.message : "Something went wrong while saving settings.",
        variant: "destructive",
      })
    } finally {
      setIsSavingBackupSettings(false)
    }
  }

  const handleBackup = async () => {
    try {
      setIsDownloadingBackup(true)

      const response = await fetch("/api/admin/backup", {
        method: "POST",
      })

      if (!response.ok) {
        let message = "Failed to create backup."

        try {
          const result = await response.json()
          message = result.error || message
        } catch {
          message = await response.text()
        }

        throw new Error(message)
      }

      const archiveBlob = await response.blob()
      const downloadUrl = URL.createObjectURL(archiveBlob)
      const anchor = document.createElement("a")
      const fileName = getDownloadFileName(
        response.headers.get("Content-Disposition"),
        `docuflow-backup-${new Date().toISOString().replace(/[:.]/g, "-")}.zip`
      )

      anchor.href = downloadUrl
      anchor.download = fileName
      anchor.click()
      URL.revokeObjectURL(downloadUrl)

      toast({
        title: "Backup downloaded",
        description: "The full backup ZIP with all records and uploaded documents is ready.",
      })

      await loadBackupMeta()
    } catch (error) {
      toast({
        title: "Backup failed",
        description: error instanceof Error ? error.message : "Something went wrong while creating the backup.",
        variant: "destructive",
      })
    } finally {
      setIsDownloadingBackup(false)
    }
  }

  const handleDownloadDepartment = async (department: DepartmentSummary) => {
    try {
      setDownloadingDepartmentId(department.id)

      const response = await fetch(`/api/admin/departments/${department.id}/download`, {
        method: "GET",
      })

      if (!response.ok) {
        let message = "Failed to download department."

        try {
          const result = await response.json()
          message = result.error || message
        } catch {
          message = await response.text()
        }

        throw new Error(message)
      }

      const archiveBlob = await response.blob()
      const downloadUrl = URL.createObjectURL(archiveBlob)
      const anchor = document.createElement("a")
      const fileName = getDownloadFileName(
        response.headers.get("Content-Disposition"),
        `department-${department.name.toLowerCase().replace(/[^a-z0-9]+/g, "-")}.zip`
      )

      anchor.href = downloadUrl
      anchor.download = fileName
      anchor.click()
      URL.revokeObjectURL(downloadUrl)

      toast({
        title: "Department downloaded",
        description: `${department.name} was downloaded as a ZIP with its records and files.`,
      })
    } catch (error) {
      toast({
        title: "Department download failed",
        description: error instanceof Error ? error.message : "Something went wrong while downloading the department.",
        variant: "destructive",
      })
    } finally {
      setDownloadingDepartmentId(null)
    }
  }

  const handleDeleteDepartment = async () => {
    if (!departmentToDelete) {
      return
    }

    try {
      setIsDeletingDepartment(true)

      const response = await fetch(`/api/departments/${departmentToDelete.id}`, {
        method: "DELETE",
      })

      const result = await response.json()
      if (!response.ok) {
        throw new Error(result.error || "Failed to delete department.")
      }

      setDepartmentToDelete(null)
      window.dispatchEvent(new CustomEvent("departments-updated"))
      await loadDepartments()

      toast({
        title: "Department deleted",
        description: `${result.department?.name || "Department"} was deleted. Related users, employees, and documents were kept and unassigned from that department.`,
      })
    } catch (error) {
      toast({
        title: "Could not delete department",
        description: error instanceof Error ? error.message : "Something went wrong while deleting the department.",
        variant: "destructive",
      })
    } finally {
      setIsDeletingDepartment(false)
    }
  }

  const stats = backupMeta?.stats
  const latestBackup = backupMeta?.latestBackup
  const hasSuccessfulBackup = latestBackup?.status === "completed"

  return (
    <AuthGuard requireAdmin>
      <Header title="Admin Settings" description="System administration and backup controls" />
      <main className="flex-1 overflow-auto p-6">
        <div className="space-y-6">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10">
                    <Users className="size-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{stats?.users ?? users.length}</p>
                    <p className="text-sm text-muted-foreground">System Users</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="flex size-10 items-center justify-center rounded-lg bg-blue-50">
                    <FileText className="size-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{stats?.documents ?? 0}</p>
                    <p className="text-sm text-muted-foreground">Total Documents</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="flex size-10 items-center justify-center rounded-lg bg-amber-50">
                    <HardDrive className="size-5 text-amber-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{formatBytes(stats?.storageBytes ?? 0)}</p>
                    <p className="text-sm text-muted-foreground">
                      Storage Used{stats ? ` • ${stats.uploadedFiles} files` : ""}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="flex size-10 items-center justify-center rounded-lg bg-emerald-50">
                    <Clock className="size-5 text-emerald-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{formatRelativeTime(latestBackup?.created_at || backupMeta?.settings?.last_backup_at)}</p>
                    <p className="text-sm text-muted-foreground">Last Backup</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="size-5 text-primary" />
                  User Management
                </CardTitle>
                <CardDescription>Create and manage system user accounts</CardDescription>
              </div>
              <Button onClick={() => setIsAddUserOpen(true)}>
                <Plus className="mr-2 size-4" />
                Create User
              </Button>
            </CardHeader>
            <CardContent>
              <div className="overflow-hidden rounded-lg border border-border">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border bg-muted/30">
                      <th className="px-4 py-3 text-left text-xs font-medium uppercase text-muted-foreground">Username</th>
                      <th className="px-4 py-3 text-left text-xs font-medium uppercase text-muted-foreground">Role</th>
                      <th className="px-4 py-3 text-left text-xs font-medium uppercase text-muted-foreground">Created</th>
                      <th className="px-4 py-3 text-left text-xs font-medium uppercase text-muted-foreground">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {users.map((user) => (
                      <tr key={user.id} className="hover:bg-muted/30">
                        <td className="px-4 py-3 text-sm font-medium">{user.username}</td>
                        <td className="px-4 py-3">
                          <Badge
                            variant="outline"
                            className={user.role === "admin"
                              ? "border-primary/20 bg-primary/10 text-primary"
                              : "border-slate-200 bg-slate-100 text-slate-600"}
                          >
                            {user.role}
                          </Badge>
                        </td>
                        <td className="px-4 py-3 text-sm text-muted-foreground">{user.createdAt}</td>
                        <td className="px-4 py-3">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-destructive hover:text-destructive"
                            onClick={() => setDeleteUser(user)}
                            disabled={user.username === "admin"}
                          >
                            <Trash2 className="size-4" />
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="size-5 text-primary" />
                Department Management
              </CardTitle>
              <CardDescription>Delete a department or download only that department&apos;s full ZIP from Admin Settings</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="rounded-lg border border-border bg-muted/20 p-4 text-sm text-muted-foreground">
                Deleting a department does not delete documents, users, or employees. Their department assignment is cleared automatically.
              </div>

              {departmentsError ? (
                <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
                  {departmentsError}
                </div>
              ) : null}

              <div className="overflow-hidden rounded-lg border border-border">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border bg-muted/30">
                      <th className="px-4 py-3 text-left text-xs font-medium uppercase text-muted-foreground">Department</th>
                      <th className="px-4 py-3 text-left text-xs font-medium uppercase text-muted-foreground">Description</th>
                      <th className="px-4 py-3 text-left text-xs font-medium uppercase text-muted-foreground">Documents</th>
                      <th className="px-4 py-3 text-left text-xs font-medium uppercase text-muted-foreground">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {isLoadingDepartments ? (
                      <tr>
                        <td colSpan={4} className="px-4 py-8 text-center text-sm text-muted-foreground">
                          Loading departments...
                        </td>
                      </tr>
                    ) : departments.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="px-4 py-8 text-center text-sm text-muted-foreground">
                          No departments found.
                        </td>
                      </tr>
                    ) : (
                      departments.map((department) => (
                        <tr key={department.id} className="hover:bg-muted/30">
                          <td className="px-4 py-3 text-sm font-medium">{department.name}</td>
                          <td className="px-4 py-3 text-sm text-muted-foreground">
                            {department.description || "No description"}
                          </td>
                          <td className="px-4 py-3 text-sm text-muted-foreground">
                            {Number(department.document_count || 0)}
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex flex-wrap gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => void handleDownloadDepartment(department)}
                                disabled={downloadingDepartmentId === department.id}
                              >
                                {downloadingDepartmentId === department.id ? (
                                  <Loader2 className="mr-2 size-4 animate-spin" />
                                ) : (
                                  <Download className="mr-2 size-4" />
                                )}
                                Download ZIP
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-destructive hover:text-destructive"
                                onClick={() => setDepartmentToDelete(department)}
                                disabled={isDeletingDepartment}
                              >
                                <Trash2 className="mr-2 size-4" />
                                Delete
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="size-5 text-primary" />
                Backup System
              </CardTitle>
              <CardDescription>Save and download all records, files, and uploaded documents in one full backup ZIP</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {backupMetaError ? (
                <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
                  {backupMetaError}
                </div>
              ) : null}

              <div className="flex items-center justify-between rounded-lg border border-border p-4">
                <div className="flex items-center gap-3">
                  <div className={`flex size-10 items-center justify-center rounded-lg ${hasSuccessfulBackup ? "bg-emerald-50" : "bg-amber-50"}`}>
                    {hasSuccessfulBackup ? (
                      <CheckCircle className="size-5 text-emerald-600" />
                    ) : (
                      <AlertTriangle className="size-5 text-amber-600" />
                    )}
                  </div>
                  <div>
                    <p className="text-sm font-medium">Last Backup Status</p>
                    {isLoadingBackupMeta ? (
                      <p className="text-xs text-muted-foreground">Loading backup details...</p>
                    ) : latestBackup ? (
                      <p className="text-xs text-muted-foreground">
                        {latestBackup.file_name || "Backup archive"} • {formatBytes(Number(latestBackup.file_size || 0))} • {formatDateTime(latestBackup.created_at)}
                      </p>
                    ) : (
                      <p className="text-xs text-muted-foreground">
                        No backup downloaded yet. The ZIP will include database records, uploaded files, and documents.
                      </p>
                    )}
                  </div>
                </div>
                <Badge
                  variant="outline"
                  className={hasSuccessfulBackup
                    ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                    : "border-amber-200 bg-amber-50 text-amber-700"}
                >
                  {latestBackup?.status || "Pending"}
                </Badge>
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="flex items-center justify-between rounded-lg border border-border p-4">
                  <div>
                    <p className="text-sm font-medium">Automatic Backup</p>
                    <p className="text-xs text-muted-foreground">Save your backup schedule in system settings</p>
                  </div>
                  <Switch checked={autoBackup} onCheckedChange={setAutoBackup} />
                </div>
                <div className="space-y-2">
                  <Label>Backup Frequency</Label>
                  <Select value={backupFrequency} onValueChange={setBackupFrequency} disabled={!autoBackup}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="hourly">Hourly</SelectItem>
                      <SelectItem value="daily">Daily</SelectItem>
                      <SelectItem value="weekly">Weekly</SelectItem>
                      <SelectItem value="monthly">Monthly</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                <Button variant="outline" onClick={handleSaveBackupSettings} disabled={isSavingBackupSettings}>
                  {isSavingBackupSettings ? <Loader2 className="mr-2 size-4 animate-spin" /> : <Clock className="mr-2 size-4" />}
                  Save Backup Settings
                </Button>
                <Button onClick={handleBackup} disabled={isDownloadingBackup}>
                  {isDownloadingBackup ? <Loader2 className="mr-2 size-4 animate-spin" /> : <Database className="mr-2 size-4" />}
                  Download Full Backup ZIP
                </Button>
              </div>

              <div className="rounded-lg border border-border bg-muted/20 p-4 text-sm text-muted-foreground">
                This backup contains users, employees, documents, shares, activities, notifications, sessions, settings, and every uploaded file from storage.
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Download className="size-5 text-primary" />
                Export Data
              </CardTitle>
              <CardDescription>Download all system data in various formats</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <button
                  onClick={() => handleExport("excel")}
                  className="flex items-center gap-4 rounded-lg border border-border p-4 text-left transition-colors hover:bg-muted/50"
                >
                  <div className="flex size-12 items-center justify-center rounded-lg bg-green-50">
                    <FileSpreadsheet className="size-6 text-green-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">Export as Excel</p>
                    <p className="text-xs text-muted-foreground">Download all data as .xlsx file</p>
                  </div>
                </button>
                <button
                  onClick={() => handleExport("pdf")}
                  className="flex items-center gap-4 rounded-lg border border-border p-4 text-left transition-colors hover:bg-muted/50"
                >
                  <div className="flex size-12 items-center justify-center rounded-lg bg-red-50">
                    <FileIcon className="size-6 text-red-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">Export as PDF</p>
                    <p className="text-xs text-muted-foreground">Download all data as .pdf file</p>
                  </div>
                </button>
              </div>
            </CardContent>
          </Card>
        </div>

        <Dialog open={isAddUserOpen} onOpenChange={setIsAddUserOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Create New User</DialogTitle>
              <DialogDescription>Add a new system user account</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="new-username">Username *</Label>
                <Input
                  id="new-username"
                  placeholder="Enter username"
                  value={newUser.username}
                  onChange={(e) => setNewUser({ ...newUser, username: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="new-password">Password *</Label>
                <div className="relative">
                  <Input
                    id="new-password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter password"
                    value={newUser.password}
                    onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                    className="pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                  </button>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="new-role">Role *</Label>
                <Select
                  value={newUser.role}
                  onValueChange={(value) => setNewUser({ ...newUser, role: value })}
                >
                  <SelectTrigger id="new-role">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="user">User</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsAddUserOpen(false)}>Cancel</Button>
              <Button
                onClick={handleAddUser}
                disabled={!newUser.username || !newUser.password}
              >
                Create User
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <AlertDialog open={!!deleteUser} onOpenChange={() => setDeleteUser(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete User</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete user &quot;{deleteUser?.username}&quot;? This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleDeleteUser} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        <AlertDialog open={!!departmentToDelete} onOpenChange={() => setDepartmentToDelete(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Department</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete department &quot;{departmentToDelete?.name}&quot;? Documents, users, and employees will be kept, but their department will be cleared.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={isDeletingDepartment}>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDeleteDepartment}
                disabled={isDeletingDepartment}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                {isDeletingDepartment ? "Deleting..." : "Delete Department"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </main>
    </AuthGuard>
  )
}
