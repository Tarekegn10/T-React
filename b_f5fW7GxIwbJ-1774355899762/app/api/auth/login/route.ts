import { NextRequest, NextResponse } from 'next/server'
import { queryOne } from '@/lib/db'
import { verifyPassword, generateToken, setAuthCookie, createSession, updateLastActive } from '@/lib/auth'

export async function POST(request: NextRequest) {
  try {
    const { username, password } = await request.json()

    if (!username || !password) {
      return NextResponse.json(
        { error: 'Username and password are required' },
        { status: 400 }
      )
    }

    // Find user by username or email
    const user = await queryOne<{
      id: string
      username: string
      email: string
      password_hash: string
      name: string
      department_id: string | null
      phone: string | null
      position: string | null
      department_name: string | null
      avatar_url: string | null
      role: string
      status: string
    }>(
      `SELECT
         u.id,
         u.username,
         u.email,
         u.password_hash,
         u.name,
         u.department_id,
         u.phone,
         u.position,
         d.name as department_name,
         u.avatar_url,
         u.role,
         u.status
       FROM users u
       LEFT JOIN departments d ON d.id = u.department_id
       WHERE (u.username = $1 OR u.email = $1) AND u.status = 'active'`,
      [username]
    )

    if (!user) {
      return NextResponse.json(
        { error: 'Invalid username or password' },
        { status: 401 }
      )
    }

    // Verify password
    const isValid = await verifyPassword(password, user.password_hash)
    if (!isValid) {
      return NextResponse.json(
        { error: 'Invalid username or password' },
        { status: 401 }
      )
    }

    // Generate token
    const token = await generateToken({
      userId: user.id,
      username: user.username,
      role: user.role,
    })

    // Create session
    const deviceInfo = request.headers.get('user-agent') || undefined
    const ipAddress = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || undefined
    await createSession(user.id, token, deviceInfo, ipAddress)

    // Update last active
    await updateLastActive(user.id)

    // Set auth cookie
    await setAuthCookie(token)

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        name: user.name,
        department_id: user.department_id,
        phone: user.phone,
        position: user.position,
        department_name: user.department_name,
        avatar_url: user.avatar_url,
        role: user.role,
      },
    })
  } catch (error) {
    console.error('Login error:', error)
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
