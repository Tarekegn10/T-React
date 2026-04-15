import { NextRequest, NextResponse } from 'next/server'
import { query, queryOne } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'

// GET single document
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params

    const document = await queryOne(
      `SELECT 
        d.*,
        dep.name as department_name,
        u.name as uploaded_by_name
       FROM documents d
       LEFT JOIN departments dep ON d.department_id = dep.id
       LEFT JOIN users u ON d.uploaded_by = u.id
       WHERE d.id = $1`,
      [id]
    )

    if (!document) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 })
    }

    // Log view activity
    await query(
      `INSERT INTO document_activities (document_id, user_id, action)
       VALUES ($1, $2, 'viewed')`,
      [id, user.id]
    )

    return NextResponse.json({ document })
  } catch (error) {
    console.error('Get document error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// PUT update document
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const body = await request.json()

    // Check if document exists
    const existing = await queryOne<{ id: string }>(
      'SELECT id FROM documents WHERE id = $1',
      [id]
    )
    if (!existing) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 })
    }

    const {
      title,
      subject,
      company_name,
      address,
      department_id,
      remark,
      received_date,
      to_whom,
      sent_date,
      forwarded_to,
      ethiopian_date,
      status,
      priority,
    } = body

    const document = await queryOne(
      `UPDATE documents SET
        title = COALESCE($1, title),
        subject = COALESCE($2, subject),
        company_name = COALESCE($3, company_name),
        address = COALESCE($4, address),
        department_id = COALESCE($5, department_id),
        remark = COALESCE($6, remark),
        received_date = COALESCE($7, received_date),
        to_whom = COALESCE($8, to_whom),
        sent_date = COALESCE($9, sent_date),
        forwarded_to = COALESCE($10, forwarded_to),
        ethiopian_date = COALESCE($11, ethiopian_date),
        status = COALESCE($12, status),
        priority = COALESCE($13, priority),
        updated_at = CURRENT_TIMESTAMP
       WHERE id = $14
       RETURNING *`,
      [
        title, subject, company_name, address, department_id, remark,
        received_date, to_whom, sent_date, forwarded_to, ethiopian_date,
        status, priority, id
      ]
    )

    // Log activity
    await query(
      `INSERT INTO document_activities (document_id, user_id, action, details)
       VALUES ($1, $2, 'edited', $3)`,
      [id, user.id, JSON.stringify(body)]
    )

    return NextResponse.json({ document })
  } catch (error) {
    console.error('Update document error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// DELETE document
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params

    // Check if document exists
    const existing = await queryOne<{ id: string; title: string }>(
      'SELECT id, title FROM documents WHERE id = $1',
      [id]
    )
    if (!existing) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 })
    }

    // Delete document (cascades to shares and activities)
    await query('DELETE FROM documents WHERE id = $1', [id])

    return NextResponse.json({ success: true, message: 'Document deleted' })
  } catch (error) {
    console.error('Delete document error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
