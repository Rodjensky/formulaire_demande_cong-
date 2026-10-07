"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Building2, User, Lock, AlertCircle, CheckCircle2 } from "lucide-react";

export default function NewOrganizationPage() {
  const router = useRouter();

  // Org Fields
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [logoUrl, setLogoUrl] = useState("");

  // Initial Admin Fields
  const [adminName, setAdminName] = useState("");
  const [adminEmail, setAdminEmail] = useState("");
  const [adminPassword, setAdminPassword] = useState("");

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleNameChange = (val: string) => {
    setName(val);
    // Auto-generate clean slug
    if (!slug || slug === name.toLowerCase().replace(/[^a-z0-9]+/g, "-")) {
      setSlug(
        val
          .toLowerCase()
          .trim()
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/^-|-$/g, "")
      );
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSaving(true);

    try {
      const res = await fetch("/api/super-admin/organizations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          slug,
          email: email || undefined,
          phone: phone || undefined,
          address: address || undefined,
          logoUrl: logoUrl || undefined,
          adminName,
          adminEmail,
          adminPassword,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Impossible de créer l'entreprise");
        return;
      }

      router.push("/super-admin/organizations");
    } catch (err) {
      setError("Erreur réseau");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <Link
          href="/super-admin/organizations"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 transition-colors mb-2"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Retour aux entreprises
        </Link>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
          Créer une nouvelle entreprise
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Ajoute un nouvel espace d'entreprise isolé ainsi que son premier compte administrateur.
        </p>
      </div>

      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-sm font-medium flex items-center gap-2">
          <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 sm:p-8 space-y-6">
        {/* SECTION: INFOS ENTREPRISE */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-indigo-900 font-bold text-sm border-b border-slate-100 pb-2">
            <Building2 className="w-4 h-4 text-indigo-600" />
            <span>INFORMATIONS ENTREPRISE</span>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Nom de l'entreprise <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => handleNameChange(e.target.value)}
              placeholder="ex. Technozi SAS"
              className="w-full h-10 px-3.5 border border-slate-300 rounded-lg text-sm text-slate-900"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Slug unique (URL / Identifiant) <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              value={slug}
              onChange={(e) => setSlug(e.target.value.toLowerCase())}
              placeholder="ex. technozi"
              className="w-full h-10 px-3.5 border border-slate-300 rounded-lg text-sm font-mono text-slate-900"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Email général
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="contact@technozi.com"
                className="w-full h-10 px-3.5 border border-slate-300 rounded-lg text-sm text-slate-900"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Téléphone
              </label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+225 0100000000"
                className="w-full h-10 px-3.5 border border-slate-300 rounded-lg text-sm text-slate-900"
              />
            </div>
          </div>
        </div>

        {/* SECTION: ADMIN INITIAL */}
        <div className="space-y-4 pt-2">
          <div className="flex items-center gap-2 text-indigo-900 font-bold text-sm border-b border-slate-100 pb-2">
            <User className="w-4 h-4 text-indigo-600" />
            <span>COMPTE ADMINISTRATEUR INITIAL</span>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Nom de l'administrateur <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              value={adminName}
              onChange={(e) => setAdminName(e.target.value)}
              placeholder="ex. Marc Kouassi"
              className="w-full h-10 px-3.5 border border-slate-300 rounded-lg text-sm text-slate-900"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Email administrateur (Identifiant de connexion) <span className="text-rose-500">*</span>
            </label>
            <input
              type="email"
              required
              value={adminEmail}
              onChange={(e) => setAdminEmail(e.target.value)}
              placeholder="admin@technozi.com"
              className="w-full h-10 px-3.5 border border-slate-300 rounded-lg text-sm text-slate-900"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Mot de passe administrateur <span className="text-rose-500">*</span>
            </label>
            <input
              type="password"
              required
              minLength={8}
              value={adminPassword}
              onChange={(e) => setAdminPassword(e.target.value)}
              placeholder="Minimum 8 caractères"
              className="w-full h-10 px-3.5 border border-slate-300 rounded-lg text-sm text-slate-900"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={saving}
          className="w-full h-12 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl shadow-xs transition-colors flex items-center justify-center gap-2"
        >
          {saving ? "Création en cours..." : "Créer l'entreprise & le compte admin"}
        </button>
      </form>
    </div>
  );
}
