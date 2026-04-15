import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUserFromRequest } from '@/lib/auth'
import { writeFile, mkdir } from 'fs/promises'
import path from 'path'
import { isAllowedUploadFile } from '@/lib/uploads'
import {
  applySimpleRateLimit,
  createInvalidOriginResponse,
  createRateLimitResponse,
  getClientIpAddress,
  validateSameOrigin,
} from '@/lib/request-security'

// POST upload file
export async function POST(request: NextRequest) {
  try {
    if (!validateSameOrigin(request)) {
      return createInvalidOriginResponse()
    }

    const uploadRateLimit = applySimpleRateLimit({
      key: `upload:${getClientIpAddress(request)}`,
      maxRequests: 20,
      windowMs: 10 * 60 * 1000,
    })

    if (!uploadRateLimit.allowed) {
      return createRateLimitResponse(uploadRateLimit.retryAfterSeconds)
    }

    const user = await getCurrentUserFromRequest(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const formData = await request.formData()
    const file = formData.get('file') as File | null

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    // Check file size (10MB max)
    const maxSize = 10 * 1024 * 1024
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: 'File size exceeds 10MB limit' },
        { status: 400 }
      )
    }

    if (!isAllowedUploadFile(file.name, file.type)) {
      return NextResponse.json(
        { error: 'Only PDF, Office, text, and common image files are allowed' },
        { status: 400 }
      )
    }

    // Create uploads directory if it doesn't exist
    const uploadsDir = path.join(process.cwd(), 'public', 'uploads')
    await mkdir(uploadsDir, { recursive: true })

    // Generate unique filename
    const timestamp = Date.now()
    const originalName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_')
    const fileName = `${timestamp}-${originalName}`
    const filePath = path.join(uploadsDir, fileName)

    // Write file to disk
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    await writeFile(filePath, buffer)

    // Return file info
    const fileUrl = `/uploads/${fileName}`

    return NextResponse.json({
      success: true,
      file: {
        url: fileUrl,
        name: file.name,
        size: file.size,
        type: file.type,
      },
    })
  } catch (error) {
    console.error('Upload error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
