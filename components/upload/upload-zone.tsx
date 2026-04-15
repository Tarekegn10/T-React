"use client"

import { useState, useCallback, useEffect } from "react"
import { Upload, Check, X, FileText, Send, Inbox } from "lucide-react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { useAuth } from "@/contexts/auth-context"
import {
  Dialog,
  DialogContent,
  DialogDescription,
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

interface DepartmentOption {
  id: string
  name: string
}

type FileType = "received" | "sent" | "contract" | null

type FormState = {
  documentNumber: string
  dayAndDate: string
  receivedDate: string
  toWhom: string
  sentDate: string
  forwardedTo: string
  ethiopianDate: string
  companyName: string
  address: string
  department: string
  subject: string
  remark: string
}

const emptyForm: FormState = {
  documentNumber: "",
  dayAndDate: "",
  receivedDate: "",
  toWhom: "",
  sentDate: "",
  forwardedTo: "",
  ethiopianDate: "",
  companyName: "",
  address: "",
  department: "",
  subject: "",
  remark: "",
}

export function UploadZone() {
  const { user } = useAuth()
  const [departments, setDepartments] = useState<DepartmentOption[]>([])
  const [isDragging, setIsDragging] = useState(false)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isModalDragging, setIsModalDragging] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [fileType, setFileType] = useState<FileType>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState("")
  const [submitSuccess, setSubmitSuccess] = useState("")
  const [formData, setFormData] = useState<FormState>(emptyForm)

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

    const refreshDepartments = () => {
      void loadDepartments()
    }

    void loadDepartments()
    window.addEventListener("departments-updated", refreshDepartments)

    return () => {
      window.removeEventListener("departments-updated", refreshDepartments)
    }
  }, [])

  const setField = (field: keyof FormState, value: string) => {
    setFormData((current) => ({ ...current, [field]: value }))
  }

  const validateForm = () => {
    if (!user) {
      return "You must be logged in to upload."
    }
    if (!fileType) {
      return "Select a document type."
    }
    if (!selectedFile) {
      return "Choose a file to upload."
    }
    if (!formData.documentNumber.trim()) {
      return "Document number is required."
    }
    if (!formData.companyName.trim()) {
      return "Company name is required."
    }
    if (!formData.subject.trim()) {
      return "Subject is required."
    }
    return ""
  }

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    setIsModalOpen(true)
  }, [])

  const handleSelectFiles = () => {
    setSubmitError("")
    setSubmitSuccess("")
    setIsModalOpen(true)
  }

  const handleModalDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsModalDragging(true)
  }, [])

  const handleModalDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsModalDragging(false)
  }, [])

  const handleModalDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsModalDragging(false)
    const files = e.dataTransfer.files
    if (files.length > 0) {
      const file = files[0]
      if (file.size <= 10 * 1024 * 1024) {
        setSelectedFile(file)
        setSubmitError("")
      } else {
        setSubmitError("File size exceeds 10MB limit.")
      }
    }
  }, [])

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (files && files.length > 0) {
      const file = files[0]
      if (file.size <= 10 * 1024 * 1024) {
        setSelectedFile(file)
        setSubmitError("")
      } else {
        setSubmitError("File size exceeds 10MB limit.")
      }
    }
  }

  const removeFile = () => {
    setSelectedFile(null)
  }

  const resetForm = () => {
    setIsModalOpen(false)
    setSelectedFile(null)
    setFileType(null)
    setFormData(emptyForm)
    setSubmitError("")
    setSubmitSuccess("")
    setIsSubmitting(false)
  }

  const getStatusForType = (type: Exclude<FileType, null>) => {
    if (type === "received") {
      return "received"
    }
    if (type === "sent") {
      return "sent"
    }
    return "pending"
  }

  const handleSubmit = async () => {
    const validationError = validateForm()
    if (validationError) {
      setSubmitError(validationError)
      setSubmitSuccess("")
      return
    }

    if (!selectedFile || !fileType) {
      return
    }

    setIsSubmitting(true)
    setSubmitError("")
    setSubmitSuccess("")

    try {
      const uploadFormData = new FormData()
      uploadFormData.append("file", selectedFile)

      const uploadResponse = await fetch("/api/upload", {
        method: "POST",
        body: uploadFormData,
      })

      const uploadResult = await uploadResponse.json()
      if (!uploadResponse.ok) {
        throw new Error(uploadResult.error || "File upload failed.")
      }

      const documentResponse = await fetch("/api/documents", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          document_number: formData.documentNumber,
          title: formData.subject,
          subject: formData.subject,
          document_type: fileType,
          file_url: uploadResult.file.url,
          file_name: uploadResult.file.name,
          file_size: uploadResult.file.size,
          file_type: uploadResult.file.type,
          day_and_date: formData.dayAndDate || null,
          company_name: formData.companyName,
          address: formData.address || null,
          department_name: formData.department || null,
          remark: formData.remark || null,
          received_date: formData.receivedDate || null,
          to_whom: formData.toWhom || null,
          sent_date: formData.sentDate || null,
          forwarded_to: formData.forwardedTo || null,
          ethiopian_date: formData.ethiopianDate || null,
          status: getStatusForType(fileType),
          priority: "medium",
        }),
      })

      const documentResult = await documentResponse.json()
      if (!documentResponse.ok) {
        throw new Error(documentResult.error || "Document record creation failed.")
      }

      setSubmitSuccess("Document uploaded successfully.")
      window.dispatchEvent(
        new CustomEvent("document-uploaded", { detail: documentResult.document })
      )
      setTimeout(() => {
        resetForm()
      }, 800)
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Unexpected upload error."
      setSubmitError(message)
    } finally {
      setIsSubmitting(false)
    }
  }

  const renderStatusMessage = () => {
    if (submitError) {
      return (
        <p className="rounded-md border border-destructive/20 bg-destructive/5 px-3 py-2 text-sm text-destructive">
          {submitError}
        </p>
      )
    }

    if (submitSuccess) {
      return (
        <p className="rounded-md border border-primary/20 bg-primary/5 px-3 py-2 text-sm text-primary">
          {submitSuccess}
        </p>
      )
    }

    return null
  }

  const renderFileTypeSelection = () => (
    <div className="space-y-4 py-4">
      <p className="text-center text-sm text-muted-foreground">
        Select the type of document you want to upload
      </p>
      <div className="grid grid-cols-3 gap-4">
        <button
          onClick={() => setFileType("received")}
          className="flex flex-col items-center gap-3 rounded-lg border-2 border-border p-6 transition-colors hover:border-primary hover:bg-primary/5"
        >
          <div className="flex size-12 items-center justify-center rounded-full bg-blue-100">
            <Inbox className="size-6 text-blue-600" />
          </div>
          <span className="font-medium text-foreground">Received</span>
        </button>
        <button
          onClick={() => setFileType("sent")}
          className="flex flex-col items-center gap-3 rounded-lg border-2 border-border p-6 transition-colors hover:border-primary hover:bg-primary/5"
        >
          <div className="flex size-12 items-center justify-center rounded-full bg-green-100">
            <Send className="size-6 text-green-600" />
          </div>
          <span className="font-medium text-foreground">Sent</span>
        </button>
        <button
          onClick={() => setFileType("contract")}
          className="flex flex-col items-center gap-3 rounded-lg border-2 border-border p-6 transition-colors hover:border-primary hover:bg-primary/5"
        >
          <div className="flex size-12 items-center justify-center rounded-full bg-amber-100">
            <FileText className="size-6 text-amber-600" />
          </div>
          <span className="font-medium text-foreground">Contract</span>
        </button>
      </div>
    </div>
  )

  const renderFileUploadArea = () => (
    <div
      className={`relative rounded-lg border-2 border-dashed p-6 transition-colors ${
        isModalDragging
          ? "border-primary bg-primary/5"
          : "border-border hover:border-primary/50"
      }`}
      onDragOver={handleModalDragOver}
      onDragLeave={handleModalDragLeave}
      onDrop={handleModalDrop}
    >
      {selectedFile ? (
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10">
              <Upload className="size-5 text-primary" />
            </div>
            <div>
              <p className="text-sm font-medium">{selectedFile.name}</p>
              <p className="text-xs text-muted-foreground">
                {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB
              </p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={removeFile}
            className="text-muted-foreground hover:text-destructive"
          >
            <X className="size-4" />
          </Button>
        </div>
      ) : (
        <label className="flex cursor-pointer flex-col items-center justify-center">
          <div className="mb-3 flex size-12 items-center justify-center rounded-full bg-primary/10">
            <Upload className="size-6 text-primary" />
          </div>
          <p className="text-sm font-medium text-foreground">
            Click to upload or drag and drop
          </p>
          <p className="mt-1 text-xs text-muted-foreground">Max size 10MB</p>
          <input
            type="file"
            className="hidden"
            onChange={handleFileSelect}
            accept=".pdf,.doc,.docx,.xls,.xlsx,.png,.jpg,.jpeg"
          />
        </label>
      )}
    </div>
  )

  const renderReceivedForm = () => (
    <div className="space-y-4 py-4">
      <div className="mb-4 flex items-center gap-2">
        <Button variant="ghost" size="sm" onClick={() => setFileType(null)}>
          Back
        </Button>
        <div className="flex items-center gap-2">
          <div className="flex size-8 items-center justify-center rounded-full bg-blue-100">
            <Inbox className="size-4 text-blue-600" />
          </div>
          <span className="font-medium">Received Document</span>
        </div>
      </div>

      {renderFileUploadArea()}

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="documentNumber">
            File Document Number <span className="text-destructive">*</span>
          </Label>
          <Input
            id="documentNumber"
            placeholder="Enter document number"
            value={formData.documentNumber}
            onChange={(e) => setField("documentNumber", e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="dayAndDate">Day and Date</Label>
          <Input
            id="dayAndDate"
            type="date"
            value={formData.dayAndDate}
            onChange={(e) => setField("dayAndDate", e.target.value)}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="receivedDate">Received Date</Label>
        <Input
          id="receivedDate"
          type="date"
          value={formData.receivedDate}
          onChange={(e) => setField("receivedDate", e.target.value)}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="companyName">
            Company Name <span className="text-destructive">*</span>
          </Label>
          <Input
            id="companyName"
            placeholder="Enter company name"
            value={formData.companyName}
            onChange={(e) => setField("companyName", e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="address">Address</Label>
          <Input
            id="address"
            placeholder="Enter address"
            value={formData.address}
            onChange={(e) => setField("address", e.target.value)}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="toWhom">To Whom</Label>
        <Input
          id="toWhom"
          placeholder="Enter recipient name"
          value={formData.toWhom}
          onChange={(e) => setField("toWhom", e.target.value)}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="department">Department</Label>
        <Select
          value={formData.department}
          onValueChange={(value) => setField("department", value)}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select department..." />
          </SelectTrigger>
          <SelectContent>
            {departments.map((department) => (
              <SelectItem key={department.id} value={department.name}>
                {department.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="subject">
          Subject <span className="text-destructive">*</span>
        </Label>
        <Input
          id="subject"
          placeholder="Enter subject"
          value={formData.subject}
          onChange={(e) => setField("subject", e.target.value)}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="remark">Remark</Label>
        <Textarea
          id="remark"
          placeholder="Enter any remarks..."
          value={formData.remark}
          onChange={(e) => setField("remark", e.target.value)}
          rows={3}
        />
      </div>
    </div>
  )

  const renderSentForm = () => (
    <div className="space-y-4 py-4">
      <div className="mb-4 flex items-center gap-2">
        <Button variant="ghost" size="sm" onClick={() => setFileType(null)}>
          Back
        </Button>
        <div className="flex items-center gap-2">
          <div className="flex size-8 items-center justify-center rounded-full bg-green-100">
            <Send className="size-4 text-green-600" />
          </div>
          <span className="font-medium">Sent Document</span>
        </div>
      </div>

      {renderFileUploadArea()}

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="documentNumber">
            File Document Number <span className="text-destructive">*</span>
          </Label>
          <Input
            id="documentNumber"
            placeholder="Enter document number"
            value={formData.documentNumber}
            onChange={(e) => setField("documentNumber", e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="dayAndDate">Day and Date</Label>
          <Input
            id="dayAndDate"
            type="date"
            value={formData.dayAndDate}
            onChange={(e) => setField("dayAndDate", e.target.value)}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="sentDate">Sent Date</Label>
        <Input
          id="sentDate"
          type="date"
          value={formData.sentDate}
          onChange={(e) => setField("sentDate", e.target.value)}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="companyName">
            Company Name <span className="text-destructive">*</span>
          </Label>
          <Input
            id="companyName"
            placeholder="Enter company name"
            value={formData.companyName}
            onChange={(e) => setField("companyName", e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="address">Address</Label>
          <Input
            id="address"
            placeholder="Enter address"
            value={formData.address}
            onChange={(e) => setField("address", e.target.value)}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="forwardedTo">Forwarded To</Label>
        <Input
          id="forwardedTo"
          placeholder="Enter recipient name"
          value={formData.forwardedTo}
          onChange={(e) => setField("forwardedTo", e.target.value)}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="department">Department</Label>
        <Select
          value={formData.department}
          onValueChange={(value) => setField("department", value)}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select department..." />
          </SelectTrigger>
          <SelectContent>
            {departments.map((department) => (
              <SelectItem key={department.id} value={department.name}>
                {department.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="subject">
          Subject <span className="text-destructive">*</span>
        </Label>
        <Input
          id="subject"
          placeholder="Enter subject"
          value={formData.subject}
          onChange={(e) => setField("subject", e.target.value)}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="remark">Remark</Label>
        <Textarea
          id="remark"
          placeholder="Enter any remarks..."
          value={formData.remark}
          onChange={(e) => setField("remark", e.target.value)}
          rows={3}
        />
      </div>
    </div>
  )

  const renderContractForm = () => (
    <div className="space-y-4 py-4">
      <div className="mb-4 flex items-center gap-2">
        <Button variant="ghost" size="sm" onClick={() => setFileType(null)}>
          Back
        </Button>
        <div className="flex items-center gap-2">
          <div className="flex size-8 items-center justify-center rounded-full bg-amber-100">
            <FileText className="size-4 text-amber-600" />
          </div>
          <span className="font-medium">Contract Document</span>
        </div>
      </div>

      {renderFileUploadArea()}

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="documentNumber">
            File Document Number <span className="text-destructive">*</span>
          </Label>
          <Input
            id="documentNumber"
            placeholder="Enter document number"
            value={formData.documentNumber}
            onChange={(e) => setField("documentNumber", e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="dayAndDate">Day and Date</Label>
          <Input
            id="dayAndDate"
            type="date"
            value={formData.dayAndDate}
            onChange={(e) => setField("dayAndDate", e.target.value)}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="ethiopianDate">Date (Ethiopian Calendar)</Label>
        <Input
          id="ethiopianDate"
          placeholder="Enter Ethiopian calendar date (e.g., 15/06/2016)"
          value={formData.ethiopianDate}
          onChange={(e) => setField("ethiopianDate", e.target.value)}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="companyName">
            Company Name <span className="text-destructive">*</span>
          </Label>
          <Input
            id="companyName"
            placeholder="Enter company name"
            value={formData.companyName}
            onChange={(e) => setField("companyName", e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="address">Address</Label>
          <Input
            id="address"
            placeholder="Enter address"
            value={formData.address}
            onChange={(e) => setField("address", e.target.value)}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="department">Department</Label>
        <Select
          value={formData.department}
          onValueChange={(value) => setField("department", value)}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select department..." />
          </SelectTrigger>
          <SelectContent>
            {departments.map((department) => (
              <SelectItem key={department.id} value={department.name}>
                {department.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="subject">
          Subject <span className="text-destructive">*</span>
        </Label>
        <Input
          id="subject"
          placeholder="Enter subject"
          value={formData.subject}
          onChange={(e) => setField("subject", e.target.value)}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="remark">Remark</Label>
        <Textarea
          id="remark"
          placeholder="Enter any remarks..."
          value={formData.remark}
          onChange={(e) => setField("remark", e.target.value)}
          rows={3}
        />
      </div>
    </div>
  )

  const renderFormContent = () => {
    if (!fileType) {
      return renderFileTypeSelection()
    }
    switch (fileType) {
      case "received":
        return renderReceivedForm()
      case "sent":
        return renderSentForm()
      case "contract":
        return renderContractForm()
      default:
        return renderFileTypeSelection()
    }
  }

  return (
    <>
      <Card
        className={`relative border-2 border-dashed py-12 transition-colors ${
          isDragging
            ? "border-primary bg-primary/5"
            : "border-border hover:border-primary/50"
        }`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <div className="flex flex-col items-center justify-center gap-4 px-6 text-center">
          <div className="flex size-16 items-center justify-center rounded-full bg-primary text-primary-foreground">
            <Upload className="size-8" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-foreground">
              Drop files here or click to upload
            </h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Support for PDF, Word, Excel, and image files. Maximum file size is 10MB.
            </p>
          </div>
          <Button className="mt-2" onClick={handleSelectFiles}>
            Select Files
          </Button>
        </div>
      </Card>

      <Dialog open={isModalOpen} onOpenChange={(open) => { if (!open) resetForm() }}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10">
                <Upload className="size-5 text-primary" />
              </div>
              Upload New Document
            </DialogTitle>
            <DialogDescription>
              {!fileType
                ? "Select the type of document you want to upload."
                : "Fill in the document details and upload your file."}
            </DialogDescription>
          </DialogHeader>

          {renderFormContent()}
          {renderStatusMessage()}

          {fileType && (
            <div className="flex justify-end gap-3 border-t pt-4">
              <Button variant="outline" onClick={resetForm} disabled={isSubmitting}>
                Cancel
              </Button>
              <Button onClick={handleSubmit} disabled={isSubmitting}>
                <Check className="mr-2 size-4" />
                {isSubmitting ? "Uploading..." : "Upload Document"}
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}
