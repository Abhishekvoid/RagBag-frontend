import { NextRequest, NextResponse } from "next/server";

const BACKEND = process.env.BACKEND_API_URL!;
const REFRESH_COOKIE = "rt";

export async function POST(req: NextRequest) {
  const refresh = req.cookies.get(REFRESH_COOKIE)?.value;
  if (refresh) {
    try {
      await fetch(`${BACKEND}/auth/jwt/blacklist/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refresh }),
      });
    } catch {
      // best-effort revocation; still clear the cookie below
    }
  }
  const res = NextResponse.json({ ok: true });
  res.cookies.delete({ name: REFRESH_COOKIE, path: "/api/auth" });
  return res;
}
