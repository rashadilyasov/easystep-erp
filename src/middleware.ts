import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export const config = {
  matcher: [
    "/login",
    "/register",
    "/register-affiliate",
    "/((?!_next/static|_next/image|favicon.ico|icon.svg|apple-icon|api).*)",
  ],
};

function addSecurityHeaders(response: NextResponse) {
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  response.headers.set("X-DNS-Prefetch-Control", "on");
  return response;
}

export function middleware(request: NextRequest) {
  const { pathname, searchParams } = request.nextUrl;

  // /login -> redirect to home with modal param
  if (pathname === "/login") {
    const redirect = searchParams.get("redirect");
    const url = request.nextUrl.clone();
    url.pathname = "/";
    url.searchParams.set("auth", "login");
    if (redirect) url.searchParams.set("redirect", redirect);
    return addSecurityHeaders(NextResponse.redirect(url));
  }

  // /register -> redirect to home with modal param
  if (pathname === "/register") {
    const url = request.nextUrl.clone();
    url.pathname = "/";
    url.searchParams.set("auth", "register");
    return addSecurityHeaders(NextResponse.redirect(url));
  }

  // /register-affiliate -> redirect to home with affiliate modal
  if (pathname === "/register-affiliate") {
    const url = request.nextUrl.clone();
    url.pathname = "/";
    url.searchParams.set("auth", "affiliate");
    return addSecurityHeaders(NextResponse.redirect(url));
  }

  const response = NextResponse.next();
  return addSecurityHeaders(response);
}
