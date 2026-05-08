import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import { ProfessorSidebar, ProfessorMobileNav } from "@/components/layout/ProfessorSidebar";
import { TopBar } from "@/components/layout/TopBar";

export default async function ProfessorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();
  if (!session || session.role !== "teacher") redirect("/login");

  return (
    <div className="flex h-screen overflow-hidden bg-cfo-bg">
      <ProfessorSidebar />
      <div className="flex flex-1 flex-col overflow-hidden">
        <TopBar name={session.name} role="teacher" subtitle="Painel Administrador" />
        <main className="flex-1 overflow-y-auto pb-20 lg:pb-6">
          <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6">{children}</div>
        </main>
      </div>
      <ProfessorMobileNav />
    </div>
  );
}
