import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const Query = z.object({
  token: z.string(),
});

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const query = Query.safeParse({ token: searchParams.get("token") });

  if (!query.success) {
    return NextResponse.json(
      { error: { code: "BAD_REQUEST", message: "Invalid token" } },
      { status: 400 }
    );
  }

  return NextResponse.json(
    {
      error: {
        code: "NOT_AVAILABLE",
        message: "Email verification is not available in the current database schema",
      },
    },
    { status: 501 }
  );
}
