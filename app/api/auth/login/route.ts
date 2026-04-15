import { NextRequest, NextResponse } from 'next/server'
import { queryOne } from '@/lib/db'
import { verifyPassword, generateToken, setAuthCookie, createSession, updateLastActive } from '@/lib/auth'
import { createInvalidOriginResponse, validateSameOrigin } from '@/lib/request-security'

const LOGIN_WINDOW_MS = 15 * 60 * 1000
const LOGIN_BLOCK_MS = 15 * 60 * 1000
const MAX_LOGIN_ATTEMPTS = 5

type LoginAttemptRecord = {
  attempts: number
  windowStartedAt: number
  blockedUntil: number
}

const loginAttempts = new Map<string, LoginAttemptRecord>()

function getClientIpAddress(request: NextRequest) {
  return (
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    request.headers.get('x-real-ip')?.trim() ||
    'unknown'
  )
}

function getLoginAttemptKey(request: NextRequest, username: string) {
  return `${getClientIpAddress(request)}:${username.trim().toLowerCase()}`
}

function getLoginAttemptRecord(key: string) {
  const now = Date.now()
  const existing = loginAttempts.get(key)

  if (!existing) {
    return null
  }

  if (existing.blockedUntil > now) {
    return existing
  }

  if (now - existing.windowStartedAt > LOGIN_WINDOW_MS) {
    loginAttempts.delete(key)
    return null
  }

  return existing
}

function recordFailedLoginAttempt(key: string) {
  const now = Date.now()
  const existing = getLoginAttemptRecord(key)

  if (!existing) {
    loginAttempts.set(key, {
      attempts: 1,
      windowStartedAt: now,
      blockedUntil: 0,
    })
    return
  }

  const attempts = existing.attempts + 1
  loginAttempts.set(key, {
    attempts,
    windowStartedAt: existing.windowStartedAt,
    blockedUntil: attempts >= MAX_LOGIN_ATTEMPTS ? now + LOGIN_BLOCK_MS : 0,
  })
}

function clearFailedLoginAttempts(key: string) {
  loginAttempts.delete(key)
}

export async function POST(request: NextRequest) {
  try {
    if (!validateSameOrigin(request)) {
      return createInvalidOriginResponse()
    }

    const { username, password } = await request.json()

    if (!username || !password) {
      return NextResponse.json(
        { error: 'Username and password are required' },
        { status: 400 }
      )
    }

    const attemptKey = getLoginAttemptKey(request, username)
    const attemptRecord = getLoginAttemptRecord(attemptKey)

    if (attemptRecord?.blockedUntil && attemptRecord.blockedUntil > Date.now()) {
      const retryAfterSeconds = Math.ceil((attemptRecord.blockedUntil - Date.now()) / 1000)
      return NextResponse.json(
        { error: 'Too many login attempts. Try again later.' },
        {
          status: 429,
          headers: {
            'Retry-After': String(retryAfterSeconds),
          },
        }
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
      recordFailedLoginAttempt(attemptKey)
      return NextResponse.json(
        { error: 'Invalid username or password' },
        { status: 401 }
      )
    }

    // Verify password
    const isValid = await verifyPassword(password, user.password_hash)
    if (!isValid) {
      recordFailedLoginAttempt(attemptKey)
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

    clearFailedLoginAttempts(attemptKey)

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
