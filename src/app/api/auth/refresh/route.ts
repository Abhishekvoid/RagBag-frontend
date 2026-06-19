import { NextRequest, NextResponse } from "next/server";

const BACKEND = process.env.BACKEND_API_URL!;
const REFRESH_COOKIE = "rt";
const REFRESH_MAX_AGE = 7 * 24 * 60 * 60;

export async function POST(req: NextRequest) {
  const refresh = req.cookies.get(REFRESH_COOKIE)?.value;
  if (!refresh) {
    return NextResponse.json({ detail: "No session" }, { status: 401 });
  }
  const r = await fetch(`${BACKEND}/auth/jwt/refresh/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ refresh }),
  });
  const data = await r.json().catch(() => ({}));
  if (!r.ok) {
    const res = NextResponse.json(data, { status: r.status });
    res.cookies.delete({ name: REFRESH_COOKIE, path: "/api/auth" });
    return res;
  }
  const res = NextResponse.json({ access: data.access });
  if (data.refresh) {
    res.cookies.set(REFRESH_COOKIE, data.refresh, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/api/auth",
      maxAge: REFRESH_MAX_AGE,
    });
  }
  return res;
}
