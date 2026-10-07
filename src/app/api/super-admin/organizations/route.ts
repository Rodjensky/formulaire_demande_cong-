import { NextRequest, NextResponse } from "next/server";
import { requireSuperAdmin, handleApiError } from "@/lib/auth/guard";
import {
  listAllOrganizationsForSuperAdmin,
  createOrganizationWithAdmin,
} from "@/lib/services/organizations";
import { createOrganizationSchema } from "@/lib/validation/schemas";

export async function GET() {
  try {
    await requireSuperAdmin();
    const orgs = await listAllOrganizationsForSuperAdmin();
    return NextResponse.json({ organizations: orgs });
  } catch (err) {
    return handleApiError(err);
  }
}

export async function POST(req: NextRequest) {
  try {
    await requireSuperAdmin();
    const body = await req.json();

    const parseResult = createOrganizationSchema.safeParse(body);
    if (!parseResult.success) {
      return NextResponse.json(
        {
          error: "Données de l'organisation invalides",
          details: parseResult.error.format(),
        },
        { status: 400 }
      );
    }

    const { organization, adminUser } = await createOrganizationWithAdmin(parseResult.data);
    return NextResponse.json({
      success: true,
      organization,
      adminUser: {
        id: adminUser.id,
        name: adminUser.name,
        email: adminUser.email,
        role: adminUser.role,
      },
    });
  } catch (err: any) {
    if (err?.message?.includes("existe déjà")) {
      return NextResponse.json({ error: err.message }, { status: 409 });
    }
    return handleApiError(err);
  }
}
