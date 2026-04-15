import { NextRequest, NextResponse } from "next/server"
import { query } from "@/lib/db"
import { getCurrentUser } from "@/lib/auth"
import JSZip from "jszip"
import path from "path"
import { readFile } from "fs/promises"

interface RouteContext {
  params: Promise<{
    id: string
  }>
}

interface DepartmentRecord {
  id: string
  name: string
  description: string | null
  icon: string | null
  color: string | null
  created_at: string
  updated_at: string
}

interface DepartmentDocumentRecord {
  id: string
  document_number: string
  title: string
  subject: string | null
  document_type: string
  file_url: string | null
  file_name: string | null
  file_size: string | number | null
  file_type: string | null
  created_at: string
}

interface DepartmentUserRecord {
  id: string
  username: string
  email: string
  name: string
  role: string
  status: string | null
  created_at: string
}

interface DepartmentEmployeeRecord {
  id: string
  employee_number: string | null
  name: string
  email: string
  position: string | null
  status: string | null
  created_at: string
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "") || "department"
}

function resolvePublicFilePath(fileUrl: string) {
  const publicDir = path.resolve(process.cwd(), "public")
  const relativePublicPath = fileUrl.replace(/^\/+/, "")
  const absolutePath = path.resolve(publicDir, relativePublicPath)

  if (
    absolutePath.toLowerCase() !== publicDir.toLowerCase() &&
    !absolutePath.toLowerCase().startsWith(`${publicDir.toLowerCase()}${path.sep.toLowerCase()}`)
  ) {
    return null
  }

  return absolutePath
}

export async function GET(_request: NextRequest, context: RouteContext) {
  try {
    const user = await getCurrentUser()
    if (!user || user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await context.params

    const [department] = await query<DepartmentRecord>(
      "SELECT * FROM departments WHERE id = $1 LIMIT 1",
      [id]
    )

    if (!department) {
      return NextResponse.json({ error: "Department not found" }, { status: 404 })
    }

    const [documents, users, employees] = await Promise.all([
      query<DepartmentDocumentRecord>(
        `SELECT id, document_number, title, subject, document_type, file_url, file_name, file_size, file_type, created_at
         FROM documents
         WHERE department_id = $1
         ORDER BY created_at DESC`,
        [id]
      ),
      query<DepartmentUserRecord>(
        `SELECT id, username, email, name, role, status, created_at
         FROM users
         WHERE department_id = $1
         ORDER BY created_at DESC`,
        [id]
      ),
      query<DepartmentEmployeeRecord>(
        `SELECT id, employee_number, name, email, position, status, created_at
         FROM employees
         WHERE department_id = $1
         ORDER BY created_at DESC`,
        [id]
      ),
    ])

    const zip = new JSZip()
    const slug = slugify(department.name)
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-")
    const archiveFileName = `department-${slug}-${timestamp}.zip`

    zip.file("department.json", JSON.stringify(department, null, 2))
    zip.file("documents.json", JSON.stringify(documents, null, 2))
    zip.file("users.json", JSON.stringify(users, null, 2))
    zip.file("employees.json", JSON.stringify(employees, null, 2))

    const filesFolder = zip.folder("files")
    const missingFiles: string[] = []

    if (filesFolder) {
      for (const document of documents) {
        if (!document.file_url) {
          continue
        }

        const absoluteFilePath = resolvePublicFilePath(document.file_url)
        if (!absoluteFilePath) {
          missingFiles.push(document.file_url)
          continue
        }

        try {
          const fileBuffer = await readFile(absoluteFilePath)
          const safeName = path.basename(document.file_url)
          filesFolder.file(`${document.document_number}-${safeName}`, fileBuffer)
        } catch {
          missingFiles.push(document.file_url)
        }
      }
    }

    zip.file(
      "manifest.json",
      JSON.stringify(
        {
          generated_at: new Date().toISOString(),
          generated_by: {
            id: user.id,
            username: user.username,
            name: user.name,
          },
          department: {
            id: department.id,
            name: department.name,
          },
          counts: {
            documents: documents.length,
            users: users.length,
            employees: employees.length,
            files: documents.filter((document) => document.file_url).length - missingFiles.length,
            missing_files: missingFiles.length,
          },
          missing_files: missingFiles,
        },
        null,
        2
      )
    )

    const archiveBuffer = await zip.generateAsync({
      type: "arraybuffer",
      compression: "DEFLATE",
      compressionOptions: { level: 6 },
    })

    const headers = new Headers()
    headers.set("Content-Type", "application/zip")
    headers.set("Content-Disposition", `attachment; filename="${archiveFileName}"`)
    headers.set("Content-Length", String(archiveBuffer.byteLength))

    return new NextResponse(archiveBuffer, { status: 200, headers })
  } catch (error) {
    console.error("Department download error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
