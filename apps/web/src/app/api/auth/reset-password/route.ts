import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const Body = z.object({
  token: z.string(),
  password: z.string().min(8),
});

export async function POST(req: NextRequest) {
  const json = await req.json();
  const body = Body.safeParse(json);

  if (!body.success) {
    return NextResponse.json(
      { error: { code: "BAD_REQUEST", message: "Invalid request" } },
      { status: 400 }
    );
  }

  return NextResponse.json(
    {
      error: {
        code: "NOT_AVAILABLE",
        message: "Password reset by token is not available in the current database schema",
      },
    },
    { status: 501 }
  );
}
