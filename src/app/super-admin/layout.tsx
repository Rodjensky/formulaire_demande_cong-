import { getSession } from "@/lib/auth/session";
import { redirect } from "next/navigation";
import { SuperAdminSidebar } from "@/components/super-admin/SuperAdminSidebar";
import { SuperAdminHeader } from "@/components/super-admin/SuperAdminHeader";

export default async function SuperAdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();

  if (!session) {
    redirect("/login");
  }

  if (session.role !== "SUPER_ADMIN") {
    redirect("/admin/dashboard");
  }

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden">
      <SuperAdminSidebar />
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <SuperAdminHeader userName={session.name} userEmail={session.email} />
        <main className="flex-1 overflow-y-auto p-4 sm:p-8">{children}</main>
      </div>
    </div>
  );
}
