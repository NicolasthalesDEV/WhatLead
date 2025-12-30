import { NextRequest, NextResponse } from "next/server";
import { SignJWT, jwtVerify } from "jose";

const alg = "HS256";
const secret = new TextEncoder().encode(process.env.JWT_SECRET || "devsecret");

type Claims = { uid: string; companyId: string; role: string };

export async function signJwt(payload: Claims) {
  return await new SignJWT(payload).setProtectedHeader({ alg }).setIssuedAt().setExpirationTime("7d").sign(secret);
}

export async function verifyJwt(token: string) {
  const { payload } = await jwtVerify(token, secret, { algorithms: [alg] });
  return payload as Claims;
}

export async function requireAuth(req: NextRequest): Promise<{ ok: true; companyId: string } | { ok: false; res: NextResponse }> {
  const auth = req.headers.get("authorization");
  if (!auth?.startsWith("Bearer ")) {
    return { ok: false, res: NextResponse.json({ error: { code: "UNAUTHORIZED" } }, { status: 401 }) };
  }
  const token = auth.slice(7);
  try {
    const claims = await verifyJwt(token);
    return { ok: true, companyId: claims.companyId };
  } catch {
    return { ok: false, res: NextResponse.json({ error: { code: "UNAUTHORIZED" } }, { status: 401 }) };
  }
}
