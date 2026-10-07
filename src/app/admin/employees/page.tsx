"use client";

import React, { useEffect, useState } from "react";
import { Users, Plus, Search, Edit2, CheckCircle2, XCircle, AlertCircle, Phone, Mail } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { StatusBadge } from "@/components/ui/StatusBadge";

interface EmployeeItem {
  id: string;
  employeeNumber: string;
  firstName: string;
  lastName: string;
  department: string;
  position: string;
  phone: string;
  email?: string | null;
  status: "ACTIVE" | "INACTIVE";
}

export default function AdminEmployeesPage() {
  const [employees, setEmployees] = useState<EmployeeItem[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<EmployeeItem | null>(null);

  // Form State
  const [employeeNumber, setEmployeeNumber] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [department, setDepartment] = useState("");
  const [position, setPosition] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"ACTIVE" | "INACTIVE">("ACTIVE");

  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const fetchEmployees = async (q = searchTerm) => {
    setLoading(true);
    try {
      const url = q.trim() ? `/api/admin/employees?search=${encodeURIComponent(q.trim())}` : "/api/admin/employees";
      const res = await fetch(url);
      const data = await res.json();
      if (data.employees) {
        setEmployees(data.employees);
      }
    } catch (err) {
      console.error("Failed to load employees:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEmployees(searchTerm);
  }, []);

  const openCreateModal = () => {
    setEditingEmployee(null);
    setEmployeeNumber("");
    setFirstName("");
    setLastName("");
    setDepartment("");
    setPosition("");
    setPhone("");
    setEmail("");
    setStatus("ACTIVE");
    setFormError(null);
    setIsModalOpen(true);
  };

  const openEditModal = (emp: EmployeeItem) => {
    setEditingEmployee(emp);
    setEmployeeNumber(emp.employeeNumber);
    setFirstName(emp.firstName);
    setLastName(emp.lastName);
    setDepartment(emp.department);
    setPosition(emp.position);
    setPhone(emp.phone);
    setEmail(emp.email || "");
    setStatus(emp.status);
    setFormError(null);
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setSaving(true);

    try {
      const payload = {
        employeeNumber,
        firstName,
        lastName,
        department,
        position,
        phone,
        email: email || undefined,
        status,
      };

      const endpoint = editingEmployee
        ? `/api/admin/employees/${editingEmployee.id}`
        : "/api/admin/employees";
      const method = editingEmployee ? "PATCH" : "POST";

      const res = await fetch(endpoint, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        setFormError(data.error || "Impossible d'enregistrer l'employé");
        return;
      }

      setIsModalOpen(false);
      await fetchEmployees(searchTerm);
    } catch (err) {
      setFormError("Erreur réseau");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            Annuaire des employés
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Gérez les fiches des employés de votre entreprise ({employees.length} inscrits).
          </p>
        </div>

        <button
          onClick={openCreateModal}
          className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-xl shadow-xs transition-colors flex items-center gap-2 self-start"
        >
          <Plus className="w-4 h-4" />
          Ajouter un employé
        </button>
      </div>

      {/* SEARCH BAR */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
        <div className="relative w-full max-w-sm">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              fetchEmployees(e.target.value);
            }}
            placeholder="Rechercher par nom, matricule, poste..."
            className="w-full h-9 pl-9 pr-3 text-xs bg-slate-50 border border-slate-300 rounded-lg text-slate-900 placeholder:text-slate-400 focus:bg-white"
          />
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3" />
        </div>
      </div>

      {/* EMPLOYEES TABLE */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-slate-400 text-sm">Chargement...</div>
        ) : employees.length === 0 ? (
          <div className="p-12 text-center text-slate-400 text-sm">
            Aucun employé répertorié. Cliquez sur "Ajouter un employé" pour créer le premier.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase font-semibold text-slate-500 border-b border-slate-100">
                <tr>
                  <th className="px-5 py-3">Matricule</th>
                  <th className="px-5 py-3">Employé</th>
                  <th className="px-5 py-3">Département & Poste</th>
                  <th className="px-5 py-3">Coordonnées</th>
                  <th className="px-5 py-3">Statut</th>
                  <th className="px-5 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {employees.map((emp) => (
                  <tr key={emp.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="px-5 py-3.5 font-mono font-semibold text-slate-900">
                      {emp.employeeNumber}
                    </td>
                    <td className="px-5 py-3.5 font-medium text-slate-800">
                      {emp.firstName} {emp.lastName}
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="text-slate-800 font-medium">{emp.department}</div>
                      <div className="text-xs text-slate-500">{emp.position}</div>
                    </td>
                    <td className="px-5 py-3.5 text-xs text-slate-600">
                      <div className="flex items-center gap-1">
                        <Phone className="w-3 h-3 text-slate-400" />
                        <span>{emp.phone}</span>
                      </div>
                      {emp.email && (
                        <div className="flex items-center gap-1 text-slate-400 mt-0.5">
                          <Mail className="w-3 h-3" />
                          <span>{emp.email}</span>
                        </div>
                      )}
                    </td>
                    <td className="px-5 py-3.5">
                      <StatusBadge status={emp.status} size="sm" />
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <button
                        onClick={() => openEditModal(emp)}
                        className="p-1.5 text-slate-500 hover:text-emerald-600 hover:bg-slate-100 rounded-lg transition-colors"
                        title="Modifier"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* CREATE / EDIT MODAL */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingEmployee ? "Modifier l'employé" : "Ajouter un nouvel employé"}
      >
        <form onSubmit={handleSave} className="space-y-4">
          {formError && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-rose-700 text-xs font-medium flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              {formError}
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Prénom <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                className="w-full h-9 px-3 border border-slate-300 rounded-lg text-xs text-slate-900"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Nom <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                className="w-full h-9 px-3 border border-slate-300 rounded-lg text-xs text-slate-900"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                N° Matricule <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={employeeNumber}
                onChange={(e) => setEmployeeNumber(e.target.value)}
                className="w-full h-9 px-3 border border-slate-300 rounded-lg text-xs text-slate-900 font-mono"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Département <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                className="w-full h-9 px-3 border border-slate-300 rounded-lg text-xs text-slate-900"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Poste <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              value={position}
              onChange={(e) => setPosition(e.target.value)}
              className="w-full h-9 px-3 border border-slate-300 rounded-lg text-xs text-slate-900"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Téléphone (WhatsApp) <span className="text-rose-500">*</span>
              </label>
              <input
                type="tel"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full h-9 px-3 border border-slate-300 rounded-lg text-xs text-slate-900"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full h-9 px-3 border border-slate-300 rounded-lg text-xs text-slate-900"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Statut
            </label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as any)}
              className="w-full h-9 px-3 border border-slate-300 rounded-lg text-xs text-slate-900 bg-white"
            >
              <option value="ACTIVE">Actif</option>
              <option value="INACTIVE">Inactif</option>
            </select>
          </div>

          <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-3.5 py-2 text-xs font-medium text-slate-700 hover:bg-slate-100 rounded-lg"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-4 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-xs"
            >
              {saving ? "Enregistrement..." : "Enregistrer"}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
