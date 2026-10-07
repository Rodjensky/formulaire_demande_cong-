"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Building2, PlusCircle, ShieldCheck } from "lucide-react";

export function SuperAdminSidebar() {
  const pathname = usePathname();

  const navItems = [
    {
      href: "/super-admin",
      label: "Vue d'ensemble",
      icon: LayoutDashboard,
      exact: true,
    },
    {
      href: "/super-admin/organizations",
      label: "Entreprises clientes",
      icon: Building2,
      exact: true,
    },
    {
      href: "/super-admin/organizations/new",
      label: "Nouvelle entreprise",
      icon: PlusCircle,
      exact: true,
    },
  ];

  return (
    <aside className="w-64 bg-slate-950 text-slate-300 flex flex-col shrink-0 border-r border-slate-800">
      <div className="h-16 flex items-center px-6 border-b border-slate-800 gap-3">
        <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center font-bold text-sm shadow-xs">
          <ShieldCheck className="w-5 h-5" />
        </div>
        <div>
          <h2 className="text-sm font-bold text-white">Super Admin</h2>
          <span className="text-[10px] text-indigo-400 uppercase tracking-wider font-semibold">
            Plateforme Multi-Tenant
          </span>
        </div>
      </div>

      <nav className="flex-1 px-3 py-6 space-y-1">
        {navItems.map((item) => {
          const isActive = item.exact ? pathname === item.href : pathname.startsWith(item.href);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                isActive
                  ? "bg-indigo-600 text-white shadow-xs"
                  : "text-slate-400 hover:text-white hover:bg-slate-900"
              }`}
            >
              <Icon className="w-4 h-4 shrink-0" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-slate-900">
        <div className="text-[11px] text-slate-600 text-center">
          Supervision Plateforme
        </div>
      </div>
    </aside>
  );
}
