import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { z } from "zod";

const Body = z.object({
  code: z.string().length(6),
});

export async function POST(req: NextRequest) {
  const auth = await requireAuth(req);
  if (!auth.ok) return auth.res;

  const json = await req.json();
  const body = Body.safeParse(json);

  if (!body.success) {
    return NextResponse.json(
      { error: { code: "BAD_REQUEST", message: "Invalid code format" } },
      { status: 400 }
    );
  }

  return NextResponse.json(
    {
      error: {
        code: "NOT_AVAILABLE",
        message: "2FA is not available in the current database schema",
      },
    },
    { status: 501 }
  );
}
