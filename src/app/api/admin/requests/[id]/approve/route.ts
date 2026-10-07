import { NextRequest, NextResponse } from "next/server";
import { requireTenantUser, handleApiError } from "@/lib/auth/guard";
import { approveLeaveRequest } from "@/lib/services/leave-requests";
import { approveLeaveRequestSchema } from "@/lib/validation/schemas";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { user, organizationId } = await requireTenantUser();
    const { id } = await params;

    const body = await req.json().catch(() => ({}));
    const parseResult = approveLeaveRequestSchema.safeParse(body);
    const comment = parseResult.success ? parseResult.data.decisionComment : undefined;

    const result = await approveLeaveRequest(id, organizationId, user.id, comment);

    return NextResponse.json({
      success: true,
      leaveRequest: result.leaveRequest,
    });
  } catch (err: any) {
    if (err?.message?.includes("n'est plus en attente")) {
      return NextResponse.json({ error: err.message }, { status: 409 });
    }
    return handleApiError(err);
  }
}
