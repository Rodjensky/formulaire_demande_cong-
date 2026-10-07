import { NextRequest, NextResponse } from "next/server";
import { requireOrgAdmin, requireTenantUser, handleApiError } from "@/lib/auth/guard";
import { listEmployees, createEmployee } from "@/lib/services/employees";
import { employeeSchema } from "@/lib/validation/schemas";

export async function GET(req: NextRequest) {
  try {
    const { organizationId } = await requireTenantUser();
    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search") || undefined;

    const employeesList = await listEmployees(organizationId, search);
    return NextResponse.json({ employees: employeesList });
  } catch (err) {
    return handleApiError(err);
  }
}

export async function POST(req: NextRequest) {
  try {
    const { organizationId } = await requireOrgAdmin();
    const body = await req.json();

    const parseResult = employeeSchema.safeParse(body);
    if (!parseResult.success) {
      return NextResponse.json(
        { error: "Données de l'employé invalides", details: parseResult.error.format() },
        { status: 400 }
      );
    }

    const employee = await createEmployee(organizationId, parseResult.data);
    return NextResponse.json({ success: true, employee });
  } catch (err: any) {
    if (err?.message?.includes("existe déjà")) {
      return NextResponse.json({ error: err.message }, { status: 409 });
    }
    return handleApiError(err);
  }
}
