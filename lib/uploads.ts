import path from "path"

const UPLOADS_PUBLIC_PREFIX = "/uploads/"
const SAFE_UPLOAD_FILE_NAME = /^[A-Za-z0-9._-]+$/

const ALLOWED_UPLOAD_EXTENSIONS = new Set([
  ".pdf",
  ".doc",
  ".docx",
  ".xls",
  ".xlsx",
  ".csv",
  ".png",
  ".jpg",
  ".jpeg",
  ".gif",
  ".webp",
  ".txt",
])

const ALLOWED_UPLOAD_MIME_TYPES = new Set([
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "text/csv",
  "text/plain",
  "image/png",
  "image/jpeg",
  "image/gif",
  "image/webp",
])

export function isAllowedUploadFile(fileName: string, mimeType?: string | null) {
  const extension = path.extname(fileName).toLowerCase()
  const normalizedMimeType = (mimeType || "").toLowerCase().trim()

  if (!ALLOWED_UPLOAD_EXTENSIONS.has(extension)) {
    return false
  }

  if (!normalizedMimeType) {
    return true
  }

  return ALLOWED_UPLOAD_MIME_TYPES.has(normalizedMimeType)
}

export function normalizeStoredUploadUrl(value: unknown) {
  if (typeof value !== "string") {
    return null
  }

  const trimmed = value.trim()
  if (!trimmed) {
    return null
  }

  if (!trimmed.startsWith(UPLOADS_PUBLIC_PREFIX)) {
    return null
  }

  const fileName = trimmed.slice(UPLOADS_PUBLIC_PREFIX.length)
  if (!SAFE_UPLOAD_FILE_NAME.test(fileName)) {
    return null
  }

  return `${UPLOADS_PUBLIC_PREFIX}${fileName}`
}

export function resolveStoredUploadPath(fileUrl: string) {
  const normalizedUrl = normalizeStoredUploadUrl(fileUrl)
  if (!normalizedUrl) {
    return null
  }

  const fileName = normalizedUrl.slice(UPLOADS_PUBLIC_PREFIX.length)
  return path.join(process.cwd(), "public", "uploads", fileName)
}

