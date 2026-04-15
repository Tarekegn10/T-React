import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'
import { createInvalidOriginResponse, validateSameOrigin } from '@/lib/request-security'

// GET user notifications
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const searchParams = request.nextUrl.searchParams
    const unreadOnly = searchParams.get('unread') === 'true'
    const limit = parseInt(searchParams.get('limit') || '20')

    let whereClause = 'user_id = $1'
    if (unreadOnly) {
      whereClause += ' AND is_read = false'
    }

    const notifications = await query(
      `SELECT * FROM notifications 
       WHERE ${whereClause}
       ORDER BY created_at DESC
       LIMIT $2`,
      [user.id, limit]
    )

    // Get unread count
    const unreadCount = await query<{ count: string }>(
      'SELECT COUNT(*) as count FROM notifications WHERE user_id = $1 AND is_read = false',
      [user.id]
    )

    return NextResponse.json({
      notifications,
      unreadCount: parseInt(unreadCount[0]?.count || '0'),
    })
  } catch (error) {
    console.error('Get notifications error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// PUT mark notifications as read
export async function PUT(request: NextRequest) {
  try {
    if (!validateSameOrigin(request)) {
      return createInvalidOriginResponse()
    }

    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { notification_ids, mark_all } = await request.json()

    if (mark_all) {
      await query(
        'UPDATE notifications SET is_read = true WHERE user_id = $1',
        [user.id]
      )
    } else if (notification_ids && Array.isArray(notification_ids)) {
      await query(
        'UPDATE notifications SET is_read = true WHERE id = ANY($1) AND user_id = $2',
        [notification_ids, user.id]
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Update notifications error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
