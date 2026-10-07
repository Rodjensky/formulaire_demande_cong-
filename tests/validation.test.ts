import { describe, it, expect } from "vitest";
import {
  submitLeaveRequestSchema,
  createOrganizationSchema,
  loginSchema,
  rejectLeaveRequestSchema,
} from "../src/lib/validation/schemas";

describe("Zod Validation Schemas Test Suite", () => {
  it("Validates successful leave request input", () => {
    const valid = {
      organizationId: "org-1",
      firstName: "Jean",
      lastName: "Dupont",
      employeeNumber: "EMP-042",
      department: "Informatique",
      position: "Ingénieur",
      leaveType: "ANNUAL",
      startDate: "2026-10-10",
      endDate: "2026-10-15",
      requestedDays: 6,
      contactPhone: "+225 0700000000",
      contactEmail: "jean@example.com",
    };

    const res = submitLeaveRequestSchema.safeParse(valid);
    expect(res.success).toBe(true);
  });

  it("Rejects leave request when endDate is before startDate", () => {
    const invalid = {
      organizationId: "org-1",
      firstName: "Jean",
      lastName: "Dupont",
      employeeNumber: "EMP-042",
      department: "Informatique",
      position: "Ingénieur",
      leaveType: "ANNUAL",
      startDate: "2026-10-15",
      endDate: "2026-10-10", // Invalid!
      requestedDays: 1,
      contactPhone: "+225 0700000000",
    };

    const res = submitLeaveRequestSchema.safeParse(invalid);
    expect(res.success).toBe(false);
  });

  it("Requires leaveTypeOther when leaveType is OTHER", () => {
    const missingOther = {
      organizationId: "org-1",
      firstName: "Jean",
      lastName: "Dupont",
      employeeNumber: "EMP-042",
      department: "Informatique",
      position: "Ingénieur",
      leaveType: "OTHER",
      leaveTypeOther: "", // Empty!
      startDate: "2026-10-10",
      endDate: "2026-10-15",
      requestedDays: 6,
      contactPhone: "+225 0700000000",
    };

    const res = submitLeaveRequestSchema.safeParse(missingOther);
    expect(res.success).toBe(false);

    const withOther = {
      ...missingOther,
      leaveTypeOther: "Formation professionnelle",
    };
    expect(submitLeaveRequestSchema.safeParse(withOther).success).toBe(true);
  });

  it("Validates rejection requires reason with minimum length", () => {
    expect(rejectLeaveRequestSchema.safeParse({ rejectionReason: "" }).success).toBe(false);
    expect(rejectLeaveRequestSchema.safeParse({ rejectionReason: "No" }).success).toBe(false);
    expect(
      rejectLeaveRequestSchema.safeParse({
        rejectionReason: "Effectif insuffisant sur la période demandée",
      }).success
    ).toBe(true);
  });

  it("Validates organization creation and slug formatting", () => {
    const valid = {
      name: "Entreprise Alpha",
      slug: "entreprise-alpha",
      adminName: "Admin User",
      adminEmail: "admin@alpha.com",
      adminPassword: "Password123!",
    };

    expect(createOrganizationSchema.safeParse(valid).success).toBe(true);

    const invalidSlug = {
      ...valid,
      slug: "ENTREPRISE ALPHA!!", // Spaces and uppercase not allowed
    };
    expect(createOrganizationSchema.safeParse(invalidSlug).success).toBe(false);
  });
});
