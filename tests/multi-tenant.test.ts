import { describe, it, expect, beforeEach } from "vitest";
import { createTestDb } from "../src/lib/db/client";
import { runMigrations } from "../scripts/migrate";
import {
  createLeaveRequest,
  getLeaveRequestById,
  approveLeaveRequest,
  rejectLeaveRequest,
  getLeaveRequestByToken,
} from "../src/lib/services/leave-requests";
import { organizations, users } from "../src/db/schema";
import { hashPassword } from "../src/lib/auth/password";

describe("Multi-Tenant Isolation Test Suite", () => {
  let db: any;

  beforeEach(async () => {
    db = createTestDb(":memory:");
    await runMigrations(db);

    const now = Date.now();

    // Create Organization A (Technozi)
    await db.insert(organizations).values({
      id: "org-technozi",
      name: "Technozi",
      slug: "technozi",
      status: "ACTIVE",
      createdAt: now,
      updatedAt: now,
    });

    // Create Organization B (Welj)
    await db.insert(organizations).values({
      id: "org-welj",
      name: "Welj Express",
      slug: "welj",
      status: "ACTIVE",
      createdAt: now,
      updatedAt: now,
    });

    // Create Users
    const pwd = await hashPassword("Secret123!");
    await db.insert(users).values([
      {
        id: "usr-technozi-sec",
        organizationId: "org-technozi",
        name: "Technozi Secretary",
        email: "sec@technozi.local",
        passwordHash: pwd,
        role: "SECRETARY",
        status: "ACTIVE",
        createdAt: now,
        updatedAt: now,
      },
      {
        id: "usr-welj-sec",
        organizationId: "org-welj",
        name: "Welj Secretary",
        email: "sec@welj.local",
        passwordHash: pwd,
        role: "SECRETARY",
        status: "ACTIVE",
        createdAt: now,
        updatedAt: now,
      },
    ]);
  });

  it("Tenant A can create and view its own leave requests", async () => {
    const result = await createLeaveRequest(
      {
        organizationId: "org-technozi",
        firstName: "Jean",
        lastName: "Dupont",
        employeeNumber: "EMP-001",
        department: "IT",
        position: "Dev",
        leaveType: "ANNUAL",
        startDate: "2026-10-10",
        endDate: "2026-10-15",
        requestedDays: 6,
        contactPhone: "+22507000000",
      },
      undefined,
      db
    );

    expect(result.leaveRequest.id).toBeDefined();
    expect(result.leaveRequest.organizationId).toBe("org-technozi");

    // Tenant A queries request by ID -> SUCCESS
    const fetched = await getLeaveRequestById(result.leaveRequest.id, "org-technozi", db);
    expect(fetched).not.toBeNull();
    expect(fetched?.firstName).toBe("Jean");
  });

  it("CRITICAL: Tenant B CANNOT access Tenant A leave requests by ID", async () => {
    // 1. Create request in Tenant A
    const reqA = await createLeaveRequest(
      {
        organizationId: "org-technozi",
        firstName: "Secret",
        lastName: "Employee",
        employeeNumber: "EMP-001",
        department: "IT",
        position: "Dev",
        leaveType: "ANNUAL",
        startDate: "2026-10-10",
        endDate: "2026-10-15",
        requestedDays: 6,
        contactPhone: "+22507000000",
      },
      undefined,
      db
    );

    // 2. User from Tenant B attempts to access it -> Returns NULL / Access Denied
    const attempt = await getLeaveRequestById(reqA.leaveRequest.id, "org-welj", db);
    expect(attempt).toBeNull();
  });

  it("CRITICAL: Tenant B CANNOT approve or reject Tenant A leave requests", async () => {
    // 1. Create request in Tenant A
    const reqA = await createLeaveRequest(
      {
        organizationId: "org-technozi",
        firstName: "Jean",
        lastName: "Dupont",
        employeeNumber: "EMP-001",
        department: "IT",
        position: "Dev",
        leaveType: "ANNUAL",
        startDate: "2026-10-10",
        endDate: "2026-10-15",
        requestedDays: 6,
        contactPhone: "+22507000000",
      },
      undefined,
      db
    );

    // 2. Welj user tries to approve Technozi request -> Must Throw Error
    await expect(
      approveLeaveRequest(reqA.leaveRequest.id, "org-welj", "usr-welj-sec", undefined, db)
    ).rejects.toThrow("La demande n'est plus en attente ou n'a pas été trouvée");

    // 3. Welj user tries to reject Technozi request -> Must Throw Error
    await expect(
      rejectLeaveRequest(
        reqA.leaveRequest.id,
        "org-welj",
        "usr-welj-sec",
        "Refus non autorisé",
        undefined,
        db
      )
    ).rejects.toThrow("La demande n'est plus en attente ou n'a pas été trouvée");

    // Verify request in Tenant A is still PENDING
    const checkStatus = await getLeaveRequestById(reqA.leaveRequest.id, "org-technozi", db);
    expect(checkStatus?.status).toBe("PENDING");
  });

  it("Employee token strictly retrieves only its own request and no other", async () => {
    const req1 = await createLeaveRequest(
      {
        organizationId: "org-technozi",
        firstName: "Jean",
        lastName: "Dupont",
        employeeNumber: "EMP-001",
        department: "IT",
        position: "Dev",
        leaveType: "ANNUAL",
        startDate: "2026-10-10",
        endDate: "2026-10-15",
        requestedDays: 6,
        contactPhone: "+22507000000",
      },
      undefined,
      db
    );

    const req2 = await createLeaveRequest(
      {
        organizationId: "org-welj",
        firstName: "Fatou",
        lastName: "Kouadio",
        employeeNumber: "EMP-002",
        department: "HR",
        position: "HR Manager",
        leaveType: "SICK",
        startDate: "2026-10-20",
        endDate: "2026-10-22",
        requestedDays: 3,
        contactPhone: "+22507000001",
      },
      undefined,
      db
    );

    // Look up with token 1 returns req1 only
    const found1 = await getLeaveRequestByToken(req1.rawAccessToken, db);
    expect(found1).not.toBeNull();
    expect(found1?.firstName).toBe("Jean");
    expect(found1?.requestNumber).toBe(req1.leaveRequest.requestNumber);

    // Look up with token hash (used in WhatsApp links) also works
    const foundByHash = await getLeaveRequestByToken(req1.leaveRequest.employeeAccessTokenHash, db);
    expect(foundByHash).not.toBeNull();
    expect(foundByHash?.requestNumber).toBe(req1.leaveRequest.requestNumber);

    // Look up with invalid or tampered token returns null
    const invalidFound = await getLeaveRequestByToken("tampered-token-1234567890", db);
    expect(invalidFound).toBeNull();
  });
});
