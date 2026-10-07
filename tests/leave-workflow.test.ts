import { describe, it, expect, beforeEach } from "vitest";
import { createTestDb } from "../src/lib/db/client";
import { runMigrations } from "../scripts/migrate";
import {
  createLeaveRequest,
  getLeaveRequestById,
  approveLeaveRequest,
  rejectLeaveRequest,
} from "../src/lib/services/leave-requests";
import { organizations, users, employees, auditLogs } from "../src/db/schema";
import { eq } from "drizzle-orm";
import { hashPassword } from "../src/lib/auth/password";

describe("Leave Request Lifecycle & Workflow Tests", () => {
  let db: any;
  const orgId = "org-test-workflow";

  beforeEach(async () => {
    db = createTestDb(":memory:");
    await runMigrations(db);

    const now = Date.now();
    await db.insert(organizations).values({
      id: orgId,
      name: "Test Workflow Org",
      slug: "test-org",
      status: "ACTIVE",
      createdAt: now,
      updatedAt: now,
    });

    const pwd = await hashPassword("Test1234!");
    await db.insert(users).values({
      id: "usr-sec",
      organizationId: orgId,
      name: "Secretary User",
      email: "sec@test.local",
      passwordHash: pwd,
      role: "SECRETARY",
      status: "ACTIVE",
      createdAt: now,
      updatedAt: now,
    });
  });

  it("Generates structured CONG-YYYY-XXXX request numbers sequentially", async () => {
    const res1 = await createLeaveRequest(
      {
        organizationId: orgId,
        firstName: "Alice",
        lastName: "Smith",
        employeeNumber: "EMP-100",
        department: "Sales",
        position: "Rep",
        leaveType: "ANNUAL",
        startDate: "2026-10-10",
        endDate: "2026-10-12",
        requestedDays: 3,
        contactPhone: "+22501020304",
      },
      undefined,
      db
    );

    const res2 = await createLeaveRequest(
      {
        organizationId: orgId,
        firstName: "Bob",
        lastName: "Taylor",
        employeeNumber: "EMP-101",
        department: "Engineering",
        position: "Dev",
        leaveType: "SICK",
        startDate: "2026-10-14",
        endDate: "2026-10-16",
        requestedDays: 3,
        contactPhone: "+22501020305",
      },
      undefined,
      db
    );

    const currentYear = new Date().getFullYear();
    expect(res1.leaveRequest.requestNumber).toBe(`CONG-${currentYear}-0001`);
    expect(res2.leaveRequest.requestNumber).toBe(`CONG-${currentYear}-0002`);
  });

  it("Preserves employee snapshot even if employee directory record changes later", async () => {
    // 1. Create employee in directory
    await db.insert(employees).values({
      id: "emp-alice",
      organizationId: orgId,
      employeeNumber: "EMP-100",
      firstName: "Alice",
      lastName: "Smith",
      department: "Marketing Junior",
      position: "Junior Assistant",
      phone: "+22501020304",
      status: "ACTIVE",
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    // 2. Submit request
    const req = await createLeaveRequest(
      {
        organizationId: orgId,
        firstName: "Alice",
        lastName: "Smith",
        employeeNumber: "EMP-100",
        department: "Marketing Junior",
        position: "Junior Assistant",
        leaveType: "ANNUAL",
        startDate: "2026-10-10",
        endDate: "2026-10-12",
        requestedDays: 3,
        contactPhone: "+22501020304",
      },
      undefined,
      db
    );

    // 3. Promote employee later in the directory
    await db
      .update(employees)
      .set({
        department: "Marketing Executive",
        position: "Chief Marketing Officer",
      })
      .where(eq(employees.id, "emp-alice"));

    // 4. Verify original request snapshot remains unmutated
    const fetchedReq = await getLeaveRequestById(req.leaveRequest.id, orgId, db);
    expect(fetchedReq?.department).toBe("Marketing Junior");
    expect(fetchedReq?.position).toBe("Junior Assistant");
  });

  it("Performs atomic approval and transitions status to APPROVED", async () => {
    const req = await createLeaveRequest(
      {
        organizationId: orgId,
        firstName: "Alice",
        lastName: "Smith",
        employeeNumber: "EMP-100",
        department: "Sales",
        position: "Rep",
        leaveType: "ANNUAL",
        startDate: "2026-10-10",
        endDate: "2026-10-12",
        requestedDays: 3,
        contactPhone: "+22501020304",
      },
      undefined,
      db
    );

    const approveRes = await approveLeaveRequest(
      req.leaveRequest.id,
      orgId,
      "usr-sec",
      "Accordé sans réserve",
      db
    );

    expect(approveRes.success).toBe(true);
    expect(approveRes.leaveRequest.status).toBe("APPROVED");
    expect(approveRes.leaveRequest.decisionComment).toBe("Accordé sans réserve");
    expect(approveRes.leaveRequest.decidedBy).toBe("usr-sec");

    // Verify Audit Log
    const logs = await db
      .select()
      .from(auditLogs)
      .where(eq(auditLogs.leaveRequestId, req.leaveRequest.id));
    expect(logs.some((l: any) => l.action === "APPROVED")).toBe(true);
  });

  it("Refusal requires a mandatory rejection reason", async () => {
    const req = await createLeaveRequest(
      {
        organizationId: orgId,
        firstName: "Alice",
        lastName: "Smith",
        employeeNumber: "EMP-100",
        department: "Sales",
        position: "Rep",
        leaveType: "ANNUAL",
        startDate: "2026-10-10",
        endDate: "2026-10-12",
        requestedDays: 3,
        contactPhone: "+22501020304",
      },
      undefined,
      db
    );

    // Rejection without reason throws
    await expect(
      rejectLeaveRequest(req.leaveRequest.id, orgId, "usr-sec", "", undefined, db)
    ).rejects.toThrow("La raison du refus est obligatoire");

    // Rejection with valid reason succeeds
    const rejectRes = await rejectLeaveRequest(
      req.leaveRequest.id,
      orgId,
      "usr-sec",
      "Période de pic d'activité",
      "Voir avec le manager",
      db
    );

    expect(rejectRes.success).toBe(true);
    expect(rejectRes.leaveRequest.status).toBe("REJECTED");
    expect(rejectRes.leaveRequest.rejectionReason).toBe("Période de pic d'activité");
  });

  it("CRITICAL: Prevents double decisions (approved cannot be rejected, rejected cannot be approved)", async () => {
    const req = await createLeaveRequest(
      {
        organizationId: orgId,
        firstName: "Alice",
        lastName: "Smith",
        employeeNumber: "EMP-100",
        department: "Sales",
        position: "Rep",
        leaveType: "ANNUAL",
        startDate: "2026-10-10",
        endDate: "2026-10-12",
        requestedDays: 3,
        contactPhone: "+22501020304",
      },
      undefined,
      db
    );

    // 1. Approve once
    await approveLeaveRequest(req.leaveRequest.id, orgId, "usr-sec", undefined, db);

    // 2. Second approval must fail atomically
    await expect(
      approveLeaveRequest(req.leaveRequest.id, orgId, "usr-sec", undefined, db)
    ).rejects.toThrow("La demande n'est plus en attente ou n'a pas été trouvée");

    // 3. Reject on approved request must fail atomically
    await expect(
      rejectLeaveRequest(req.leaveRequest.id, orgId, "usr-sec", "Changement d'avis", undefined, db)
    ).rejects.toThrow("La demande n'est plus en attente ou n'a pas été trouvée");
  });
});
