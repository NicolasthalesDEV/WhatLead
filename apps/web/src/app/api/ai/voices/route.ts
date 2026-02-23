/**
 * GET /api/ai/voices
 * Lists available ElevenLabs voices for the settings panel.
 */
import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { listVoices, isElevenLabsConfigured } from "@/lib/elevenlabs";

export async function GET(req: NextRequest) {
  const auth = await requireAuth(req);
  if (!auth.ok) return auth.res;

  if (!isElevenLabsConfigured()) {
    return NextResponse.json({ voices: [], configured: false });
  }

  try {
    const voices = await listVoices();
    return NextResponse.json({ voices, configured: true });
  } catch (error: any) {
    console.error("List voices error:", error);
    return NextResponse.json({ voices: [], error: error.message });
  }
}
