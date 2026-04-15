import { NextResponse } from 'next/server'
import { query, queryOne } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'

// GET dashboard statistics
export async function GET() {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get document counts by type
    const stats = await queryOne<{
      total: string
      received: string
      sent: string
      contract: string
      archived: string
    }>(`
      SELECT 
        COUNT(*) as total,
        COUNT(*) FILTER (WHERE document_type = 'received') as received,
        COUNT(*) FILTER (WHERE document_type = 'sent') as sent,
        COUNT(*) FILTER (WHERE document_type = 'contract') as contract,
        COUNT(*) FILTER (WHERE status = 'archived') as archived
      FROM documents
    `)

    // Get growth rate (compare this month to last month)
    const growthData = await query<{ month: string; count: string }>(`
      SELECT 
        DATE_TRUNC('month', created_at) as month,
        COUNT(*) as count
      FROM documents
      WHERE created_at >= DATE_TRUNC('month', CURRENT_DATE) - INTERVAL '1 month'
      GROUP BY DATE_TRUNC('month', created_at)
      ORDER BY month
    `)

    let growthRate = 0
    if (growthData.length === 2) {
      const lastMonth = parseInt(growthData[0].count)
      const thisMonth = parseInt(growthData[1].count)
      if (lastMonth > 0) {
        growthRate = Math.round(((thisMonth - lastMonth) / lastMonth) * 100)
      }
    }

    // Get recent documents
    const recentDocuments = await query(`
      SELECT 
        d.id, d.document_number, d.title, d.document_type, d.status, d.priority,
        d.created_at, dep.name as department_name
      FROM documents d
      LEFT JOIN departments dep ON d.department_id = dep.id
      ORDER BY d.created_at DESC
      LIMIT 5
    `)

    // Get recent activity
    const recentActivity = await query(`
      SELECT 
        da.id, da.action, da.created_at,
        u.name as user_name,
        d.title as document_title
      FROM document_activities da
      JOIN users u ON da.user_id = u.id
      JOIN documents d ON da.document_id = d.id
      ORDER BY da.created_at DESC
      LIMIT 5
    `)

    return NextResponse.json({
      stats: {
        total: parseInt(stats?.total || '0'),
        received: parseInt(stats?.received || '0'),
        sent: parseInt(stats?.sent || '0'),
        contract: parseInt(stats?.contract || '0'),
        archived: parseInt(stats?.archived || '0'),
        growthRate,
      },
      recentDocuments,
      recentActivity,
    })
  } catch (error) {
    console.error('Get dashboard stats error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
