import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { clearAuthCookie, deleteSession } from '@/lib/auth'
import { createInvalidOriginResponse, validateSameOrigin } from '@/lib/request-security'

export async function POST(request: NextRequest) {
  try {
    if (!validateSameOrigin(request)) {
      return createInvalidOriginResponse()
    }

    const cookieStore = await cookies()
    const token = cookieStore.get('auth_token')?.value

    if (token) {
      await deleteSession(token)
    }

    await clearAuthCookie()

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Logout error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
