import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'

// GET reports data
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const searchParams = request.nextUrl.searchParams
    const dateFrom = searchParams.get('date_from')
    const dateTo = searchParams.get('date_to')
    const departmentId = searchParams.get('department_id')

    const documentFilters: string[] = []
    const documentParams: unknown[] = []
    let documentParamIndex = 1

    if (dateFrom) {
      documentFilters.push(`d.created_at >= $${documentParamIndex++}`)
      documentParams.push(dateFrom)
    }
    if (dateTo) {
      documentFilters.push(`d.created_at <= $${documentParamIndex++}`)
      documentParams.push(dateTo)
    }
    if (departmentId) {
      documentFilters.push(`d.department_id = $${documentParamIndex++}`)
      documentParams.push(departmentId)
    }

    const monthlyFilters = [...documentFilters]
    const monthlyParams = [...documentParams]
    if (!dateFrom && !dateTo) {
      monthlyFilters.push(`d.created_at >= CURRENT_DATE - INTERVAL '6 months'`)
    }

    const documentsWhereClause = documentFilters.length
      ? `WHERE ${documentFilters.join(' AND ')}`
      : ''
    const monthlyWhereClause = monthlyFilters.length
      ? `WHERE ${monthlyFilters.join(' AND ')}`
      : ''

    // Monthly activity data
    const monthlyActivity = await query(
      `SELECT 
        TO_CHAR(DATE_TRUNC('month', d.created_at), 'Mon') as month,
        COUNT(*) FILTER (WHERE d.document_type = 'received') as received,
        COUNT(*) FILTER (WHERE d.document_type = 'sent') as sent,
        COUNT(*) FILTER (WHERE d.document_type = 'contract') as contract
       FROM documents d
       ${monthlyWhereClause}
       GROUP BY DATE_TRUNC('month', d.created_at)
       ORDER BY DATE_TRUNC('month', d.created_at)`,
      monthlyParams
    )

    // Status distribution
    const statusDistribution = await query(
      `SELECT 
        d.status as status,
        COUNT(*) as count
       FROM documents d
       ${documentsWhereClause}
       GROUP BY d.status`,
      documentParams
    )

    // Documents by department
    const departmentJoinFilters: string[] = []
    const departmentJoinParams: unknown[] = []
    let departmentJoinParamIndex = 1

    if (dateFrom) {
      departmentJoinFilters.push(`doc.created_at >= $${departmentJoinParamIndex++}`)
      departmentJoinParams.push(dateFrom)
    }
    if (dateTo) {
      departmentJoinFilters.push(`doc.created_at <= $${departmentJoinParamIndex++}`)
      departmentJoinParams.push(dateTo)
    }

    const departmentWhereClause = departmentId
      ? `WHERE d.id = $${departmentJoinParamIndex}`
      : ''
    if (departmentId) {
      departmentJoinParams.push(departmentId)
    }

    const byDepartment = await query(
      `SELECT 
        d.name as department,
        COUNT(doc.id) as count
       FROM departments d
       LEFT JOIN documents doc ON d.id = doc.department_id${
         departmentJoinFilters.length ? ` AND ${departmentJoinFilters.join(' AND ')}` : ''
       }
       ${departmentWhereClause}
       GROUP BY d.id, d.name
       ORDER BY count DESC`,
      departmentJoinParams
    )

    // Summary stats
    const summary = await query(
      `SELECT 
        COUNT(*) as total,
        COUNT(*) FILTER (WHERE d.document_type = 'received') as received,
        COUNT(*) FILTER (WHERE d.document_type = 'sent') as sent,
        COUNT(*) FILTER (WHERE d.document_type = 'contract') as contract
       FROM documents d
       ${documentsWhereClause}`,
      documentParams
    )

    return NextResponse.json({
      monthlyActivity,
      statusDistribution,
      byDepartment,
      summary: summary[0] || { total: 0, received: 0, sent: 0, contract: 0 },
    })
  } catch (error) {
    console.error('Get reports error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
