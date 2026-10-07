import { NextRequest, NextResponse } from "next/server";
import { requireTenantUser, handleApiError } from "@/lib/auth/guard";
import { getLeaveRequestById } from "@/lib/services/leave-requests";
import { notifyEmployeeDecision } from "@/lib/notifications/service";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { organizationId } = await requireTenantUser();
    const { id } = await params;

    const request = await getLeaveRequestById(id, organizationId);
    if (!request) {
      return NextResponse.json({ error: "Demande introuvable" }, { status: 404 });
    }

    if (request.status !== "APPROVED" && request.status !== "REJECTED") {
      return NextResponse.json(
        { error: "Seules les demandes décidées peuvent recevoir une notification de statut" },
        { status: 400 }
      );
    }

    const notifResult = await notifyEmployeeDecision(
      request.id,
      request.employeeAccessTokenHash
    );

    return NextResponse.json({
      success: true,
      result: notifResult,
    });
  } catch (err) {
    return handleApiError(err);
  }
}
