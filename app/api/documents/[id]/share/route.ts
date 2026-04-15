import { NextRequest, NextResponse } from 'next/server'
import { query, queryOne } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'
import { ensureEmployeesTable } from '@/lib/employees'
import { sendMail, getMailerConfig } from '@/lib/mailer'
import { access } from 'fs/promises'
import { canShareDocument } from '@/lib/permissions'
import { resolveStoredUploadPath } from '@/lib/uploads'
import {
  applySimpleRateLimit,
  createInvalidOriginResponse,
  createRateLimitResponse,
  getClientIpAddress,
  validateSameOrigin,
} from '@/lib/request-security'

function buildMailto({
  to,
  subject,
  body,
}: {
  to: string
  subject: string
  body: string
}) {
  const params = new URLSearchParams({
    subject,
    body,
  })

  return `mailto:${encodeURIComponent(to)}?${params.toString()}`
}

// POST share document with employees and optional linked users
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    if (!validateSameOrigin(request)) {
      return createInvalidOriginResponse()
    }

    const shareRateLimit = applySimpleRateLimit({
      key: `documents:share:${getClientIpAddress(request)}`,
      maxRequests: 30,
      windowMs: 10 * 60 * 1000,
    })

    if (!shareRateLimit.allowed) {
      return createRateLimitResponse(shareRateLimit.retryAfterSeconds)
    }

    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const { employee_ids, message, send_email } = await request.json()

    await ensureEmployeesTable()

    // Check if document exists
    const document = await queryOne<{
      id: string
      title: string
      document_number: string
      uploaded_by: string | null
      department_id: string | null
      file_url: string | null
      file_name: string | null
      file_type: string | null
    }>(
      'SELECT id, title, document_number, uploaded_by, department_id, file_url, file_name, file_type FROM documents WHERE id = $1',
      [id]
    )
    if (!document) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 })
    }

    if (!canShareDocument(user, document)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    if (!employee_ids || !Array.isArray(employee_ids) || employee_ids.length === 0) {
      return NextResponse.json(
        { error: 'At least one employee must be selected' },
        { status: 400 }
      )
    }

    let attachment:
      | {
          filename: string
          path: string
          contentType?: string
        }
      | undefined

    if (send_email) {
      if (!getMailerConfig()) {
        return NextResponse.json(
          {
            error:
              'Email sending is not configured. Set SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, and SMTP_FROM in .env.local.',
          },
          { status: 500 }
        )
      }

      if (!document.file_url) {
        return NextResponse.json(
          { error: 'This document has no uploaded file to attach.' },
          { status: 400 }
        )
      }

      const attachmentPath = resolveStoredUploadPath(document.file_url)
      if (!attachmentPath) {
        return NextResponse.json(
          { error: 'The uploaded file path is invalid.' },
          { status: 400 }
        )
      }

      try {
        await access(attachmentPath)
      } catch {
        return NextResponse.json(
          { error: 'The uploaded file could not be found on disk.' },
          { status: 404 }
        )
      }

      attachment = {
        filename: document.file_name || `${document.document_number}.bin`,
        path: attachmentPath,
        contentType: document.file_type || undefined,
      }
    }

    const employees = await query<{
      id: string
      user_id: string | null
      name: string
      email: string
    }>(
      `SELECT id, user_id, name, email
       FROM employees
       WHERE id = ANY($1::uuid[])`,
      [employee_ids]
    )

    if (employees.length !== employee_ids.length) {
      return NextResponse.json(
        { error: 'One or more employees were not found' },
        { status: 404 }
      )
    }

    const shares = []
    const recipients = []
    const emailDrafts = []

    for (const employee of employees) {
      recipients.push({
        employee_id: employee.id,
        name: employee.name,
        email: employee.email,
        user_id: employee.user_id,
      })

      if (employee.user_id) {
        const existing = await queryOne(
          'SELECT id FROM document_shares WHERE document_id = $1 AND shared_with = $2',
          [id, employee.user_id]
        )

        if (!existing) {
          const share = await queryOne(
            `INSERT INTO document_shares (document_id, shared_by, shared_with, message, send_email)
             VALUES ($1, $2, $3, $4, $5)
             RETURNING *`,
            [id, user.id, employee.user_id, message, send_email]
          )
          shares.push(share)

          await query(
            `INSERT INTO notifications (user_id, title, message, type, related_document_id)
             VALUES ($1, $2, $3, 'info', $4)`,
            [
              employee.user_id,
              'Document Shared',
              `${user.name} shared "${document.title}" with you`,
              id
            ]
          )
        }
      }

      if (send_email) {
        const subject = `Shared document: ${document.title}`
        const bodyLines = [
          `Hello ${employee.name},`,
          '',
          `${user.name} shared a document with you.`,
          `Document: ${document.title}`,
          `Reference: ${document.document_number}`,
        ]

        if (message) {
          bodyLines.push('', 'Message:', message)
        }

        emailDrafts.push({
          to: employee.email,
          subject,
          body: bodyLines.join('\n'),
          mailto_url: buildMailto({
            to: employee.email,
            subject,
            body: bodyLines.join('\n'),
          }),
        })

        await sendMail({
          to: employee.email,
          subject,
          text: bodyLines.join('\n'),
          attachments: attachment ? [attachment] : undefined,
        })
      }
    }

    // Log activity
    await query(
      `INSERT INTO document_activities (document_id, user_id, action, details)
       VALUES ($1, $2, 'shared', $3)`,
      [
        id,
        user.id,
        JSON.stringify({
          shared_with_employees: recipients,
          message,
          send_email,
        }),
      ]
    )

    const emailMessage =
      send_email && emailDrafts.length > 0
        ? ' Email sent with attachment.'
        : ''

    return NextResponse.json({ 
      success: true, 
      shares,
      recipients,
      emailDrafts,
      message: `Document shared with ${recipients.length} employee(s).${emailMessage}` 
    })
  } catch (error) {
    console.error('Share document error:', error)
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : 'Internal server error',
      },
      { status: 500 }
    )
  }
}
