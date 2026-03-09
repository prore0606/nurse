import { NextRequest, NextResponse } from "next/server";

const PROTECTED_PATHS = ["/subjects", "/excel-upload", "/shopping"];

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // 관리자 영역만 보호 (스토어, 로그인, API는 제외)
  const isProtected =
    pathname === "/" || PROTECTED_PATHS.some((p) => pathname.startsWith(p));

  if (!isProtected) return NextResponse.next();

  const authCookie = req.cookies.get("admin_auth");
  if (authCookie?.value === "authenticated") {
    return NextResponse.next();
  }

  const loginUrl = new URL("/login", req.url);
  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: [
    /*
     * 보호 대상: / (admin 대시보드), /subjects/*, /excel-upload/*, /shopping/*
     * 제외: /store/*, /login, /api/*, /_next/*, /favicon.ico
     */
    "/((?!store|login|api|_next|favicon.ico).*)",
  ],
};
