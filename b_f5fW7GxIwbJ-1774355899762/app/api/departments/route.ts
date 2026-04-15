import { NextRequest, NextResponse } from 'next/server'
import { query, queryOne } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'

// GET all departments with document counts
export async function GET() {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const departments = await query(
      `SELECT 
        d.*,
        COUNT(doc.id) as document_count
       FROM departments d
       LEFT JOIN documents doc ON d.id = doc.department_id
       GROUP BY d.id
       ORDER BY d.name`
    )

    return NextResponse.json({ departments })
  } catch (error) {
    console.error('Get departments error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST create department (admin only)
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { name, description, icon, color } = await request.json()

    if (!name) {
      return NextResponse.json(
        { error: 'Department name is required' },
        { status: 400 }
      )
    }

    // Check if department already exists
    const existing = await queryOne(
      'SELECT id FROM departments WHERE name = $1',
      [name]
    )
    if (existing) {
      return NextResponse.json(
        { error: 'Department already exists' },
        { status: 400 }
      )
    }

    const department = await queryOne(
      `INSERT INTO departments (name, description, icon, color)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [name, description, icon || 'Folder', color || 'gray']
    )

    return NextResponse.json({ department }, { status: 201 })
  } catch (error) {
    console.error('Create department error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
