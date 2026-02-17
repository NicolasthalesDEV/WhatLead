import { NextRequest, NextResponse } from "next/server";
import { requireAuth, revokeSession, revokeAllUserSessions, createAuditLog } from "@/lib/auth";

export async function POST(req: NextRequest) {
  const auth = await requireAuth(req);
  if (!auth.ok) return auth.res;

  const { refreshToken, all } = await req.json();

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

    return NextResponse.json({ success: true, message: "Logged out from all devices" });
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

  return NextResponse.json({ success: true });
}
