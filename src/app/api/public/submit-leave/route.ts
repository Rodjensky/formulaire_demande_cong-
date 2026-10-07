import { NextRequest, NextResponse } from "next/server";
import { submitLeaveRequestSchema } from "@/lib/validation/schemas";
import { createLeaveRequest } from "@/lib/services/leave-requests";
import { verifyTurnstileToken } from "@/lib/security/turnstile";
import { checkRateLimit } from "@/lib/security/rate-limit";

export async function POST(req: NextRequest) {
  try {
    const ip = req.headers.get("x-forwarded-for") || "127.0.0.1";
    const userAgent = req.headers.get("user-agent") || "";

    // 1. Rate Limiting
    const rateLimit = checkRateLimit(`submit_leave:${ip}`, 10, 300); // 10 requests per 5 mins
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { error: "Trop de soumissions. Veuillez patienter quelques minutes avant de réessayer." },
        { status: 429 }
      );
    }

    const body = await req.json();

    // 2. Turnstile Bot Verification
    const isHuman = await verifyTurnstileToken(body.turnstileToken, ip);
    if (!isHuman) {
      return NextResponse.json(
        { error: "Échec de la validation de sécurité anti-robot (Turnstile)" },
        { status: 400 }
      );
    }

    // 3. Schema Validation
    const parseResult = submitLeaveRequestSchema.safeParse(body);
    if (!parseResult.success) {
      const firstIssue = parseResult.error.issues[0];
      const errorMessage = firstIssue?.message || "Veuillez corriger les erreurs dans le formulaire";
      return NextResponse.json(
        {
          error: errorMessage,
          details: parseResult.error.format(),
        },
        { status: 400 }
      );
    }

    // 4. Create Leave Request
    const result = await createLeaveRequest(parseResult.data, { ip, userAgent });

    return NextResponse.json({
      success: true,
      requestNumber: result.leaveRequest.requestNumber,
      accessToken: result.rawAccessToken,
      viewUrl: `/request/${result.rawAccessToken}`,
    });
  } catch (err: any) {
    console.error("Submit leave API error:", err);
    return NextResponse.json(
      { error: err?.message || "Une erreur est survenue lors de la soumission de la demande" },
      { status: 400 }
    );
  }
}
