import { NextRequest, NextResponse } from "next/server";
import { requireAuth, revokeSession, revokeAllUserSessions, createAuditLog } from "@/lib/auth";

export async function POST(req: NextRequest) {
  const auth = await requireAuth(req);
  if (!auth.ok) return auth.res;

  // Body is optional — frontend may not send one
  const body = await req.json().catch(() => ({}));
  const { all } = body as { refreshToken?: string; all?: boolean };

  if (all) {
    // Logout from all sessions
    await revokeAllUserSessions(auth.userId);
    
    await createAuditLog({
      userId: auth.userId,
      companyId: auth.companyId,
      action: "LOGOUT_ALL",
      resource: "auth",
      req,
    });

    const allRes = NextResponse.json({ success: true, message: "Logged out from all devices" });
    allRes.cookies.delete('accessToken');
    allRes.cookies.delete('refreshToken');
    return allRes;
  }

  if (auth.sessionId) {
    await revokeSession(auth.sessionId);
    
    await createAuditLog({
      userId: auth.userId,
      companyId: auth.companyId,
      action: "LOGOUT",
      resource: "auth",
      metadata: { sessionId: auth.sessionId },
      req,
    });
  }

  const response = NextResponse.json({ success: true });
  
  // Limpar cookies de autenticação
  response.cookies.delete('accessToken');
  response.cookies.delete('refreshToken');

  return response;
}
