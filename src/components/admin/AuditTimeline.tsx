import React from "react";
import { CheckCircle2, XCircle, Send, AlertTriangle, FileText, Bell } from "lucide-react";

interface AuditEvent {
  id: string;
  action: string;
  oldStatus?: string | null;
  newStatus?: string | null;
  metadata?: string | null;
  createdAt: number;
  userName?: string | null;
}

interface NotificationEvent {
  id: string;
  channel: "EMAIL" | "WHATSAPP";
  recipient: string;
  notificationType: string;
  status: "SENT" | "FAILED";
  errorMessage?: string | null;
  sentAt?: number | null;
  createdAt: number;
}

interface AuditTimelineProps {
  auditLogs: AuditEvent[];
  notifications: NotificationEvent[];
}

type TimelineItem =
  | {
      id: string;
      type: "AUDIT";
      action: string;
      timestamp: number;
      actor: string;
      metadata: any;
      oldStatus?: string | null;
      newStatus?: string | null;
    }
  | {
      id: string;
      type: "NOTIFICATION";
      action: string;
      timestamp: number;
      actor: "EMAIL" | "WHATSAPP";
      recipient: string;
      notifType: string;
      error?: string | null;
    };

export function AuditTimeline({ auditLogs, notifications }: AuditTimelineProps) {
  const timelineItems: TimelineItem[] = [
    ...auditLogs.map(
      (log): TimelineItem => ({
        id: log.id,
        type: "AUDIT",
        action: log.action,
        timestamp: log.createdAt,
        actor: log.userName || "Employé / Système",
        metadata: log.metadata ? JSON.parse(log.metadata) : null,
        oldStatus: log.oldStatus,
        newStatus: log.newStatus,
      })
    ),
    ...notifications.map(
      (notif): TimelineItem => ({
        id: notif.id,
        type: "NOTIFICATION",
        action: notif.status === "SENT" ? "NOTIFICATION_SENT" : "NOTIFICATION_FAILED",
        timestamp: notif.sentAt || notif.createdAt,
        actor: notif.channel,
        recipient: notif.recipient,
        notifType: notif.notificationType,
        error: notif.errorMessage,
      })
    ),
  ].sort((a, b) => b.timestamp - a.timestamp);

  if (timelineItems.length === 0) {
    return <div className="text-xs text-slate-400 py-4">Aucun événement d'audit enregistré.</div>;
  }

  const getActionBadge = (item: TimelineItem) => {
    switch (item.action) {
      case "SUBMITTED":
        return {
          icon: <FileText className="w-4 h-4 text-slate-700" />,
          title: "Demande créée",
          bgColor: "bg-slate-100 text-slate-800 border-slate-200",
        };
      case "APPROVED":
        return {
          icon: <CheckCircle2 className="w-4 h-4 text-emerald-600" />,
          title: "Demande approuvée",
          bgColor: "bg-slate-100 text-slate-800 border-slate-200",
        };
      case "REJECTED":
        return {
          icon: <XCircle className="w-4 h-4 text-rose-600" />,
          title: "Demande refusée",
          bgColor: "bg-rose-50 text-rose-700 border-rose-200",
        };
      case "NOTIFICATION_SENT":
        return {
          icon: <Send className="w-4 h-4 text-slate-600" />,
          title: `Notification ${item.actor} envoyée`,
          bgColor: "bg-slate-100 text-slate-800 border-slate-200",
        };
      case "NOTIFICATION_FAILED":
        return {
          icon: <AlertTriangle className="w-4 h-4 text-amber-600" />,
          title: `Échec notification ${item.actor}`,
          bgColor: "bg-slate-100 text-slate-800 border-slate-200",
        };
      default:
        return {
          icon: <Bell className="w-4 h-4 text-slate-600" />,
          title: item.action,
          bgColor: "bg-slate-100 text-slate-800 border-slate-200",
        };
    }
  };

  return (
    <div className="space-y-4">
      <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-500">
        Historique & Journal d'audit
      </h4>

      <div className="relative pl-6 border-l-2 border-slate-200 space-y-6">
        {timelineItems.map((item) => {
          const badge = getActionBadge(item);
          const dateStr = new Date(item.timestamp).toLocaleString("fr-FR", {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
          });

          return (
            <div key={item.id} className="relative group">
              <div className="absolute -left-[31px] top-0.5 w-6 h-6 rounded-full bg-white border border-slate-300 flex items-center justify-center shadow-2xs">
                {badge.icon}
              </div>

              <div>
                <div className="flex items-center gap-2">
                  <span className={`text-xs px-2 py-0.5 rounded-md font-medium border ${badge.bgColor}`}>
                    {badge.title}
                  </span>
                  <span className="text-xs text-slate-400">{dateStr}</span>
                </div>

                <div className="text-xs text-slate-600 mt-1">
                  Par : <span className="font-medium text-slate-800">{item.actor}</span>
                  {item.type === "NOTIFICATION" && (
                    <span className="ml-2 text-slate-500">
                      (Destinataire : {item.recipient})
                    </span>
                  )}
                </div>

                {item.type === "AUDIT" && item.metadata?.rejectionReason && (
                  <div className="mt-1.5 p-2 bg-rose-50 text-rose-900 border border-rose-200 rounded text-xs">
                    <strong>Motif :</strong> {item.metadata.rejectionReason}
                  </div>
                )}

                {item.type === "AUDIT" && item.metadata?.comment && (
                  <div className="mt-1 text-xs text-slate-600 italic">
                    Note : "{item.metadata.comment}"
                  </div>
                )}

                {item.type === "NOTIFICATION" && item.error && (
                  <div className="mt-1 text-xs text-rose-600">
                    Détail de l'erreur : {item.error}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
