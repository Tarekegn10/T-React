import { NextRequest, NextResponse } from "next/server"
import { query, queryOne } from "@/lib/db"
import { getCurrentUser } from "@/lib/auth"
import { ensureEmployeesTable } from "@/lib/employees"
import { createInvalidOriginResponse, validateSameOrigin } from "@/lib/request-security"

export async function GET(request: NextRequest) {
  try {
    const currentUser = await getCurrentUser()
    if (!currentUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    await ensureEmployeesTable()

    const searchParams = request.nextUrl.searchParams
    const search = searchParams.get("search") || ""
    const departmentId = searchParams.get("department_id")
    const status = searchParams.get("status")

    const whereConditions = ["1=1"]
    const params: unknown[] = []
    let paramIndex = 1

    if (search) {
      whereConditions.push(`(
        e.name ILIKE $${paramIndex} OR
        e.email ILIKE $${paramIndex} OR
        COALESCE(e.phone, '') ILIKE $${paramIndex} OR
        COALESCE(e.position, '') ILIKE $${paramIndex}
      )`)
      params.push(`%${search}%`)
      paramIndex++
    }

    if (departmentId) {
      whereConditions.push(`e.department_id = $${paramIndex}`)
      params.push(departmentId)
      paramIndex++
    }

    if (status) {
      whereConditions.push(`e.status = $${paramIndex}`)
      params.push(status)
      paramIndex++
    }

    const canManageEmployees = currentUser.role === "admin" || currentUser.role === "manager"

    const employees = canManageEmployees
      ? await query(
          `SELECT
             e.id, e.user_id, e.employee_number, e.name, e.email, e.phone, e.position,
             e.department_id, e.status, COALESCE(e.last_active, u.last_active) as last_active,
             e.created_at, e.updated_at,
             d.name as department_name
           FROM employees e
           LEFT JOIN departments d ON d.id = e.department_id
           LEFT JOIN users u ON u.id = e.user_id
           WHERE ${whereConditions.join(" AND ")}
           ORDER BY e.name`,
          params
        )
      : await query(
          `SELECT
             e.id, e.name, e.email
           FROM employees e
           WHERE e.status = 'active'
           ORDER BY e.name`
        )

    return NextResponse.json({ employees })
  } catch (error) {
    console.error("Get employees error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    if (!validateSameOrigin(request)) {
      return createInvalidOriginResponse()
    }

    const currentUser = await getCurrentUser()
    if (!currentUser || currentUser.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    await ensureEmployeesTable()

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
      status = "active",
    } = body

    const trimmedName = name?.trim()
    const trimmedEmail = email?.trim()

    if (!trimmedName || !trimmedEmail) {
      return NextResponse.json(
        { error: "Name and email are required" },
        { status: 400 }
      )
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

    const existingEmail = await queryOne<{ id: string }>(
      "SELECT id FROM employees WHERE email = $1",
      [trimmedEmail]
    )
    if (existingEmail) {
      return NextResponse.json({ error: "Employee email already exists" }, { status: 400 })
    }

    if (user_id) {
      const existingUserLink = await queryOne<{ id: string }>(
        "SELECT id FROM employees WHERE user_id = $1",
        [user_id]
      )
      if (existingUserLink) {
        return NextResponse.json(
          { error: "This user is already linked to another employee" },
          { status: 400 }
        )
      }
    }

    const created = await queryOne<{ id: string }>(
      `INSERT INTO employees (
         user_id, employee_number, name, email, phone, position, department_id, status
       ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING id`,
      [
        user_id || null,
        employee_number?.trim() || null,
        trimmedName,
        trimmedEmail,
        phone?.trim() || null,
        position?.trim() || null,
        resolvedDepartmentId ?? null,
        status,
      ]
    )

    const employee = created
      ? await queryOne(
          `SELECT
             e.id, e.user_id, e.employee_number, e.name, e.email, e.phone, e.position,
             e.department_id, e.status, COALESCE(e.last_active, u.last_active) as last_active,
             e.created_at, e.updated_at,
             d.name as department_name
           FROM employees e
           LEFT JOIN departments d ON d.id = e.department_id
           LEFT JOIN users u ON u.id = e.user_id
           WHERE e.id = $1`,
          [created.id]
        )
      : null

    return NextResponse.json({ employee }, { status: 201 })
  } catch (error) {
    console.error("Create employee error:", error)
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
