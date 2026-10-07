import { NextResponse } from "next/server";
import { listActiveOrganizations } from "@/lib/services/organizations";

export async function GET() {
  try {
    const orgs = await listActiveOrganizations();
    return NextResponse.json({ organizations: orgs });
  } catch (err) {
    console.error("Error listing public organizations:", err);
    return NextResponse.json({ error: "Impossible de charger les organisations" }, { status: 500 });
  }
}
