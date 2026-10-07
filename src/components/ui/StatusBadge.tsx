import React from "react";
import { Clock, CheckCircle2, XCircle, Ban } from "lucide-react";

export type StatusType = "PENDING" | "APPROVED" | "REJECTED" | "CANCELLED" | "ACTIVE" | "DISABLED" | "INACTIVE";

interface StatusBadgeProps {
  status: StatusType | string;
  size?: "sm" | "md" | "lg";
}

export function StatusBadge({ status, size = "md" }: StatusBadgeProps) {
  const sizeClasses = {
    sm: "px-2 py-0.5 text-xs",
    md: "px-2.5 py-1 text-xs sm:text-sm font-medium",
    lg: "px-3.5 py-1.5 text-sm font-semibold",
  };

  switch (status) {
    case "PENDING":
      return (
        <span
          className={`inline-flex items-center gap-1.5 rounded-full bg-slate-100 text-slate-700 border border-slate-300 font-medium ${sizeClasses[size]}`}
        >
          <Clock className="w-3.5 h-3.5 text-slate-500 animate-pulse" />
          En attente
        </span>
      );
    case "APPROVED":
    case "ACTIVE":
      return (
        <span
          className={`inline-flex items-center gap-1.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 font-medium ${sizeClasses[size]}`}
        >
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
          {status === "APPROVED" ? "Approuvée" : "Actif"}
        </span>
      );
    case "REJECTED":
    case "DISABLED":
    case "INACTIVE":
      return (
        <span
          className={`inline-flex items-center gap-1.5 rounded-full bg-slate-100 text-slate-700 border border-slate-300 font-medium ${sizeClasses[size]}`}
        >
          <XCircle className="w-3.5 h-3.5 text-rose-600" />
          {status === "REJECTED" ? "Refusée" : "Désactivé"}
        </span>
      );
    case "CANCELLED":
      return (
        <span
          className={`inline-flex items-center gap-1.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200 ${sizeClasses[size]}`}
        >
          <Ban className="w-3.5 h-3.5 text-slate-500" />
          Annulée
        </span>
      );
    default:
      return (
        <span
          className={`inline-flex items-center gap-1.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200 ${sizeClasses[size]}`}
        >
          {status}
        </span>
      );
  }
}
