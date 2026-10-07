import { getSession } from "@/lib/auth/session";
import { redirect } from "next/navigation";
import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { AdminHeader } from "@/components/admin/AdminHeader";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();

  if (!session) {
    redirect("/login");
  }

  if (session.role === "SUPER_ADMIN") {
    redirect("/super-admin");
  }

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden">
      <AdminSidebar
        role={session.role}
        organizationName={session.organizationName}
      />
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <AdminHeader
          userName={session.name}
          userEmail={session.email}
          role={session.role}
        />
        <main className="flex-1 overflow-y-auto p-4 sm:p-8">{children}</main>
      </div>
    </div>
  );
}
