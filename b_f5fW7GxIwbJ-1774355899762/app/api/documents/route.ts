import { NextRequest, NextResponse } from 'next/server'
import { query, queryOne } from '@/lib/db'
import { getCurrentUserFromRequest } from '@/lib/auth'
import { ensureDocumentsSchema } from '@/lib/documents'

class ValidationError extends Error {
  status = 400
}

const DOCUMENT_TYPES = new Set(['received', 'sent', 'contract'])
const DOCUMENT_STATUSES = new Set(['pending', 'received', 'sent', 'archived'])
const DOCUMENT_PRIORITIES = new Set(['low', 'medium', 'high', 'urgent'])
const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

function normalizeOptionalString(value: unknown) {
  if (typeof value !== 'string') {
    return value ?? null
  }

  const trimmed = value.trim()
  return trimmed ? trimmed : null
}

function parseOptionalDate(value: unknown, fieldName: string) {
  if (value == null || value === '') {
    return null
  }

  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    throw new ValidationError(`${fieldName} must use the YYYY-MM-DD format`)
  }

  const parsed = new Date(`${value}T00:00:00.000Z`)
  if (Number.isNaN(parsed.getTime())) {
    throw new ValidationError(`${fieldName} is not a valid date`)
  }

  return value
}

// GET all documents with filters
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUserFromRequest(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const searchParams = request.nextUrl.searchParams
    const search = searchParams.get('search') || ''
    const status = searchParams.get('status')
    const type = searchParams.get('type')
    const departmentId = searchParams.get('department_id')
    const dateFrom = searchParams.get('date_from')
    const dateTo = searchParams.get('date_to')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const offset = (page - 1) * limit

    let whereConditions = ['1=1']
    const params: unknown[] = []
    let paramIndex = 1

    if (search) {
      whereConditions.push(`(
        d.title ILIKE $${paramIndex} OR 
        d.document_number ILIKE $${paramIndex} OR 
        d.subject ILIKE $${paramIndex} OR
        d.company_name ILIKE $${paramIndex}
      )`)
      params.push(`%${search}%`)
      paramIndex++
    }

    if (status && status !== 'all') {
      whereConditions.push(`d.status = $${paramIndex}`)
      params.push(status)
      paramIndex++
    }

    if (type && type !== 'all') {
      whereConditions.push(`d.document_type = $${paramIndex}`)
      params.push(type)
      paramIndex++
    }

    if (departmentId) {
      whereConditions.push(`d.department_id = $${paramIndex}`)
      params.push(departmentId)
      paramIndex++
    }

    if (dateFrom) {
      whereConditions.push(`d.created_at >= $${paramIndex}`)
      params.push(`${dateFrom}T00:00:00.000Z`)
      paramIndex++
    }

    if (dateTo) {
      whereConditions.push(`d.created_at < $${paramIndex}`)
      const nextDate = new Date(`${dateTo}T00:00:00.000Z`)
      nextDate.setUTCDate(nextDate.getUTCDate() + 1)
      params.push(nextDate.toISOString())
      paramIndex++
    }

    const whereClause = whereConditions.join(' AND ')

    // Get total count
    const countResult = await queryOne<{ count: string }>(
      `SELECT COUNT(*) as count FROM documents d WHERE ${whereClause}`,
      params
    )
    const total = parseInt(countResult?.count || '0')

    // Get documents
    const documents = await query(
      `SELECT 
        d.*,
        dep.name as department_name,
        u.name as uploaded_by_name
       FROM documents d
       LEFT JOIN departments dep ON d.department_id = dep.id
       LEFT JOIN users u ON d.uploaded_by = u.id
       WHERE ${whereClause}
       ORDER BY d.created_at DESC
       LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
      [...params, limit, offset]
    )

    return NextResponse.json({
      documents,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error('Get documents error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST create new document
export async function POST(request: NextRequest) {
  try {
    await ensureDocumentsSchema()

    const user = await getCurrentUserFromRequest(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const {
      document_number,
      title,
      subject,
      document_type,
      file_url,
      file_name,
      file_size,
      file_type,
      day_and_date,
      company_name,
      address,
      department_id,
      department_name,
      remark,
      received_date,
      to_whom,
      sent_date,
      forwarded_to,
      ethiopian_date,
      status = 'pending',
      priority = 'medium',
    } = body

    const normalizedDocumentNumber = typeof document_number === 'string' ? document_number.trim() : ''
    const normalizedTitle = typeof title === 'string' ? title.trim() : ''
    const normalizedDocumentType = typeof document_type === 'string' ? document_type.trim() : ''
    const normalizedStatus = typeof status === 'string' ? status.trim() : ''
    const normalizedPriority = typeof priority === 'string' ? priority.trim() : ''

    // Validate required fields
    if (!normalizedDocumentNumber || !normalizedTitle || !normalizedDocumentType) {
      return NextResponse.json(
        { error: 'Document number, title, and type are required' },
        { status: 400 }
      )
    }

    if (!DOCUMENT_TYPES.has(normalizedDocumentType)) {
      return NextResponse.json(
        { error: 'Document type must be received, sent, or contract' },
        { status: 400 }
      )
    }

    if (!DOCUMENT_STATUSES.has(normalizedStatus)) {
      return NextResponse.json(
        { error: 'Status must be pending, received, sent, or archived' },
        { status: 400 }
      )
    }

    if (!DOCUMENT_PRIORITIES.has(normalizedPriority)) {
      return NextResponse.json(
        { error: 'Priority must be low, medium, high, or urgent' },
        { status: 400 }
      )
    }

    if (department_id && (typeof department_id !== 'string' || !UUID_PATTERN.test(department_id))) {
      return NextResponse.json(
        { error: 'Department ID must be a valid UUID' },
        { status: 400 }
      )
    }

    const normalizedDayAndDate = parseOptionalDate(day_and_date, 'Day and date')
    const normalizedReceivedDate = parseOptionalDate(received_date, 'Received date')
    const normalizedSentDate = parseOptionalDate(sent_date, 'Sent date')
    const normalizedDepartmentName =
      typeof department_name === 'string' ? department_name.trim() : ''

    let resolvedDepartmentId = department_id || null
    if (!resolvedDepartmentId && normalizedDepartmentName) {
      const department = await queryOne<{ id: string }>(
        'SELECT id FROM departments WHERE name = $1',
        [normalizedDepartmentName]
      )

      if (!department) {
        return NextResponse.json(
          { error: 'Selected department was not found' },
          { status: 400 }
        )
      }

      resolvedDepartmentId = department.id
    }

    // Check if document number already exists
    const existing = await queryOne(
      'SELECT id FROM documents WHERE document_number = $1',
      [normalizedDocumentNumber]
    )
    if (existing) {
      return NextResponse.json(
        { error: 'Document number already exists' },
        { status: 400 }
      )
    }

    const document = await queryOne<{ id: string }>(
      `INSERT INTO documents (
        document_number, title, subject, document_type,
        file_url, file_name, file_size, file_type,
        day_and_date, company_name, address, department_id, remark,
        received_date, to_whom, sent_date, forwarded_to, ethiopian_date,
        status, priority, uploaded_by
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21
      ) RETURNING *`,
      [
        normalizedDocumentNumber,
        normalizedTitle,
        normalizeOptionalString(subject),
        normalizedDocumentType,
        normalizeOptionalString(file_url),
        normalizeOptionalString(file_name),
        file_size ?? null,
        normalizeOptionalString(file_type),
        normalizedDayAndDate,
        normalizeOptionalString(company_name),
        normalizeOptionalString(address),
        resolvedDepartmentId,
        normalizeOptionalString(remark),
        normalizedReceivedDate,
        normalizeOptionalString(to_whom),
        normalizedSentDate,
        normalizeOptionalString(forwarded_to),
        normalizeOptionalString(ethiopian_date),
        normalizedStatus,
        normalizedPriority,
        user.id
      ]
    )

    if (!document) {
      return NextResponse.json(
        { error: 'Failed to create document' },
        { status: 500 }
      )
    }

    // Log activity
    try {
      await query(
        `INSERT INTO document_activities (document_id, user_id, action, details)
         VALUES ($1, $2, 'created', $3)`,
        [document.id, user.id, JSON.stringify({ document_type: normalizedDocumentType })]
      )
    } catch (activityError) {
      console.warn('Create document activity log skipped:', activityError)
    }

    return NextResponse.json({ document }, { status: 201 })
  } catch (error) {
    console.error('Create document error:', error)
    if (error instanceof ValidationError) {
      return NextResponse.json({ error: error.message }, { status: error.status })
    }

    return NextResponse.json(
      {
        error:
          process.env.NODE_ENV === 'development' && error instanceof Error
            ? error.message
            : 'Internal server error',
      },
      { status: 500 }
    )
  }
}
