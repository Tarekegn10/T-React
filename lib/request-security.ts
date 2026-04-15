import { NextRequest, NextResponse } from "next/server"

type RateLimitEntry = {
  count: number
  windowStartedAt: number
}

const rateLimitBuckets = new Map<string, RateLimitEntry>()

function normalizeOrigin(value: string | null | undefined) {
  if (!value) {
    return null
  }

  try {
    return new URL(value).origin
  } catch {
    return null
  }
}

function buildServerOrigin(request: NextRequest) {
  const forwardedProto = request.headers.get("x-forwarded-proto")?.trim()
  const forwardedHost = request.headers.get("x-forwarded-host")?.trim()
  const host = forwardedHost || request.headers.get("host")?.trim()
  const protocol = forwardedProto || request.nextUrl.protocol.replace(/:$/, "")

  if (!host || !protocol) {
    return null
  }

  return `${protocol}://${host}`
}

function isLocalDevelopmentHostname(hostname: string) {
  return (
    hostname === "localhost" ||
    hostname === "127.0.0.1" ||
    hostname === "::1" ||
    hostname.startsWith("192.168.1.")
  )
}

function isAllowedDevelopmentOrigin(candidateOrigin: string, validOrigins: string[]) {
  try {
    const candidate = new URL(candidateOrigin)
    if (!isLocalDevelopmentHostname(candidate.hostname)) {
      return false
    }

    return validOrigins.some((origin) => {
      try {
        const valid = new URL(origin)
        return valid.port === candidate.port && isLocalDevelopmentHostname(valid.hostname)
      } catch {
        return false
      }
    })
  } catch {
    return false
  }
}

export function validateSameOrigin(request: NextRequest) {
  const requestOrigin = normalizeOrigin(request.nextUrl.origin)
  const serverOrigin = normalizeOrigin(buildServerOrigin(request))
  const validOrigins = [requestOrigin, serverOrigin].filter((value): value is string => Boolean(value))
  const originHeader = normalizeOrigin(request.headers.get("origin"))
  const refererHeader = request.headers.get("referer")

  if (originHeader) {
    if (validOrigins.includes(originHeader)) {
      return true
    }

    return process.env.NODE_ENV !== "production" && isAllowedDevelopmentOrigin(originHeader, validOrigins)
  }

  if (refererHeader) {
    try {
      const refererOrigin = new URL(refererHeader).origin
      if (validOrigins.includes(refererOrigin)) {
        return true
      }

      return process.env.NODE_ENV !== "production" && isAllowedDevelopmentOrigin(refererOrigin, validOrigins)
    } catch {
      return false
    }
  }

  return process.env.NODE_ENV !== "production"
}

export function createInvalidOriginResponse() {
  return NextResponse.json(
    { error: "Invalid request origin" },
    { status: 403 }
  )
}

export function getClientIpAddress(request: NextRequest) {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip")?.trim() ||
    "unknown"
  )
}

export function applySimpleRateLimit({
  key,
  maxRequests,
  windowMs,
}: {
  key: string
  maxRequests: number
  windowMs: number
}) {
  const now = Date.now()
  const existing = rateLimitBuckets.get(key)

  if (!existing || now - existing.windowStartedAt > windowMs) {
    rateLimitBuckets.set(key, {
      count: 1,
      windowStartedAt: now,
    })

    return {
      allowed: true,
      retryAfterSeconds: 0,
    }
  }

  if (existing.count >= maxRequests) {
    const retryAfterSeconds = Math.ceil((windowMs - (now - existing.windowStartedAt)) / 1000)
    return {
      allowed: false,
      retryAfterSeconds,
    }
  }

  existing.count += 1
  rateLimitBuckets.set(key, existing)

  return {
    allowed: true,
    retryAfterSeconds: 0,
  }
}

export function createRateLimitResponse(retryAfterSeconds: number) {
  return NextResponse.json(
    { error: "Too many requests. Try again later." },
    {
      status: 429,
      headers: {
        "Retry-After": String(retryAfterSeconds),
      },
    }
  )
}
