import { getDb } from "@/lib/db/client";
import { notificationLogs, auditLogs, leaveRequests, organizations } from "@/db/schema";
import { eq } from "drizzle-orm";
import {
  sendEmail,
  generateNewRequestSecretaryEmail,
  generateDecisionEmployeeEmail,
} from "./email";
import {
  sendWhatsAppMessage,
  buildWhatsAppApprovalMessage,
  buildWhatsAppRejectionMessage,
} from "./whatsapp";

function getAppUrl(): string {
  return process.env.APP_URL || "http://localhost:3000";
}

/**
 * Sends notification to organization secretary / admin when a new leave request is created.
 */
export async function notifySecretaryNewRequest(
  leaveRequestId: string,
  rawToken: string,
  dbInstance?: any
): Promise<void> {
  const db = dbInstance || getDb();
  const [request] = await db
    .select()
    .from(leaveRequests)
    .where(eq(leaveRequests.id, leaveRequestId))
    .limit(1);

  if (!request) return;

  const [org] = await db
    .select()
    .from(organizations)
    .where(eq(organizations.id, request.organizationId))
    .limit(1);

  const secretaryEmail = org?.email || process.env.SECRETARY_EMAIL || "secretary@example.com";
  const appUrl = getAppUrl();
  const reviewUrl = `${appUrl}/admin/requests/${request.id}`;

  const { subject, html } = generateNewRequestSecretaryEmail({
    requestNumber: request.requestNumber,
    employeeName: `${request.firstName} ${request.lastName}`,
    department: request.department,
    leaveType: request.leaveType === "OTHER" ? `Autre (${request.leaveTypeOther})` : request.leaveType,
    startDate: request.startDate,
    endDate: request.endDate,
    requestedDays: request.requestedDays,
    submittedAt: new Date(request.submittedAt).toLocaleString("fr-FR"),
    reviewUrl,
  });

  const emailRes = await sendEmail({
    to: secretaryEmail,
    subject,
    html,
  });

  const now = Date.now();
  await db.insert(notificationLogs).values({
    id: `notif-${crypto.randomUUID()}`,
    organizationId: request.organizationId,
    leaveRequestId: request.id,
    channel: "EMAIL",
    recipient: secretaryEmail,
    notificationType: "NEW_REQUEST",
    status: emailRes.success ? "SENT" : "FAILED",
    providerMessageId: emailRes.id || null,
    errorMessage: emailRes.error || null,
    sentAt: emailRes.success ? now : null,
    createdAt: now,
  });

  if (!emailRes.success) {
    await db.insert(auditLogs).values({
      id: `audit-${crypto.randomUUID()}`,
      organizationId: request.organizationId,
      userId: "SYSTEM",
      leaveRequestId: request.id,
      action: "NOTIFICATION_FAILED",
      oldStatus: request.status,
      newStatus: request.status,
      metadata: JSON.stringify({ channel: "EMAIL", error: emailRes.error }),
      createdAt: now,
    });
  }
}

/**
 * Sends notifications to employee upon decision (WhatsApp & Email if available).
 */
export async function notifyEmployeeDecision(
  leaveRequestId: string,
  rawTokenOrUrl: string,
  dbInstance?: any
): Promise<{ whatsappSent: boolean; emailSent: boolean }> {
  const db = dbInstance || getDb();
  const [request] = await db
    .select()
    .from(leaveRequests)
    .where(eq(leaveRequests.id, leaveRequestId))
    .limit(1);

  if (!request || (request.status !== "APPROVED" && request.status !== "REJECTED")) {
    return { whatsappSent: false, emailSent: false };
  }

  const appUrl = getAppUrl();
  const viewUrl = rawTokenOrUrl.startsWith("http")
    ? rawTokenOrUrl
    : `${appUrl}/request/${rawTokenOrUrl}`;

  let whatsappSent = false;
  let emailSent = false;
  const now = Date.now();

  // 1. Send WhatsApp message
  if (request.contactPhone) {
    const waBody =
      request.status === "APPROVED"
        ? buildWhatsAppApprovalMessage({
            employeeFirstName: request.firstName,
            requestNumber: request.requestNumber,
            startDate: request.startDate,
            endDate: request.endDate,
            viewUrl,
          })
        : buildWhatsAppRejectionMessage({
            employeeFirstName: request.firstName,
            requestNumber: request.requestNumber,
            rejectionReason: request.rejectionReason || "Non précisé",
            viewUrl,
          });

    const waRes = await sendWhatsAppMessage({
      toPhone: request.contactPhone,
      messageText: waBody,
    });

    whatsappSent = waRes.success;

    await db.insert(notificationLogs).values({
      id: `notif-${crypto.randomUUID()}`,
      organizationId: request.organizationId,
      leaveRequestId: request.id,
      channel: "WHATSAPP",
      recipient: request.contactPhone,
      notificationType: request.status === "APPROVED" ? "REQUEST_APPROVED" : "REQUEST_REJECTED",
      status: waRes.success ? "SENT" : "FAILED",
      providerMessageId: waRes.messageId || null,
      errorMessage: waRes.error || null,
      sentAt: waRes.success ? now : null,
      createdAt: now,
    });

    if (!waRes.success) {
      await db.insert(auditLogs).values({
        id: `audit-${crypto.randomUUID()}`,
        organizationId: request.organizationId,
        userId: "SYSTEM",
        leaveRequestId: request.id,
        action: "NOTIFICATION_FAILED",
        oldStatus: request.status,
        newStatus: request.status,
        metadata: JSON.stringify({ channel: "WHATSAPP", error: waRes.error }),
        createdAt: now,
      });
    }
  }

  // 2. Send optional Email
  if (request.contactEmail) {
    const { subject, html } = generateDecisionEmployeeEmail({
      requestNumber: request.requestNumber,
      employeeName: `${request.firstName} ${request.lastName}`,
      status: request.status,
      startDate: request.startDate,
      endDate: request.endDate,
      rejectionReason: request.rejectionReason || undefined,
      viewUrl,
    });

    const emailRes = await sendEmail({
      to: request.contactEmail,
      subject,
      html,
    });

    emailSent = emailRes.success;

    await db.insert(notificationLogs).values({
      id: `notif-${crypto.randomUUID()}`,
      organizationId: request.organizationId,
      leaveRequestId: request.id,
      channel: "EMAIL",
      recipient: request.contactEmail,
      notificationType: request.status === "APPROVED" ? "REQUEST_APPROVED" : "REQUEST_REJECTED",
      status: emailRes.success ? "SENT" : "FAILED",
      providerMessageId: emailRes.id || null,
      errorMessage: emailRes.error || null,
      sentAt: emailRes.success ? now : null,
      createdAt: now,
    });

    if (!emailRes.success) {
      await db.insert(auditLogs).values({
        id: `audit-${crypto.randomUUID()}`,
        organizationId: request.organizationId,
        userId: "SYSTEM",
        leaveRequestId: request.id,
        action: "NOTIFICATION_FAILED",
        oldStatus: request.status,
        newStatus: request.status,
        metadata: JSON.stringify({ channel: "EMAIL", error: emailRes.error }),
        createdAt: now,
      });
    }
  }

  return { whatsappSent, emailSent };
}
