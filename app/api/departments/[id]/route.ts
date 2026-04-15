import { NextRequest, NextResponse } from "next/server"
import { queryOne } from "@/lib/db"
import { getCurrentUser } from "@/lib/auth"
import { createInvalidOriginResponse, validateSameOrigin } from "@/lib/request-security"

interface RouteContext {
  params: Promise<{
    id: string
  }>
}

export async function DELETE(request: NextRequest, context: RouteContext) {
  try {
    if (!validateSameOrigin(request)) {
      return createInvalidOriginResponse()
    }

    const user = await getCurrentUser()
    if (!user || user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await context.params

    const department = await queryOne<{ id: string; name: string }>(
      "SELECT id, name FROM departments WHERE id = $1",
      [id]
    )

    if (!department) {
      return NextResponse.json({ error: "Department not found" }, { status: 404 })
    }

    const [documents, users, employees] = await Promise.all([
      queryOne<{ count: string }>("SELECT COUNT(*) as count FROM documents WHERE department_id = $1", [id]),
      queryOne<{ count: string }>("SELECT COUNT(*) as count FROM users WHERE department_id = $1", [id]),
      queryOne<{ count: string }>("SELECT COUNT(*) as count FROM employees WHERE department_id = $1", [id]),
    ])

    await queryOne("DELETE FROM departments WHERE id = $1 RETURNING id", [id])

    return NextResponse.json({
      success: true,
      department,
      reassigned: {
        documents: Number(documents?.count || 0),
        users: Number(users?.count || 0),
        employees: Number(employees?.count || 0),
      },
    })
  } catch (error) {
    console.error("Delete department error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
