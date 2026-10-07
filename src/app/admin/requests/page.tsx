"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { Search, Filter, ArrowRight, ChevronLeft, ChevronRight, FileText } from "lucide-react";
import { StatusBadge } from "@/components/ui/StatusBadge";

interface RequestItem {
  id: string;
  requestNumber: string;
  firstName: string;
  lastName: string;
  employeeNumber: string;
  department: string;
  position: string;
  leaveType: string;
  startDate: string;
  endDate: string;
  requestedDays: number;
  status: string;
  submittedAt: number;
}

export default function AdminRequestsPage() {
  const [requests, setRequests] = useState<RequestItem[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  const fetchRequests = async (p = page, s = statusFilter, q = searchTerm) => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set("page", p.toString());
      params.set("limit", "10");
      if (s !== "ALL") params.set("status", s);
      if (q.trim()) params.set("search", q.trim());

      const res = await fetch(`/api/admin/requests?${params.toString()}`);
      const data = await res.json();

      if (data.items) {
        setRequests(data.items);
        setPage(data.pagination.page);
        setTotalPages(data.pagination.totalPages);
        setTotal(data.pagination.total);
      }
    } catch (err) {
      console.error("Failed to load requests:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests(1, statusFilter, searchTerm);
  }, [statusFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchRequests(1, statusFilter, searchTerm);
  };

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setPage(newPage);
      fetchRequests(newPage, statusFilter, searchTerm);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            Demandes de congé
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Consultez, recherchez et traitez les demandes de congé ({total} au total).
          </p>
        </div>
      </div>

      {/* FILTERS & SEARCH BAR */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Status Filter Tabs */}
        <div className="flex items-center gap-1.5 w-full md:w-auto overflow-x-auto pb-1 md:pb-0">
          {[
            { id: "ALL", label: "Toutes" },
            { id: "PENDING", label: "En attente" },
            { id: "APPROVED", label: "Approuvées" },
            { id: "REJECTED", label: "Refusées" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => {
                setStatusFilter(tab.id);
                setPage(1);
              }}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
                statusFilter === tab.id
                  ? "bg-slate-900 text-white"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Search Input */}
        <form onSubmit={handleSearchSubmit} className="w-full md:w-72 relative">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Nom, matricule, N°..."
            className="w-full h-9 pl-9 pr-3 text-xs bg-slate-50 border border-slate-300 rounded-lg text-slate-900 placeholder:text-slate-400 focus:bg-white"
          />
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3" />
        </form>
      </div>

      {/* REQUESTS TABLE */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-slate-400 text-sm">Chargement des demandes...</div>
        ) : requests.length === 0 ? (
          <div className="p-12 text-center text-slate-500 text-sm">
            Aucune demande trouvée pour les critères sélectionnés.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase font-semibold text-slate-500 border-b border-slate-100">
                <tr>
                  <th className="px-5 py-3">N° Demande</th>
                  <th className="px-5 py-3">Employé</th>
                  <th className="px-5 py-3">Département</th>
                  <th className="px-5 py-3">Type</th>
                  <th className="px-5 py-3">Période</th>
                  <th className="px-5 py-3">Statut</th>
                  <th className="px-5 py-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {requests.map((req) => (
                  <tr key={req.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="px-5 py-3.5 font-mono font-semibold text-slate-900">
                      {req.requestNumber}
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="font-medium text-slate-800">
                        {req.firstName} {req.lastName}
                      </div>
                      <div className="text-xs text-slate-400 font-mono">
                        {req.employeeNumber}
                      </div>
                    </td>
                    <td className="px-5 py-3.5 text-slate-600">{req.department}</td>
                    <td className="px-5 py-3.5 text-slate-600 text-xs">
                      {req.leaveType === "ANNUAL"
                        ? "Annuel"
                        : req.leaveType === "SICK"
                        ? "Maladie"
                        : req.leaveType === "UNPAID"
                        ? "Sans solde"
                        : req.leaveType === "MATERNITY_PATERNITY"
                        ? "Maternité/Paternité"
                        : "Autre"}
                    </td>
                    <td className="px-5 py-3.5 text-slate-600 text-xs">
                      {req.startDate} → {req.endDate}
                      <span className="block text-[11px] text-slate-400">
                        {req.requestedDays} jour(s)
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      <StatusBadge status={req.status} size="sm" />
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <Link
                        href={`/admin/requests/${req.id}`}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-colors"
                      >
                        Détails
                        <ArrowRight className="w-3 h-3" />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* PAGINATION */}
        {totalPages > 1 && (
          <div className="p-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <div>
              Page <span className="font-semibold text-slate-800">{page}</span> sur{" "}
              <span className="font-semibold text-slate-800">{totalPages}</span> ({total} demandes)
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => handlePageChange(page - 1)}
                disabled={page <= 1}
                className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed"
                aria-label="Page précédente"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={() => handlePageChange(page + 1)}
                disabled={page >= totalPages}
                className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed"
                aria-label="Page suivante"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
