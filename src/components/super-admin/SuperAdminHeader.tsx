"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { LogOut, ShieldAlert } from "lucide-react";

interface SuperAdminHeaderProps {
  userName?: string;
  userEmail?: string;
}

export function SuperAdminHeader({ userName, userEmail }: SuperAdminHeaderProps) {
  const router = useRouter();

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      router.push("/login");
      router.refresh();
    } catch (err) {
      console.error("Logout failed:", err);
    }
  };

  return (
    <header className="h-16 bg-white border-b border-slate-200 px-6 flex items-center justify-between shrink-0">
      <div className="flex items-center gap-2">
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-indigo-50 text-indigo-700 text-xs font-semibold border border-indigo-200">
          <ShieldAlert className="w-3.5 h-3.5 text-indigo-600" />
          Console Super Administrateur
        </span>
      </div>

      <div className="flex items-center gap-4">
        <div className="text-right hidden sm:block">
          <div className="text-xs font-semibold text-slate-800">{userName || "Super Admin"}</div>
          <div className="text-[11px] text-slate-500">{userEmail || ""}</div>
        </div>

        <button
          onClick={handleLogout}
          className="p-2 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
          title="Se déconnecter"
          aria-label="Se déconnecter"
        >
          <LogOut className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
}
