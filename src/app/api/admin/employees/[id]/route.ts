import { NextRequest, NextResponse } from "next/server";
import { requireOrgAdmin, handleApiError } from "@/lib/auth/guard";
import { updateEmployee } from "@/lib/services/employees";
import { employeeSchema } from "@/lib/validation/schemas";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { organizationId } = await requireOrgAdmin();
    const { id } = await params;

    const body = await req.json();
    const parseResult = employeeSchema.partial().safeParse(body);
    if (!parseResult.success) {
      return NextResponse.json(
        { error: "Données invalides", details: parseResult.error.format() },
        { status: 400 }
      );
    }

    const updated = await updateEmployee(organizationId, id, parseResult.data);
    return NextResponse.json({ success: true, employee: updated });
  } catch (err: any) {
    return handleApiError(err);
  }
}
