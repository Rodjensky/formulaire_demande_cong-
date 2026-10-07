import { NextRequest, NextResponse } from "next/server";
import { getLeaveRequestByToken } from "@/lib/services/leave-requests";
import { checkRateLimit } from "@/lib/security/rate-limit";

export async function GET(req: NextRequest) {
  try {
    const ip = req.headers.get("x-forwarded-for") || "127.0.0.1";
    const rateLimit = checkRateLimit(`check_status:${ip}`, 30, 60);
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { error: "Trop de requêtes. Veuillez patienter." },
        { status: 429 }
      );
    }

    const { searchParams } = new URL(req.url);
    const token = searchParams.get("token");

    if (!token || token.length < 16) {
      return NextResponse.json(
        { error: "Cette demande n'est pas disponible ou le lien est invalide." },
        { status: 404 }
      );
    }

    const request = await getLeaveRequestByToken(token);
    if (!request) {
      return NextResponse.json(
        { error: "Cette demande n'est pas disponible ou le lien est invalide." },
        { status: 404 }
      );
    }

    return NextResponse.json({ request });
  } catch (err) {
    console.error("Request status API error:", err);
    return NextResponse.json(
      { error: "Cette demande n'est pas disponible ou le lien est invalide." },
      { status: 500 }
    );
  }
}
