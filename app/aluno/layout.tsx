import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import { StudentSidebar, StudentMobileNav } from "@/components/layout/StudentSidebar";
import { TopBar } from "@/components/layout/TopBar";
import { InactivityGuard } from "@/components/layout/InactivityGuard";

export default async function StudentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();
  if (!session || session.role !== "student") redirect("/login");

  // Primeiro acesso: força troca de senha antes de qualquer outra página
  if (session.firstAccess) redirect("/trocar-senha");

  return (
    <div className="flex h-screen overflow-hidden bg-cfo-bg">
      <InactivityGuard />
      <StudentSidebar />
      <div className="flex flex-1 flex-col overflow-hidden">
        <TopBar name={session.name} role="student" subtitle={`RA ${session.identifier}`} />
        <main className="flex-1 overflow-y-auto pb-20 lg:pb-6">
          <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6">{children}</div>
        </main>
      </div>
      <StudentMobileNav />
    </div>
  );
}
