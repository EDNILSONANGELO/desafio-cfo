import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import { ProfessorSidebar, ProfessorMobileNav } from "@/components/layout/ProfessorSidebar";
import { TopBar } from "@/components/layout/TopBar";
import { PoloProvider } from "@/contexts/PoloContext";
import { PoloSelector } from "@/components/layout/PoloSelector";
import { NoClassBanner } from "@/components/layout/NoClassBanner";

export default async function ProfessorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();
  if (!session || session.role !== "teacher") redirect("/login");

  const isMaster = session.isMaster ?? false;
  const polo = session.polo ?? null;

  return (
    <PoloProvider professorPolo={polo} isMaster={isMaster} currentClassId={session.classId}>
      <div className="flex h-screen overflow-hidden bg-cfo-bg">
        <ProfessorSidebar isMaster={isMaster} polo={polo ?? undefined} currentClassId={session.classId} />
        <div className="flex flex-1 flex-col overflow-hidden">
          <TopBar
            name={session.name}
            role="teacher"
            subtitle={!isMaster && !polo ? "Painel Administrador" : undefined}
            isMaster={isMaster}
            polo={polo ?? undefined}
          />
          <main className="flex-1 overflow-y-auto pb-20 lg:pb-6">
            <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
              {/* Seletor global de polo — visível em todas as páginas do professor */}
              <PoloSelector />
              {/* Aviso quando nenhuma turma está ativa */}
              <NoClassBanner />
              {children}
            </div>
          </main>
        </div>
        <ProfessorMobileNav isMaster={isMaster} />
      </div>
    </PoloProvider>
  );
}
