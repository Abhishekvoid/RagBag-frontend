import { NextRequest, NextResponse } from "next/server";

const BACKEND = process.env.BACKEND_API_URL!;
const REFRESH_COOKIE = "rt";
const REFRESH_MAX_AGE = 7 * 24 * 60 * 60;

export async function POST(req: NextRequest) {
  const body = await req.json();
  const r = await fetch(`${BACKEND}/auth/jwt/create/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await r.json().catch(() => ({}));
  if (!r.ok) {
    return NextResponse.json(data, { status: r.status });
  }
  const res = NextResponse.json({ access: data.access });
  res.cookies.set(REFRESH_COOKIE, data.refresh, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/api/auth",
    maxAge: REFRESH_MAX_AGE,
  });
  return res;
}
