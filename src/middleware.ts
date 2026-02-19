import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export const config = {
  matcher: ["/login", "/register"],
};

export function middleware(request: NextRequest) {
  const { pathname, searchParams } = request.nextUrl;

  // /login -> redirect to home with modal param
  if (pathname === "/login") {
    const redirect = searchParams.get("redirect");
    const url = request.nextUrl.clone();
    url.pathname = "/";
    url.searchParams.set("auth", "login");
    if (redirect) url.searchParams.set("redirect", redirect);
    return NextResponse.redirect(url);
  }

  // /register -> redirect to home with modal param
  if (pathname === "/register") {
    const url = request.nextUrl.clone();
    url.pathname = "/";
    url.searchParams.set("auth", "register");
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}
