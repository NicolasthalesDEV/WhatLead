import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  // Verificação de webhook (modo dev)
  const url = new URL(req.url);
  const mode = url.searchParams.get("hub.mode");
  const token = url.searchParams.get("hub.verify_token");
  const challenge = url.searchParams.get("hub.challenge");
  if (mode === "subscribe" && token === process.env.WA_VERIFY_TOKEN) {
    return new Response(challenge || "", { status: 200 });
  }
  return new Response("forbidden", { status: 403 });
}

export async function POST(req: NextRequest) {
  // Stub: apenas loga o payload em dev
  const payload = await req.json();
  console.log("WA WEBHOOK:", JSON.stringify(payload));
  return NextResponse.json({ received: true });
}
