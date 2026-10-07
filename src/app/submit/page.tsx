import React from "react";
import Link from "next/link";
import { ArrowLeft, Calendar } from "lucide-react";
import { LeaveRequestForm } from "@/components/forms/LeaveRequestForm";

export default function SubmitLeavePage() {
  return (
    <div className="min-h-screen bg-slate-50 py-8 px-4 sm:px-6">
      <div className="max-w-3xl mx-auto mb-6 flex items-center justify-between">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Retour à l'accueil
        </Link>
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-md bg-emerald-600 text-white flex items-center justify-center font-bold text-xs">
            <Calendar className="w-3.5 h-3.5" />
          </div>
          <span className="text-xs font-semibold text-slate-700">Demande de Congé</span>
        </div>
      </div>

      <LeaveRequestForm />
    </div>
  );
}
