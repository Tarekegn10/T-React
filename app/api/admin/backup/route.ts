import { NextRequest, NextResponse } from "next/server"
import { query, queryOne } from "@/lib/db"
import { getCurrentUser } from "@/lib/auth"
import JSZip from "jszip"
import path from "path"
import { readdir, readFile, stat } from "fs/promises"
import {
  applySimpleRateLimit,
  createInvalidOriginResponse,
  createRateLimitResponse,
  getClientIpAddress,
  validateSameOrigin,
} from "@/lib/request-security"

const TABLES_TO_BACKUP = [
  "departments",
  "users",
  "employees",
  "documents",
  "document_shares",
  "document_activities",
  "notifications",
  "system_settings",
  "backup_history",
  "sessions",
] as const

interface BackupManifest {
  generated_at: string
  generated_by: {
    id: string
    username: string
    name: string
  }
  tables: Record<string, { row_count: number }>
  uploads: Array<{ path: string; size: number }>
}

async function collectFiles(dirPath: string, relativeDir = ""): Promise<Array<{
  absolutePath: string
  relativePath: string
  size: number
}>> {
  const entries = await readdir(dirPath, { withFileTypes: true })
  const files: Array<{
    absolutePath: string
    relativePath: string
    size: number
  }> = []

  for (const entry of entries) {
    const absolutePath = path.join(dirPath, entry.name)
    const relativePath = relativeDir ? path.join(relativeDir, entry.name) : entry.name

    if (entry.isDirectory()) {
      files.push(...await collectFiles(absolutePath, relativePath))
      continue
    }

    const fileStats = await stat(absolutePath)
    files.push({
      absolutePath,
      relativePath,
      size: fileStats.size,
    })
  }

  return files
}

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user || user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const mode = request.nextUrl.searchParams.get("mode")

    if (mode !== "meta") {
      return NextResponse.json({ error: "Method not allowed" }, { status: 405 })
    }

    if (mode === "meta") {
      const [
        usersCount,
        documentsCount,
        employeesCount,
        latestBackup,
        settings,
      ] = await Promise.all([
        queryOne<{ count: string }>("SELECT COUNT(*) as count FROM users"),
        queryOne<{ count: string }>("SELECT COUNT(*) as count FROM documents"),
        queryOne<{ count: string }>("SELECT COUNT(*) as count FROM employees"),
        queryOne<{
          id: string
          file_name: string | null
          file_size: string | null
          status: string
          created_at: string
        }>("SELECT * FROM backup_history ORDER BY created_at DESC LIMIT 1"),
        queryOne<{
          auto_backup_enabled: boolean
          backup_frequency: string
          last_backup_at: string | null
        }>("SELECT auto_backup_enabled, backup_frequency, last_backup_at FROM system_settings LIMIT 1"),
      ])

      const uploadsDir = path.join(process.cwd(), "public", "uploads")
      let fileCount = 0
      let storageBytes = 0

      try {
        const files = await collectFiles(uploadsDir)
        fileCount = files.length
        storageBytes = files.reduce((sum, file) => sum + file.size, 0)
      } catch {
        fileCount = 0
        storageBytes = 0
      }

      return NextResponse.json({
        stats: {
          users: Number(usersCount?.count || 0),
          documents: Number(documentsCount?.count || 0),
          employees: Number(employeesCount?.count || 0),
          uploadedFiles: fileCount,
          storageBytes,
        },
        latestBackup,
        settings,
      })
    }

    return NextResponse.json({ error: "Method not allowed" }, { status: 405 })
  } catch (error) {
    console.error("Backup metadata error:", error)
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Internal server error",
      },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    if (!validateSameOrigin(request)) {
      return createInvalidOriginResponse()
    }

    const backupRateLimit = applySimpleRateLimit({
      key: `admin:backup:${getClientIpAddress(request)}`,
      maxRequests: 5,
      windowMs: 15 * 60 * 1000,
    })

    if (!backupRateLimit.allowed) {
      return createRateLimitResponse(backupRateLimit.retryAfterSeconds)
    }

    const user = await getCurrentUser()
    if (!user || user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const zip = new JSZip()
    const createdAt = new Date()
    const timestamp = createdAt.toISOString().replace(/[:.]/g, "-")
    const archiveFileName = `docuflow-backup-${timestamp}.zip`

    const manifest: BackupManifest = {
      generated_at: createdAt.toISOString(),
      generated_by: {
        id: user.id,
        username: user.username,
        name: user.name,
      },
      tables: {},
      uploads: [],
    }

    const dataFolder = zip.folder("data")
    if (!dataFolder) {
      throw new Error("Failed to create backup data folder.")
    }

    for (const table of TABLES_TO_BACKUP) {
      const rows = await query(`SELECT * FROM ${table}`)
      dataFolder.file(`${table}.json`, JSON.stringify(rows, null, 2))
      manifest.tables[table] = {
        row_count: rows.length,
      }
    }

    const uploadsDir = path.join(process.cwd(), "public", "uploads")
    const uploadsFolder = zip.folder("uploads")

    let totalFileBytes = 0
    let fileCount = 0

    if (uploadsFolder) {
      try {
        const files = await collectFiles(uploadsDir)

        for (const file of files) {
          const fileBuffer = await readFile(file.absolutePath)
          uploadsFolder.file(file.relativePath.replace(/\\/g, "/"), fileBuffer)
          totalFileBytes += file.size
          fileCount++
        }

        manifest.uploads = files.map((file) => ({
          path: file.relativePath.replace(/\\/g, "/"),
          size: file.size,
        }))
      } catch {
        manifest.uploads = []
      }
    }

    zip.file("manifest.json", JSON.stringify(manifest, null, 2))

    const archiveBuffer = await zip.generateAsync({
      type: "arraybuffer",
      compression: "DEFLATE",
      compressionOptions: { level: 6 },
    })

    await query(
      `INSERT INTO backup_history (backup_type, file_name, file_size, status, created_by)
       VALUES ($1, $2, $3, $4, $5)`,
      ["manual", archiveFileName, archiveBuffer.byteLength, "completed", user.id]
    )

    await query(
      `UPDATE system_settings
       SET last_backup_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
       WHERE id = (SELECT id FROM system_settings LIMIT 1)`
    )

    const headers = new Headers()
    headers.set("Content-Type", "application/zip")
    headers.set("Content-Disposition", `attachment; filename="${archiveFileName}"`)
    headers.set("Content-Length", String(archiveBuffer.byteLength))
    headers.set("X-Backup-Files", String(fileCount))
    headers.set("X-Backup-File-Bytes", String(totalFileBytes))

    return new NextResponse(archiveBuffer, { status: 200, headers })
  } catch (error) {
    console.error("Backup creation error:", error)
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Internal server error",
      },
      { status: 500 }
    )
  }
}
