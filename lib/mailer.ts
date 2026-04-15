import nodemailer from "nodemailer"

function parseBoolean(value: string | undefined) {
  if (!value) {
    return false
  }

  return ["1", "true", "yes", "on"].includes(value.toLowerCase())
}

export function getMailerConfig() {
  const host = process.env.SMTP_HOST
  const port = Number(process.env.SMTP_PORT || "587")
  const user = process.env.SMTP_USER
  const pass = process.env.SMTP_PASS
  const from = process.env.SMTP_FROM
  const secure = parseBoolean(process.env.SMTP_SECURE) || port === 465

  if (!host || !port || !user || !pass || !from) {
    return null
  }

  return {
    host,
    port,
    secure,
    from,
    auth: {
      user,
      pass,
    },
  }
}

export async function sendMail({
  to,
  subject,
  text,
  attachments,
}: {
  to: string
  subject: string
  text: string
  attachments?: Array<{
    filename: string
    path: string
    contentType?: string
  }>
}) {
  const config = getMailerConfig()

  if (!config) {
    throw new Error("SMTP is not configured. Set SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, and SMTP_FROM.")
  }

  const transporter = nodemailer.createTransport({
    host: config.host,
    port: config.port,
    secure: config.secure,
    auth: config.auth,
  })

  try {
    await transporter.sendMail({
      from: config.from,
      to,
      subject,
      text,
      attachments,
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Email sending failed."

    if (message.includes("Application-specific password required")) {
      throw new Error("Gmail requires an App Password for SMTP. Replace SMTP_PASS with a Gmail App Password.")
    }

    throw new Error(message)
  }
}
