import { NextResponse } from "next/server";
import { listActiveOrganizations } from "@/lib/services/organizations";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  try {
    const orgs = await listActiveOrganizations();
    return NextResponse.json({
      success: true,
      organizations: orgs,
      count: orgs.length,
    });
  } catch (err: any) {
    console.error("Error listing public organizations:", err);
    return NextResponse.json(
      {
        success: false,
        error: err?.message || "Impossible de charger les organisations",
        organizations: [],
      },
      { status: 500 }
    );
  }
}
