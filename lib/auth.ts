import bcrypt from 'bcryptjs'
import { SignJWT, jwtVerify } from 'jose'
import { cookies } from 'next/headers'
import type { NextRequest } from 'next/server'
import { query, queryOne } from './db'

function getJwtSecret() {
  const configuredSecret = process.env.JWT_SECRET?.trim()

  if (
    configuredSecret &&
    configuredSecret !== 'change-this-secret' &&
    configuredSecret !== 'your-secret-key-change-in-production'
  ) {
    return new TextEncoder().encode(configuredSecret)
  }

  if (process.env.NODE_ENV === 'production') {
    throw new Error('JWT_SECRET must be set to a strong unique value in production.')
  }

  return new TextEncoder().encode('development-only-secret-change-me')
}

export interface JWTPayload {
  userId: string
  username: string
  role: string
  exp?: number
}

// Hash password
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10)
}

// Verify password
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash)
}

// Generate JWT token
export async function generateToken(payload: Omit<JWTPayload, 'exp'>): Promise<string> {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setExpirationTime('7d')
    .setIssuedAt()
    .sign(getJwtSecret())
}

// Verify JWT token
export async function verifyToken(token: string): Promise<JWTPayload | null> {
  try {
    const { payload } = await jwtVerify(token, getJwtSecret())
    return payload as unknown as JWTPayload
  } catch {
    return null
  }
}

// Get current user from cookies
export async function getCurrentUser() {
  const cookieStore = await cookies()
  const token = cookieStore.get('auth_token')?.value
  
  if (!token) {
    return null
  }

  const payload = await verifyToken(token)
  if (!payload) {
    return null
  }

  const activeSession = await queryOne<{ user_id: string }>(
    `SELECT user_id
     FROM sessions
     WHERE token = $1
       AND expires_at > CURRENT_TIMESTAMP
     LIMIT 1`,
    [token]
  )

  if (!activeSession || activeSession.user_id !== payload.userId) {
    return null
  }

  const user = await queryOne<{
    id: string
    username: string
    email: string
    name: string
    role: string
    department_id: string | null
    phone: string | null
    position: string | null
    department_name: string | null
    avatar_url: string | null
    status: string
  }>(
    `SELECT
       u.id,
       u.username,
       u.email,
       u.name,
       u.role,
       u.department_id,
       u.phone,
       u.position,
       d.name as department_name,
       u.avatar_url,
       u.status
     FROM users u
     LEFT JOIN departments d ON d.id = u.department_id
     WHERE u.id = $1 AND u.status = 'active'`,
    [payload.userId]
  )

  return user
}

export async function getCurrentUserFromRequest(request?: NextRequest) {
  return getCurrentUser()
}

// Set auth cookie
export async function setAuthCookie(token: string) {
  const cookieStore = await cookies()
  cookieStore.set('auth_token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 7, // 7 days
    path: '/',
  })
}

// Clear auth cookie
export async function clearAuthCookie() {
  const cookieStore = await cookies()
  cookieStore.delete('auth_token')
}

// Create session in database
export async function createSession(userId: string, token: string, deviceInfo?: string, ipAddress?: string) {
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days

  await query(
    `INSERT INTO sessions (user_id, token, device_info, ip_address, expires_at)
     VALUES ($1, $2, $3, $4, $5)`,
    [userId, token, deviceInfo, ipAddress, expiresAt]
  )
}

// Delete session
export async function deleteSession(token: string) {
  try {
    await query('DELETE FROM sessions WHERE token = $1', [token])
  } catch (error) {
    console.warn('Session deletion skipped:', error)
  }
}

// Update last active
export async function updateLastActive(userId: string) {
  try {
    await query(
      'UPDATE users SET last_active = CURRENT_TIMESTAMP WHERE id = $1',
      [userId]
    )
  } catch (error) {
    console.warn('Last active update skipped:', error)
  }
}
