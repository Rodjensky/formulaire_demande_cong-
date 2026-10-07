import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db/client";
import { users, organizations } from "@/db/schema";
import { eq } from "drizzle-orm";
import { verifyPassword } from "@/lib/auth/password";
import { setSessionCookie } from "@/lib/auth/session";
import { loginSchema } from "@/lib/validation/schemas";
import { checkRateLimit } from "@/lib/security/rate-limit";

export async function POST(req: NextRequest) {
  try {
    const ip = req.headers.get("x-forwarded-for") || "127.0.0.1";
    const rateLimit = checkRateLimit(`login:${ip}`, 10, 60);
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { error: "Trop de tentatives. Veuillez patienter une minute." },
        { status: 429 }
      );
    }

    const body = await req.json();
    const parseResult = loginSchema.safeParse(body);
    if (!parseResult.success) {
      return NextResponse.json(
        { error: "Données de connexion invalides", details: parseResult.error.format() },
        { status: 400 }
      );
    }

    const { email, password } = parseResult.data;
    const db = getDb();

    // 1. Find user by email
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.email, email.toLowerCase()))
      .limit(1);

    if (!user || user.status !== "ACTIVE") {
      return NextResponse.json(
        { error: "Identifiants invalides ou compte désactivé" },
        { status: 401 }
      );
    }

    // 2. If organization user, check organization is active
    let organizationName: string | undefined;
    let organizationSlug: string | undefined;

    if (user.organizationId) {
      const [org] = await db
        .select()
        .from(organizations)
        .where(eq(organizations.id, user.organizationId))
        .limit(1);

      if (!org || org.status !== "ACTIVE") {
        return NextResponse.json(
          { error: "L'organisation associée à ce compte est désactivée" },
          { status: 403 }
        );
      }
      organizationName = org.name;
      organizationSlug = org.slug;
    }

    // 3. Verify password hash
    const isValid = await verifyPassword(password, user.passwordHash);
    if (!isValid) {
      return NextResponse.json(
        { error: "Identifiants invalides" },
        { status: 401 }
      );
    }

    // 4. Set session cookie
    await setSessionCookie({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      organizationId: user.organizationId,
      organizationName,
      organizationSlug,
    });

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        organizationId: user.organizationId,
        organizationName,
      },
    });
  } catch (err: any) {
    console.error("Login API error:", err);
    return NextResponse.json(
      { error: "Une erreur est survenue lors de la connexion" },
      { status: 500 }
    );
  }
}
