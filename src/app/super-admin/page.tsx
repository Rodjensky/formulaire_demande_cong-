"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { Building2, Users, FileText, CheckCircle2, XCircle, PlusCircle, ArrowRight } from "lucide-react";
import { StatusBadge } from "@/components/ui/StatusBadge";

interface PlatformStats {
  totalOrganizations: number;
  activeOrganizations: number;
  disabledOrganizations: number;
  totalEmployees: number;
  totalRequests: number;
  recentRequests: any[];
}

export default function SuperAdminOverviewPage() {
  const [stats, setStats] = useState<PlatformStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadStats() {
      try {
        const res = await fetch("/api/super-admin/stats");
        const data = await res.json();
        if (data.stats) {
          setStats(data.stats);
        }
      } catch (err) {
        console.error("Failed to load platform stats:", err);
      } finally {
        setLoading(false);
      }
    }
    loadStats();
  }, []);

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            Vue d'ensemble de la plateforme
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Supervision globale des entreprises clientes et de l'activité.
          </p>
        </div>

        <Link
          href="/super-admin/organizations/new"
          className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl shadow-xs transition-colors flex items-center gap-2 self-start"
        >
          <PlusCircle className="w-4 h-4" />
          Ajouter une entreprise
        </Link>
      </div>

      {/* METRICS GRID */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* TOTAL ORGS */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Entreprises Clientes
            </span>
            <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <Building2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 text-3xl font-bold text-slate-900">
            {loading ? "..." : stats?.totalOrganizations}
          </div>
          <div className="mt-2 text-xs text-slate-500 flex items-center gap-2">
            <span className="text-emerald-600 font-semibold">
              {stats?.activeOrganizations} actives
            </span>
            <span>•</span>
            <span className="text-slate-400">{stats?.disabledOrganizations} désactivées</span>
          </div>
        </div>

        {/* TOTAL EMPLOYEES */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Total Employés
            </span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 text-3xl font-bold text-slate-900">
            {loading ? "..." : stats?.totalEmployees}
          </div>
          <div className="mt-2 text-xs text-slate-500">Sur l'ensemble des entreprises</div>
        </div>

        {/* TOTAL REQUESTS */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Demandes traitées
            </span>
            <div className="w-8 h-8 rounded-lg bg-sky-50 text-sky-600 flex items-center justify-center">
              <FileText className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 text-3xl font-bold text-slate-900">
            {loading ? "..." : stats?.totalRequests}
          </div>
          <div className="mt-2 text-xs text-slate-500">Volume global de congés</div>
        </div>

        {/* STATUS PLATFORM */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Statut Système
            </span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 text-lg font-bold text-emerald-600 flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-pulse" />
            Opérationnel
          </div>
          <div className="mt-2 text-xs text-slate-400">D1 Database & Services actifs</div>
        </div>
      </div>

      {/* RECENT PLATFORM ACTIVITY */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-slate-800">Dernières demandes (Plateforme)</h2>
            <p className="text-xs text-slate-500">Vue macroscopique sans exposition des données privées</p>
          </div>
          <Link
            href="/super-admin/organizations"
            className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 flex items-center gap-1"
          >
            Gérer les entreprises
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {loading ? (
          <div className="p-8 text-center text-slate-400 text-sm">Chargement...</div>
        ) : (stats?.recentRequests || []).length === 0 ? (
          <div className="p-8 text-center text-slate-400 text-sm">
            Aucune demande sur la plateforme pour le moment.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase font-semibold text-slate-500 border-b border-slate-100">
                <tr>
                  <th className="px-5 py-3">Entreprise</th>
                  <th className="px-5 py-3">N° Demande</th>
                  <th className="px-5 py-3">Statut</th>
                  <th className="px-5 py-3">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {stats?.recentRequests.map((req) => (
                  <tr key={req.id}>
                    <td className="px-5 py-3.5 font-medium text-slate-800">
                      {req.organizationName}
                    </td>
                    <td className="px-5 py-3.5 font-mono text-slate-700">{req.requestNumber}</td>
                    <td className="px-5 py-3.5">
                      <StatusBadge status={req.status} size="sm" />
                    </td>
                    <td className="px-5 py-3.5 text-xs text-slate-400">
                      {new Date(req.submittedAt).toLocaleString("fr-FR")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
