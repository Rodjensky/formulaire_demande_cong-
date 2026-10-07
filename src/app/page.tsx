import React from "react";
import { LeaveRequestForm } from "@/components/forms/LeaveRequestForm";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-between py-6 sm:py-10 px-4 sm:px-6">
      <main className="flex-1 max-w-3xl w-full mx-auto">
        <LeaveRequestForm />
      </main>

      <footer className="py-6 text-center text-xs text-slate-400">
        © {new Date().getFullYear()} Plateforme de Gestion des Demandes de Congé
      </footer>
    </div>
  );
}
