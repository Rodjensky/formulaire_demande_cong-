import { getDb } from "@/lib/db/client";
import { auditLogs, notificationLogs, users, leaveRequests } from "@/db/schema";
import { eq, and, desc, sql } from "drizzle-orm";

export async function getAuditLogsForRequest(
  leaveRequestId: string,
  organizationId: string,
  dbInstance?: any
) {
  const db = dbInstance || getDb();

  const logs = await db
    .select({
      id: auditLogs.id,
      action: auditLogs.action,
      oldStatus: auditLogs.oldStatus,
      newStatus: auditLogs.newStatus,
      metadata: auditLogs.metadata,
      createdAt: auditLogs.createdAt,
      userName: users.name,
    })
    .from(auditLogs)
    .leftJoin(users, eq(auditLogs.userId, users.id))
    .where(
      and(
        eq(auditLogs.leaveRequestId, leaveRequestId),
        eq(auditLogs.organizationId, organizationId)
      )
    )
    .orderBy(desc(auditLogs.createdAt));

  const notifs = await db
    .select()
    .from(notificationLogs)
    .where(
      and(
        eq(notificationLogs.leaveRequestId, leaveRequestId),
        eq(notificationLogs.organizationId, organizationId)
      )
    )
    .orderBy(desc(notificationLogs.createdAt));

  return {
    auditLogs: logs,
    notifications: notifs,
  };
}

export async function getTenantDashboardMetrics(organizationId: string, dbInstance?: any) {
  const db = dbInstance || getDb();

  const [totalRes] = await db
    .select({ count: sql<number>`count(*)` })
    .from(leaveRequests)
    .where(eq(leaveRequests.organizationId, organizationId));

  const [pendingRes] = await db
    .select({ count: sql<number>`count(*)` })
    .from(leaveRequests)
    .where(
      and(
        eq(leaveRequests.organizationId, organizationId),
        eq(leaveRequests.status, "PENDING")
      )
    );

  const [approvedRes] = await db
    .select({ count: sql<number>`count(*)` })
    .from(leaveRequests)
    .where(
      and(
        eq(leaveRequests.organizationId, organizationId),
        eq(leaveRequests.status, "APPROVED")
      )
    );

  const [rejectedRes] = await db
    .select({ count: sql<number>`count(*)` })
    .from(leaveRequests)
    .where(
      and(
        eq(leaveRequests.organizationId, organizationId),
        eq(leaveRequests.status, "REJECTED")
      )
    );

  return {
    total: totalRes?.count || 0,
    pending: pendingRes?.count || 0,
    approved: approvedRes?.count || 0,
    rejected: rejectedRes?.count || 0,
  };
}
