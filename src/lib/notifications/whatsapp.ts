/**
 * WhatsApp utilities supporting both:
 * 1. Direct 1-Click WhatsApp Links (https://wa.me/) - 100% free, zero Meta setup needed, opens native app
 * 2. WhatsApp Business Cloud API (Optional background automated sending)
 */

export function formatWhatsAppPhone(phone: string): string {
  return phone.replace(/[^0-9]/g, "");
}

/**
 * Generates a direct WhatsApp link (wa.me) with pre-filled encoded text.
 * Opens WhatsApp Mobile or WhatsApp Web directly on the user's device.
 */
export function generateWhatsAppDirectLink(phone: string, text: string): string {
  const cleanedPhone = formatWhatsAppPhone(phone);
  const encodedText = encodeURIComponent(text);
  return `https://wa.me/${cleanedPhone}?text=${encodedText}`;
}

export function buildWhatsAppApprovalMessage(params: {
  employeeFirstName: string;
  requestNumber: string;
  startDate: string;
  endDate: string;
  viewUrl: string;
}): string {
  return `Bonjour ${params.employeeFirstName},

Votre demande de congé ${params.requestNumber} a été APPROUVÉE.

Date de début :
${params.startDate}

Date de fin :
${params.endDate}

Consulter votre demande :
${params.viewUrl}`;
}

export function buildWhatsAppRejectionMessage(params: {
  employeeFirstName: string;
  requestNumber: string;
  rejectionReason: string;
  viewUrl: string;
}): string {
  return `Bonjour ${params.employeeFirstName},

Votre demande de congé ${params.requestNumber} a été REFUSÉE.

Motif :
${params.rejectionReason}

Consulter votre demande :
${params.viewUrl}`;
}

export function buildWhatsAppNewSubmissionMessage(params: {
  employeeName: string;
  requestNumber: string;
  startDate: string;
  endDate: string;
  requestedDays: number;
  leaveType: string;
  viewUrl: string;
}): string {
  return `Bonjour,

Nouvelle demande de congé soumise :
- Numéro : ${params.requestNumber}
- Employé : ${params.employeeName}
- Type : ${params.leaveType}
- Période : Du ${params.startDate} au ${params.endDate} (${params.requestedDays} jour(s))

Lien de consultation :
${params.viewUrl}`;
}

/**
 * Optional Cloud API sender (if configured)
 */
export async function sendWhatsAppMessage({
  toPhone,
  messageText,
}: {
  toPhone: string;
  messageText: string;
}): Promise<{ success: boolean; messageId?: string; error?: string }> {
  const accessToken = process.env.WHATSAPP_ACCESS_TOKEN;
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;

  if (!accessToken || !phoneNumberId || accessToken.startsWith("EAAG...")) {
    // Cloud API not configured, fallback to simulation mode
    console.log(`[WHATSAPP LINK READY] To: ${toPhone}\nBody:\n${messageText}`);
    return { success: true, messageId: `link-wa-${Date.now()}` };
  }

  const recipient = formatWhatsAppPhone(toPhone);

  try {
    const url = `https://graph.facebook.com/v21.0/${phoneNumberId}/messages`;
    const res = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        recipient_type: "individual",
        to: recipient,
        type: "text",
        text: {
          preview_url: true,
          body: messageText,
        },
      }),
    });

    const data = (await res.json()) as any;
    if (!res.ok) {
      return {
        success: false,
        error: data?.error?.message || `WhatsApp API error (${res.status})`,
      };
    }

    return { success: true, messageId: data?.messages?.[0]?.id || `wa-${Date.now()}` };
  } catch (err: any) {
    return { success: false, error: err?.message || "Erreur réseau WhatsApp" };
  }
}
