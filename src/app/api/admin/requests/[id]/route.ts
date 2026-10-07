import { NextRequest, NextResponse } from "next/server";
import { requireTenantUser, handleApiError } from "@/lib/auth/guard";
import { getLeaveRequestById } from "@/lib/services/leave-requests";
import { getAuditLogsForRequest } from "@/lib/services/audit";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { organizationId } = await requireTenantUser();
    const { id } = await params;

    const request = await getLeaveRequestById(id, organizationId);
    if (!request) {
      return NextResponse.json({ error: "Demande de congé introuvable" }, { status: 404 });
    }

    const { auditLogs, notifications } = await getAuditLogsForRequest(id, organizationId);

    return NextResponse.json({
      request,
      auditLogs,
      notifications,
    });
  } catch (err) {
    return handleApiError(err);
  }
}
