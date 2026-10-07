import { NextRequest, NextResponse } from "next/server";
import { requireSuperAdmin, handleApiError } from "@/lib/auth/guard";
import { updateOrganizationStatus } from "@/lib/services/organizations";
import { z } from "zod";

const updateStatusSchema = z.object({
  status: z.enum(["ACTIVE", "DISABLED"]),
});

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireSuperAdmin();
    const { id } = await params;

    const body = await req.json();
    const parseResult = updateStatusSchema.safeParse(body);
    if (!parseResult.success) {
      return NextResponse.json({ error: "Statut invalide" }, { status: 400 });
    }

    await updateOrganizationStatus(id, parseResult.data.status);
    return NextResponse.json({ success: true, status: parseResult.data.status });
  } catch (err) {
    return handleApiError(err);
  }
}
