import { NextRequest, NextResponse } from 'next/server'
import { query, queryOne } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'

// GET system settings
export async function GET() {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const settings = await queryOne(
      'SELECT * FROM system_settings LIMIT 1'
    )

    return NextResponse.json({ settings })
  } catch (error) {
    console.error('Get settings error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// PUT update system settings (admin only)
export async function PUT(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const {
      organization_name,
      contact_email,
      address,
      auto_backup_enabled,
      backup_frequency,
    } = await request.json()

    const settings = await queryOne(
      `UPDATE system_settings SET
        organization_name = COALESCE($1, organization_name),
        contact_email = COALESCE($2, contact_email),
        address = COALESCE($3, address),
        auto_backup_enabled = COALESCE($4, auto_backup_enabled),
        backup_frequency = COALESCE($5, backup_frequency),
        updated_at = CURRENT_TIMESTAMP
       WHERE id = (SELECT id FROM system_settings LIMIT 1)
       RETURNING *`,
      [organization_name, contact_email, address, auto_backup_enabled, backup_frequency]
    )

    return NextResponse.json({ settings })
  } catch (error) {
    console.error('Update settings error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
