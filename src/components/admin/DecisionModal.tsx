"use client";

import React, { useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { CheckCircle2, XCircle, AlertTriangle } from "lucide-react";

interface DecisionModalProps {
  isOpen: boolean;
  onClose: () => void;
  type: "APPROVE" | "REJECT";
  requestNumber: string;
  employeeName: string;
  onConfirm: (data: { rejectionReason?: string; comment?: string }) => Promise<void>;
}

export function DecisionModal({
  isOpen,
  onClose,
  type,
  requestNumber,
  employeeName,
  onConfirm,
}: DecisionModalProps) {
  const [rejectionReason, setRejectionReason] = useState("");
  const [comment, setComment] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isApprove = type === "APPROVE";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!isApprove && (!rejectionReason || rejectionReason.trim().length < 3)) {
      setError("La raison du refus est obligatoire (minimum 3 caractères)");
      return;
    }

    setLoading(true);
    try {
      await onConfirm({
        rejectionReason: !isApprove ? rejectionReason.trim() : undefined,
        comment: comment.trim() || undefined,
      });
      onClose();
    } catch (err: any) {
      setError(err?.message || "Une erreur est survenue");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isApprove ? "Confirmer l'approbation" : "Confirmer le refus"}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div
          className={`p-4 rounded-xl flex items-start gap-3 border ${
            isApprove
              ? "bg-slate-50 border-slate-200 text-slate-800"
              : "bg-slate-50 border-slate-200 text-slate-800"
          }`}
        >
          {isApprove ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
          ) : (
            <XCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
          )}
          <div className="text-sm">
            <p className="font-semibold text-slate-900">
              Demande : {requestNumber} — {employeeName}
            </p>
            <p className="text-xs mt-1 text-slate-600">
              {isApprove
                ? "Êtes-vous sûr de vouloir approuver cette demande de congé ? Une notification WhatsApp et un email seront envoyés à l'employé."
                : "Le refus d'une demande de congé est définitif et nécessite une raison obligatoire qui sera transmise à l'employé."}
            </p>
          </div>
        </div>

        {error && (
          <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-rose-700 text-xs font-medium flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
            {error}
          </div>
        )}

        {!isApprove && (
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
              Raison du refus <span className="text-rose-500">*</span>
            </label>
            <textarea
              required
              rows={3}
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              placeholder="Indiquez le motif précis du refus (ex. Effectif minimum insuffisant sur cette période...)"
              className="w-full p-3 border border-slate-300 rounded-lg text-sm text-slate-900 focus:bg-white"
            />
          </div>
        )}

        <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
          >
            Annuler
          </button>
          <button
            type="submit"
            disabled={loading}
            className={`px-5 py-2 text-sm font-semibold text-white rounded-lg shadow-xs transition-colors flex items-center gap-2 ${
              isApprove
                ? "bg-emerald-600 hover:bg-emerald-700"
                : "bg-rose-600 hover:bg-rose-700"
            }`}
          >
            {loading && <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />}
            {isApprove ? "Approuver la demande" : "Refuser la demande"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
