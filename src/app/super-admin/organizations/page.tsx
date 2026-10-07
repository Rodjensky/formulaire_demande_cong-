"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { Building2, PlusCircle, Power, Users, FileText } from "lucide-react";
import { StatusBadge } from "@/components/ui/StatusBadge";

interface OrganizationItem {
  id: string;
  name: string;
  slug: string;
  logoUrl?: string | null;
  email?: string | null;
  phone?: string | null;
  status: "ACTIVE" | "DISABLED";
  createdAt: number;
  pendingCount: number;
  requestCount: number;
}

export default function SuperAdminOrganizationsPage() {
  const [organizations, setOrganizations] = useState<OrganizationItem[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchOrganizations = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/super-admin/organizations");
      const data = await res.json();
      if (data.organizations) {
        setOrganizations(data.organizations);
      }
    } catch (err) {
      console.error("Failed to load organizations:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrganizations();
  }, []);

  const toggleStatus = async (org: OrganizationItem) => {
    const newStatus = org.status === "ACTIVE" ? "DISABLED" : "ACTIVE";
    const confirmMsg =
      newStatus === "DISABLED"
        ? `Êtes-vous sûr de vouloir désactiver "${org.name}" ? Ses utilisateurs ne pourront plus se connecter.`
        : `Réactiver l'entreprise "${org.name}" ?`;

    if (!confirm(confirmMsg)) return;

    try {
      const res = await fetch(`/api/super-admin/organizations/${org.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) {
        await fetchOrganizations();
      }
    } catch (err) {
      alert("Erreur lors de la mise à jour");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            Entreprises clientes
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Gestion des organisations inscrites ({organizations.length} au total).
          </p>
        </div>

        <Link
          href="/super-admin/organizations/new"
          className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl shadow-xs transition-colors flex items-center gap-2 self-start"
        >
          <PlusCircle className="w-4 h-4" />
          Créer une entreprise
        </Link>
      </div>

      {/* ORGANIZATIONS TABLE */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-slate-400 text-sm">Chargement...</div>
        ) : organizations.length === 0 ? (
          <div className="p-12 text-center text-slate-400 text-sm">
            Aucune entreprise enregistrée.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase font-semibold text-slate-500 border-b border-slate-100">
                <tr>
                  <th className="px-5 py-3">Entreprise</th>
                  <th className="px-5 py-3">Slug</th>
                  <th className="px-5 py-3">En attente</th>
                  <th className="px-5 py-3">Total Demandes</th>
                  <th className="px-5 py-3">Statut</th>
                  <th className="px-5 py-3">Créée le</th>
                  <th className="px-5 py-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {organizations.map((org) => (
                  <tr key={org.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="px-5 py-3.5">
                      <div className="font-semibold text-slate-900">{org.name}</div>
                      <div className="text-xs text-slate-400">{org.email || "Sans email"}</div>
                    </td>
                    <td className="px-5 py-3.5 font-mono text-xs text-slate-600">{org.slug}</td>
                    <td className="px-5 py-3.5 text-xs text-amber-700 font-medium">
                      {org.pendingCount} en attente
                    </td>
                    <td className="px-5 py-3.5 text-xs text-slate-700 font-medium">
                      {org.requestCount} demandes
                    </td>
                    <td className="px-5 py-3.5">
                      <StatusBadge status={org.status} size="sm" />
                    </td>
                    <td className="px-5 py-3.5 text-xs text-slate-400">
                      {new Date(org.createdAt).toLocaleDateString("fr-FR")}
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <button
                        onClick={() => toggleStatus(org)}
                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                          org.status === "ACTIVE"
                            ? "text-rose-600 hover:bg-rose-50 border border-rose-200"
                            : "text-emerald-600 hover:bg-emerald-50 border border-emerald-200"
                        }`}
                      >
                        <Power className="w-3.5 h-3.5" />
                        {org.status === "ACTIVE" ? "Désactiver" : "Activer"}
                      </button>
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
