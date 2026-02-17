import { NextRequest, NextResponse } from "next/server";
import { generateCsrfToken, setCsrfCookie } from "@/lib/csrf";

export async function GET(req: NextRequest) {
  const token = generateCsrfToken();
  const res = NextResponse.json({ csrfToken: token });
  return setCsrfCookie(res, token);
}
