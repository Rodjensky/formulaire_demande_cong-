"use client";

import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  Calendar,
  User,
  Building,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  ArrowLeft,
  FileText,
} from "lucide-react";
import { StatusBadge } from "@/components/ui/StatusBadge";

export default function EmployeeRequestStatusPage() {
  const params = useParams();
  const token = params?.token as string;

  const [request, setRequest] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadStatus() {
      if (!token) return;
      try {
        const res = await fetch(`/api/public/request-status?token=${encodeURIComponent(token)}`);
        const data = await res.json();
        if (!res.ok || !data.request) {
          setError(data.error || "Cette demande n'est pas disponible ou le lien est invalide.");
          return;
        }
        setRequest(data.request);
      } catch (err) {
        setError("Impossible de contacter le serveur.");
      } finally {
        setLoading(false);
      }
    }
    loadStatus();
  }, [token]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="text-center space-y-3">
          <div className="w-10 h-10 border-3 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-sm font-medium text-slate-600">Chargement de votre demande...</p>
        </div>
      </div>
    );
  }

  if (error || !request) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-2xl border border-slate-200 p-8 text-center shadow-xs">
          <div className="w-12 h-12 bg-rose-50 text-rose-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-6 h-6" />
          </div>
          <h2 className="text-lg font-bold text-slate-900 mb-2">Demande introuvable</h2>
          <p className="text-xs text-slate-500 mb-6">
            {error || "Cette demande n'est pas disponible ou le lien est invalide."}
          </p>
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-slate-900 text-white text-xs font-semibold rounded-xl hover:bg-slate-800 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Retour à l'accueil
          </Link>
        </div>
      </div>
    );
  }

  const isApproved = request.status === "APPROVED";
  const isRejected = request.status === "REJECTED";
  const isPending = request.status === "PENDING";

  return (
    <div className="min-h-screen bg-slate-50 py-10 px-4 sm:px-6">
      <div className="max-w-xl mx-auto space-y-6">
        {/* HEADER */}
        <div className="flex items-center justify-between">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Accueil
          </Link>
          <div className="text-xs font-medium text-slate-400">Suivi de demande</div>
        </div>

        {/* STATUS CARD */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sm:p-8 space-y-6">
          {/* Header with Request Number and Status */}
          <div className="border-b border-slate-100 pb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <span className="text-xs uppercase font-semibold tracking-wider text-slate-400">
                Numéro de demande
              </span>
              <h1 className="text-2xl sm:text-3xl font-bold font-mono text-slate-900">
                {request.requestNumber}
              </h1>
              <div className="text-xs text-slate-500 mt-0.5">{request.organizationName}</div>
            </div>
            <div>
              <StatusBadge status={request.status} size="lg" />
            </div>
          </div>

          {/* REJECTION REASON BOX */}
          {isRejected && (
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 space-y-1 animate-in fade-in">
              <div className="flex items-center gap-2 text-slate-800 font-bold text-sm">
                <XCircle className="w-4 h-4 text-rose-600" />
                Motif du refus
              </div>
              <p className="text-sm text-slate-700 pt-1 leading-relaxed">
                {request.rejectionReason || "Aucun motif spécifique renseigné."}
              </p>
            </div>
          )}

          {/* APPROVAL MESSAGE BOX */}
          {isApproved && (
            <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-5 flex items-start gap-3 animate-in fade-in">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
              <div>
                <h4 className="font-bold text-emerald-900 text-sm">
                  Demande validée et approuvée
                </h4>
                <p className="text-xs text-emerald-800 mt-0.5">
                  Votre congé a été officiellement enregistré par la direction / le secrétariat.
                </p>
              </div>
            </div>
          )}

          {/* PENDING NOTICE */}
          {isPending && (
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 flex items-start gap-3 animate-in fade-in">
              <Clock className="w-5 h-5 text-slate-500 shrink-0 mt-0.5 animate-pulse" />
              <div>
                <h4 className="font-bold text-slate-800 text-sm">Demande en cours d'examen</h4>
                <p className="text-xs text-slate-600 mt-0.5">
                  Votre demande a été transmise au secrétariat. Vous recevrez une notification par WhatsApp dès la décision prise.
                </p>
              </div>
            </div>
          )}

          {/* SUMMARY DETAILS */}
          <div className="space-y-4 pt-2">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Détails du récapitulatif
            </h3>

            <div className="grid grid-cols-2 gap-4 text-sm bg-slate-50 p-4 rounded-xl border border-slate-100">
              <div>
                <span className="block text-xs text-slate-400">Employé</span>
                <span className="font-semibold text-slate-800">
                  {request.firstName} {request.lastName}
                </span>
              </div>
              <div>
                <span className="block text-xs text-slate-400">Département</span>
                <span className="text-slate-800">{request.department}</span>
              </div>
              <div>
                <span className="block text-xs text-slate-400">Type de congé</span>
                <span className="font-medium text-slate-800">
                  {request.leaveType === "ANNUAL"
                    ? "Congé Annuel"
                    : request.leaveType === "SICK"
                    ? "Congé Maladie"
                    : request.leaveType === "UNPAID"
                    ? "Congé Sans Solde"
                    : request.leaveType === "MATERNITY_PATERNITY"
                    ? "Maternité / Paternité"
                    : `Autre (${request.leaveTypeOther})`}
                </span>
              </div>
              <div>
                <span className="block text-xs text-slate-400">Nombre de jours</span>
                <span className="font-bold text-emerald-700">
                  {request.requestedDays} jour(s)
                </span>
              </div>
              <div className="col-span-2">
                <span className="block text-xs text-slate-400">Période accordée / demandée</span>
                <span className="font-semibold text-slate-800">
                  Du {request.startDate} au {request.endDate}
                </span>
              </div>
              {request.replacementName && (
                <div className="col-span-2">
                  <span className="block text-xs text-slate-400">Remplaçant</span>
                  <span className="text-slate-800">{request.replacementName}</span>
                </div>
              )}
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 text-center">
            <p className="text-[11px] text-slate-400">
              Soumis le {new Date(request.submittedAt).toLocaleString("fr-FR")}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
