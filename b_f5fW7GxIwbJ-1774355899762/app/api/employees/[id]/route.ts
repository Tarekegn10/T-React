import { NextRequest, NextResponse } from "next/server"
import { query, queryOne } from "@/lib/db"
import { getCurrentUser } from "@/lib/auth"
import { ensureEmployeesTable } from "@/lib/employees"

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const currentUser = await getCurrentUser()
    if (!currentUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    await ensureEmployeesTable()

    const { id } = await params

    const employee = await queryOne<{
      id: string
      user_id: string | null
      employee_number: string | null
      name: string
      email: string
      phone: string | null
      position: string | null
      department_id: string | null
      status: string
      last_active: string | null
      created_at: string
      updated_at: string
      department_name: string | null
    }>(
      `SELECT
         e.id, e.user_id, e.employee_number, e.name, e.email, e.phone, e.position,
         e.department_id, e.status, COALESCE(e.last_active, u.last_active) as last_active,
         e.created_at, e.updated_at,
         d.name as department_name
       FROM employees e
       LEFT JOIN departments d ON d.id = e.department_id
       LEFT JOIN users u ON u.id = e.user_id
       WHERE e.id = $1`,
      [id]
    )

    if (!employee) {
      return NextResponse.json({ error: "Employee not found" }, { status: 404 })
    }

    const sharedDocuments = await query<{
      id: string
      file_name: string | null
      title: string
      document_number: string
      shared_at: string
    }>(
      `SELECT DISTINCT
         d.id,
         d.file_name,
         d.title,
         d.document_number,
         da.created_at as shared_at
       FROM document_activities da
       JOIN documents d ON d.id = da.document_id
       WHERE da.action = 'shared'
         AND EXISTS (
           SELECT 1
           FROM jsonb_array_elements(
             COALESCE(da.details->'shared_with_employees', '[]'::jsonb)
           ) AS recipient
           WHERE recipient->>'employee_id' = $1
         )
       ORDER BY da.created_at DESC`,
      [id]
    )

    return NextResponse.json({ employee, shared_documents: sharedDocuments })
  } catch (error) {
    console.error("Get employee error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const currentUser = await getCurrentUser()
    if (!currentUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    await ensureEmployeesTable()

    const { id } = await params
    const body = await request.json()
    const {
      user_id,
      employee_number,
      name,
      email,
      phone,
      position,
      department_id,
      department_name,
      status,
      last_active,
    } = body

    const trimmedName = name?.trim()
    const trimmedEmail = email?.trim()

    if (trimmedName !== undefined && !trimmedName) {
      return NextResponse.json({ error: "Name cannot be empty" }, { status: 400 })
    }
    if (trimmedEmail !== undefined && !trimmedEmail) {
      return NextResponse.json({ error: "Email cannot be empty" }, { status: 400 })
    }

    if (trimmedEmail !== undefined) {
      const existingEmail = await queryOne<{ id: string }>(
        "SELECT id FROM employees WHERE email = $1 AND id <> $2",
        [trimmedEmail, id]
      )
      if (existingEmail) {
        return NextResponse.json({ error: "Employee email already exists" }, { status: 400 })
      }
    }

    if (user_id !== undefined && user_id) {
      const existingUserLink = await queryOne<{ id: string }>(
        "SELECT id FROM employees WHERE user_id = $1 AND id <> $2",
        [user_id, id]
      )
      if (existingUserLink) {
        return NextResponse.json(
          { error: "This user is already linked to another employee" },
          { status: 400 }
        )
      }
    }

    let resolvedDepartmentId = department_id
    if (department_name !== undefined && department_id === undefined) {
      if (!department_name) {
        resolvedDepartmentId = null
      } else {
       const department = await queryOne<{ id: string }>(
          "SELECT id FROM departments WHERE name = $1",
          [department_name]
        )
        if (!department) {
          return NextResponse.json({ error: "Department not found" }, { status: 400 })
        }
        resolvedDepartmentId = department.id
      }
    }

    const updates: string[] = []
    const values: unknown[] = []
    let paramIndex = 1

    if (user_id !== undefined) {
      updates.push(`user_id = $${paramIndex++}`)
      values.push(user_id || null)
    }
    if (employee_number !== undefined) {
      updates.push(`employee_number = $${paramIndex++}`)
      values.push(employee_number?.trim() || null)
    }
    if (trimmedName !== undefined) {
      updates.push(`name = $${paramIndex++}`)
      values.push(trimmedName)
    }
    if (trimmedEmail !== undefined) {
      updates.push(`email = $${paramIndex++}`)
      values.push(trimmedEmail)
    }
    if (phone !== undefined) {
      updates.push(`phone = $${paramIndex++}`)
      values.push(phone?.trim() || null)
    }
    if (position !== undefined) {
      updates.push(`position = $${paramIndex++}`)
      values.push(position?.trim() || null)
    }
    if (resolvedDepartmentId !== undefined) {
      updates.push(`department_id = $${paramIndex++}`)
      values.push(resolvedDepartmentId)
    }
    if (status !== undefined) {
      updates.push(`status = $${paramIndex++}`)
      values.push(status)
    }
    if (last_active !== undefined) {
      updates.push(`last_active = $${paramIndex++}`)
      values.push(last_active || null)
    }

    if (updates.length === 0) {
      return NextResponse.json({ error: "No fields to update" }, { status: 400 })
    }

    updates.push("updated_at = CURRENT_TIMESTAMP")
    values.push(id)

    const updated = await queryOne<{ id: string }>(
      `UPDATE employees SET ${updates.join(", ")} WHERE id = $${paramIndex} RETURNING id`,
      values
    )

    if (!updated) {
      return NextResponse.json({ error: "Employee not found" }, { status: 404 })
    }

    const employee = await queryOne(
      `SELECT
         e.id, e.user_id, e.employee_number, e.name, e.email, e.phone, e.position,
         e.department_id, e.status, COALESCE(e.last_active, u.last_active) as last_active,
         e.created_at, e.updated_at,
         d.name as department_name
       FROM employees e
       LEFT JOIN departments d ON d.id = e.department_id
       LEFT JOIN users u ON u.id = e.user_id
       WHERE e.id = $1`,
      [updated.id]
    )

    return NextResponse.json({ employee })
  } catch (error) {
    console.error("Update employee error:", error)
    return NextResponse.json(
      {
        error:
          error instanceof Error && /duplicate key/i.test(error.message)
            ? "Employee email already exists"
            : "Internal server error",
      },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const currentUser = await getCurrentUser()
    if (!currentUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    await ensureEmployeesTable()

    const { id } = await params

    const existing = await queryOne<{ id: string }>(
      "SELECT id FROM employees WHERE id = $1",
      [id]
    )
    if (!existing) {
      return NextResponse.json({ error: "Employee not found" }, { status: 404 })
    }

    await query("DELETE FROM employees WHERE id = $1", [id])

    return NextResponse.json({ success: true, message: "Employee deleted" })
  } catch (error) {
    console.error("Delete employee error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
