import { NextRequest, NextResponse } from 'next/server'
import { query, queryOne } from '@/lib/db'
import { getCurrentUser, hashPassword } from '@/lib/auth'
import { createInvalidOriginResponse, validateSameOrigin } from '@/lib/request-security'

// GET all users
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const searchParams = request.nextUrl.searchParams
    const search = searchParams.get('search') || ''
    const department_id = searchParams.get('department_id')
    const role = searchParams.get('role')
    const status = searchParams.get('status')

    let whereConditions = ['1=1']
    const params: unknown[] = []
    let paramIndex = 1

    if (search) {
      whereConditions.push(`(
        u.name ILIKE $${paramIndex} OR 
        u.email ILIKE $${paramIndex} OR 
        u.username ILIKE $${paramIndex}
      )`)
      params.push(`%${search}%`)
      paramIndex++
    }

    if (department_id) {
      whereConditions.push(`u.department_id = $${paramIndex}`)
      params.push(department_id)
      paramIndex++
    }

    if (role) {
      whereConditions.push(`u.role = $${paramIndex}`)
      params.push(role)
      paramIndex++
    }

    if (status) {
      whereConditions.push(`u.status = $${paramIndex}`)
      params.push(status)
      paramIndex++
    }

    const whereClause = whereConditions.join(' AND ')

    const users = await query(
      `SELECT 
        u.id, u.username, u.email, u.name, u.phone, u.position,
        u.department_id, u.role, u.avatar_url, u.status, u.last_active,
        u.created_at, u.updated_at,
        d.name as department_name
       FROM users u
       LEFT JOIN departments d ON u.department_id = d.id
       WHERE ${whereClause}
       ORDER BY u.name`,
      params
    )

    return NextResponse.json({ users })
  } catch (error) {
    console.error('Get users error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST create user (admin only)
export async function POST(request: NextRequest) {
  try {
    if (!validateSameOrigin(request)) {
      return createInvalidOriginResponse()
    }

    const user = await getCurrentUser()
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const {
      username,
      email,
      password,
      name,
      phone,
      position,
      department_id,
      role = 'user',
    } = await request.json()

    if (!username || !email || !password || !name) {
      return NextResponse.json(
        { error: 'Username, email, password, and name are required' },
        { status: 400 }
      )
    }

    // Check if username or email already exists
    const existing = await queryOne(
      'SELECT id FROM users WHERE username = $1 OR email = $2',
      [username, email]
    )
    if (existing) {
      return NextResponse.json(
        { error: 'Username or email already exists' },
        { status: 400 }
      )
    }

    const password_hash = await hashPassword(password)

    const newUser = await queryOne(
      `INSERT INTO users (username, email, password_hash, name, phone, position, department_id, role)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING id, username, email, name, phone, position, department_id, role, status, created_at`,
      [username, email, password_hash, name, phone, position, department_id, role]
    )

    return NextResponse.json({ user: newUser }, { status: 201 })
  } catch (error) {
    console.error('Create user error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
