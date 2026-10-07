import { NextResponse } from "next/server";
import { requireSuperAdmin, handleApiError } from "@/lib/auth/guard";
import { getSuperAdminPlatformStats } from "@/lib/services/organizations";

export async function GET() {
  try {
    await requireSuperAdmin();
    const stats = await getSuperAdminPlatformStats();
    return NextResponse.json({ stats });
  } catch (err) {
    return handleApiError(err);
  }
}
