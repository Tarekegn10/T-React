import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

function hasAuthCookie(request: NextRequest) {
  return Boolean(request.cookies.get("auth_token")?.value)
}

export function proxy(request: NextRequest) {
  if (!hasAuthCookie(request)) {
    const loginUrl = new URL("/login", request.url)
    return NextResponse.redirect(loginUrl)
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/documents/:path*",
    "/upload/:path*",
    "/search/:path*",
    "/categories/:path*",
    "/reports/:path*",
    "/settings/:path*",
    "/users/:path*",
    "/profile/:path*",
    "/admin-settings/:path*",
  ],
}
