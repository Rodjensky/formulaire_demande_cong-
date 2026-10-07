import { NextRequest, NextResponse } from "next/server";
import { requireTenantUser, handleApiError } from "@/lib/auth/guard";
import { listLeaveRequests } from "@/lib/services/leave-requests";
import { getTenantDashboardMetrics } from "@/lib/services/audit";

export async function GET(req: NextRequest) {
  try {
    const { organizationId } = await requireTenantUser();

    const { searchParams } = new URL(req.url);
    const mode = searchParams.get("mode");

    // Quick metrics endpoint for dashboard
    if (mode === "metrics") {
      const metrics = await getTenantDashboardMetrics(organizationId);
      return NextResponse.json({ metrics });
    }

    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "10", 10);
    const status = (searchParams.get("status") as any) || "ALL";
    const search = searchParams.get("search") || undefined;

    const result = await listLeaveRequests(organizationId, {
      page,
      limit,
      status,
      search,
    });

    return NextResponse.json(result);
  } catch (err) {
    return handleApiError(err);
  }
}
