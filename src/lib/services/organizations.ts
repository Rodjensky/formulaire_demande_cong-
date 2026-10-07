import { getDb } from "@/lib/db/client";
import { organizations, users, leaveRequests, Organization, User } from "@/db/schema";
import { eq, desc, sql, and } from "drizzle-orm";
import { CreateOrganizationInput } from "@/lib/validation/schemas";
import { hashPassword } from "@/lib/auth/password";

export async function listActiveOrganizations(dbInstance?: any) {
  const db = dbInstance || getDb();
  return await db
    .select({
      id: organizations.id,
      name: organizations.name,
      slug: organizations.slug,
      logoUrl: organizations.logoUrl,
    })
    .from(organizations)
    .where(eq(organizations.status, "ACTIVE"))
    .orderBy(organizations.name);
}

export async function listAllOrganizationsForSuperAdmin(dbInstance?: any) {
  const db = dbInstance || getDb();
  const orgs = await db.select().from(organizations).orderBy(desc(organizations.createdAt));

  // Augment with request counts
  const results = await Promise.all(
    orgs.map(async (org: Organization) => {
      const [reqCount] = await db
        .select({ count: sql<number>`count(*)` })
        .from(leaveRequests)
        .where(eq(leaveRequests.organizationId, org.id));

      const [pendingCount] = await db
        .select({ count: sql<number>`count(*)` })
        .from(leaveRequests)
        .where(
          and(
            eq(leaveRequests.organizationId, org.id),
            eq(leaveRequests.status, "PENDING")
          )
        );

      return {
        ...org,
        requestCount: reqCount?.count || 0,
        pendingCount: pendingCount?.count || 0,
      };
    })
  );

  return results;
}

export async function getSuperAdminPlatformStats(dbInstance?: any) {
  const db = dbInstance || getDb();

  const [totalOrgsRes] = await db.select({ count: sql<number>`count(*)` }).from(organizations);
  const [activeOrgsRes] = await db
    .select({ count: sql<number>`count(*)` })
    .from(organizations)
    .where(eq(organizations.status, "ACTIVE"));
  const [disabledOrgsRes] = await db
    .select({ count: sql<number>`count(*)` })
    .from(organizations)
    .where(eq(organizations.status, "DISABLED"));
  const [approvedRequestsRes] = await db
    .select({ count: sql<number>`count(*)` })
    .from(leaveRequests)
    .where(eq(leaveRequests.status, "APPROVED"));
  const [totalRequestsRes] = await db.select({ count: sql<number>`count(*)` }).from(leaveRequests);

  const recentRequests = await db
    .select({
      id: leaveRequests.id,
      requestNumber: leaveRequests.requestNumber,
      status: leaveRequests.status,
      submittedAt: leaveRequests.submittedAt,
      organizationName: organizations.name,
    })
    .from(leaveRequests)
    .innerJoin(organizations, eq(leaveRequests.organizationId, organizations.id))
    .orderBy(desc(leaveRequests.submittedAt))
    .limit(5);

  return {
    totalOrganizations: totalOrgsRes?.count || 0,
    activeOrganizations: activeOrgsRes?.count || 0,
    disabledOrganizations: disabledOrgsRes?.count || 0,
    approvedRequests: approvedRequestsRes?.count || 0,
    totalRequests: totalRequestsRes?.count || 0,
    recentRequests,
  };
}

export async function createOrganizationWithAdmin(
  input: CreateOrganizationInput,
  dbInstance?: any
): Promise<{ organization: Organization; adminUser: User }> {
  const db = dbInstance || getDb();
  const now = Date.now();

  // Check unique slug
  const [existingSlug] = await db
    .select()
    .from(organizations)
    .where(eq(organizations.slug, input.slug))
    .limit(1);

  if (existingSlug) {
    throw new Error("Une entreprise avec ce slug existe déjà");
  }

  // Check unique email for user
  const [existingUser] = await db
    .select()
    .from(users)
    .where(eq(users.email, input.adminEmail.toLowerCase()))
    .limit(1);

  if (existingUser) {
    throw new Error("Un utilisateur avec cette adresse email existe déjà");
  }

  const orgId = `org-${crypto.randomUUID()}`;
  const userId = `usr-${crypto.randomUUID()}`;
  const passwordHash = await hashPassword(input.adminPassword);

  await db.insert(organizations).values({
    id: orgId,
    name: input.name,
    slug: input.slug.toLowerCase(),
    logoUrl: input.logoUrl || null,
    email: input.email || null,
    phone: input.phone || null,
    address: input.address || null,
    status: "ACTIVE",
    createdAt: now,
    updatedAt: now,
  });

  await db.insert(users).values({
    id: userId,
    organizationId: orgId,
    name: input.adminName,
    email: input.adminEmail.toLowerCase(),
    passwordHash,
    role: "ORGANIZATION_ADMIN",
    status: "ACTIVE",
    createdAt: now,
    updatedAt: now,
  });

  const [organization] = await db.select().from(organizations).where(eq(organizations.id, orgId));
  const [adminUser] = await db.select().from(users).where(eq(users.id, userId));

  return { organization, adminUser };
}

export async function updateOrganizationStatus(
  id: string,
  status: "ACTIVE" | "DISABLED",
  dbInstance?: any
) {
  const db = dbInstance || getDb();
  await db
    .update(organizations)
    .set({ status, updatedAt: Date.now() })
    .where(eq(organizations.id, id));
}
