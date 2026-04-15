import { NextRequest, NextResponse } from 'next/server'
import { query, queryOne } from '@/lib/db'
import { getCurrentUser, hashPassword, verifyPassword } from '@/lib/auth'
import { createInvalidOriginResponse, validateSameOrigin } from '@/lib/request-security'

// GET single user
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const currentUser = await getCurrentUser()
    if (!currentUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params

    if (currentUser.id !== id && currentUser.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const user = await queryOne(
      `SELECT 
        u.id, u.username, u.email, u.name, u.phone, u.position,
        u.department_id, u.role, u.avatar_url, u.status, u.last_active,
        u.email_notifications, u.document_approvals, u.weekly_reports,
        u.system_alerts, u.two_factor_enabled,
        u.created_at, u.updated_at,
        d.name as department_name
       FROM users u
       LEFT JOIN departments d ON u.department_id = d.id
       WHERE u.id = $1`,
      [id]
    )

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    return NextResponse.json({ user })
  } catch (error) {
    console.error('Get user error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// PUT update user
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    if (!validateSameOrigin(request)) {
      return createInvalidOriginResponse()
    }

    const currentUser = await getCurrentUser()
    if (!currentUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params

    // Users can only update their own profile, admins can update anyone
    if (currentUser.id !== id && currentUser.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()
    const {
      name,
      email,
      phone,
      position,
      department_id,
      department_name,
      role,
      avatar_url,
      status,
      password,
      current_password,
      email_notifications,
      document_approvals,
      weekly_reports,
      system_alerts,
      two_factor_enabled,
    } = body

    // Build update query dynamically
    const updates: string[] = []
    const values: unknown[] = []
    let paramIndex = 1

    if (name !== undefined) {
      updates.push(`name = $${paramIndex++}`)
      values.push(name)
    }
    if (email !== undefined) {
      updates.push(`email = $${paramIndex++}`)
      values.push(email)
    }
    if (phone !== undefined) {
      updates.push(`phone = $${paramIndex++}`)
      values.push(phone)
    }
    if (position !== undefined) {
      updates.push(`position = $${paramIndex++}`)
      values.push(position)
    }
    let resolvedDepartmentId = department_id

    if (department_name !== undefined && department_id === undefined) {
      if (!department_name) {
        resolvedDepartmentId = null
      } else {
        const department = await queryOne<{ id: string }>(
          'SELECT id FROM departments WHERE name = $1',
          [department_name]
        )

        if (!department) {
          return NextResponse.json(
            { error: 'Department not found' },
            { status: 400 }
          )
        }

        resolvedDepartmentId = department.id
      }
    }

    if (resolvedDepartmentId !== undefined) {
      updates.push(`department_id = $${paramIndex++}`)
      values.push(resolvedDepartmentId)
    }
    if (avatar_url !== undefined) {
      updates.push(`avatar_url = $${paramIndex++}`)
      values.push(avatar_url)
    }
    if (email_notifications !== undefined) {
      updates.push(`email_notifications = $${paramIndex++}`)
      values.push(email_notifications)
    }
    if (document_approvals !== undefined) {
      updates.push(`document_approvals = $${paramIndex++}`)
      values.push(document_approvals)
    }
    if (weekly_reports !== undefined) {
      updates.push(`weekly_reports = $${paramIndex++}`)
      values.push(weekly_reports)
    }
    if (system_alerts !== undefined) {
      updates.push(`system_alerts = $${paramIndex++}`)
      values.push(system_alerts)
    }
    if (two_factor_enabled !== undefined) {
      updates.push(`two_factor_enabled = $${paramIndex++}`)
      values.push(two_factor_enabled)
    }

    // Admin-only fields
    if (currentUser.role === 'admin') {
      if (role !== undefined) {
        updates.push(`role = $${paramIndex++}`)
        values.push(role)
      }
      if (status !== undefined) {
        updates.push(`status = $${paramIndex++}`)
        values.push(status)
      }
    }

    // Password change
    if (password) {
      if (currentUser.role !== 'admin' || currentUser.id === id) {
        if (typeof current_password !== 'string' || !current_password) {
          return NextResponse.json(
            { error: 'Current password is required to change your password' },
            { status: 400 }
          )
        }

        const existingUser = await queryOne<{ password_hash: string }>(
          'SELECT password_hash FROM users WHERE id = $1',
          [id]
        )

        if (!existingUser) {
          return NextResponse.json({ error: 'User not found' }, { status: 404 })
        }

        const isCurrentPasswordValid = await verifyPassword(current_password, existingUser.password_hash)
        if (!isCurrentPasswordValid) {
          return NextResponse.json(
            { error: 'Current password is incorrect' },
            { status: 400 }
          )
        }
      }

      const password_hash = await hashPassword(password)
      updates.push(`password_hash = $${paramIndex++}`)
      values.push(password_hash)
    }

    if (updates.length === 0) {
      return NextResponse.json(
        { error: 'No fields to update' },
        { status: 400 }
      )
    }

    updates.push('updated_at = CURRENT_TIMESTAMP')
    values.push(id)

    const updatedUser = await queryOne<{ id: string }>(
      `UPDATE users SET ${updates.join(', ')} WHERE id = $${paramIndex}
       RETURNING id`,
      values
    )

    const user = updatedUser
      ? await queryOne(
          `SELECT
             u.id,
             u.username,
             u.email,
             u.name,
             u.phone,
             u.position,
             u.department_id,
             d.name as department_name,
             u.role,
             u.avatar_url,
             u.status,
             u.email_notifications,
             u.document_approvals,
             u.weekly_reports,
             u.system_alerts,
             u.two_factor_enabled
           FROM users u
           LEFT JOIN departments d ON d.id = u.department_id
           WHERE u.id = $1`,
          [updatedUser.id]
        )
      : null

    return NextResponse.json({ user })
  } catch (error) {
    console.error('Update user error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// DELETE user (admin only)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    if (!validateSameOrigin(request)) {
      return createInvalidOriginResponse()
    }

    const currentUser = await getCurrentUser()
    if (!currentUser || currentUser.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params

    // Prevent admin from deleting themselves
    if (currentUser.id === id) {
      return NextResponse.json(
        { error: 'Cannot delete your own account' },
        { status: 400 }
      )
    }

    // Check if user exists
    const existing = await queryOne<{ id: string }>(
      'SELECT id FROM users WHERE id = $1',
      [id]
    )
    if (!existing) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    await query('DELETE FROM users WHERE id = $1', [id])

    return NextResponse.json({ success: true, message: 'User deleted' })
  } catch (error) {
    console.error('Delete user error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
