import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import Navbar from "@/components/ui/NavBar";
import Link from "next/link";

const MOTIVO_LABELS: Record<string, string> = {
  crescimento: "Crescimento",
  substituicao: "Substituição",
  nova_area: "Nova área",
};

function relativeDate(date: Date) {
  const now = new Date();
  const diff = Math.floor((now.getTime() - date.getTime()) / 1000);
  if (diff < 60) return "agora";
  if (diff < 3600) return `há ${Math.floor(diff / 60)} min`;
  if (diff < 86400) return `há ${Math.floor(diff / 3600)} h`;
  if (diff < 86400 * 7) return `há ${Math.floor(diff / 86400)} dia${Math.floor(diff / 86400) !== 1 ? "s" : ""}`;
  return date.toLocaleDateString("pt-BR", { day: "2-digit", month: "short" });
}

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);
  const user = session?.user as any;

  if (!user?.email) redirect("/auth/login");
  if (!user?.companyId) redirect("/onboarding");

  const company = await prisma.company.findUnique({
    where: { id: user.companyId },
  });

  if (!company) redirect("/onboarding");

  const [jobsCount, candidatesCount, matchesCount, jobs] = await Promise.all([
    prisma.job.count({ where: { companyId: company.id } }),
    prisma.candidate.count({ where: { companyId: company.id } }),
    prisma.matchReport.count({ where: { job: { companyId: company.id } } }),
    prisma.job.findMany({
      where: { companyId: company.id },
      orderBy: { createdAt: "desc" },
      include: {
        _count: { select: { candidates: true } },
        matchReports: {
          orderBy: { createdAt: "desc" },
          take: 1,
          select: { createdAt: true },
        },
        candidates: {
          select: { testCompletedAt: true },
        },
      },
    }),
  ]);

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-[#F5F7F0] p-4 md:p-8">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-between mb-6 md:mb-8 gap-4">
            <div>
              <h1 className="text-xl md:text-2xl font-bold text-gray-900">Dashboard</h1>
              <p className="text-gray-500 text-sm mt-0.5">{company.razaoSocial}</p>
            </div>
            <Link
              href="/vagas/nova"
              className="bg-[#C4FF57] text-[#4A5452] px-4 py-2.5 rounded-xl text-sm font-bold hover:bg-[#b3ee46] transition flex-shrink-0"
              style={{ minHeight: "44px", display: "flex", alignItems: "center" }}
            >
              + Nova Vaga
            </Link>
          </div>

          {/* Stats — 1 col mobile, 3 col md+ */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 md:gap-5 mb-6 md:mb-8">
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">Vagas ativas</p>
              <p className="text-3xl font-bold text-gray-900">{jobsCount}</p>
            </div>
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">Candidatos em processo</p>
              <p className="text-3xl font-bold text-gray-900">{candidatesCount}</p>
            </div>
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">Análises realizadas</p>
              <p className="text-3xl font-bold text-gray-900">{matchesCount}</p>
            </div>
          </div>

          <div>
            <h2 className="text-sm font-bold text-[#4A5452] uppercase tracking-wide mb-4">Vagas</h2>

            {jobs.length === 0 ? (
              <div className="bg-white rounded-xl border border-gray-200 p-8 text-center">
                <p className="text-gray-500 mb-4">Nenhuma vaga criada ainda</p>
                <Link
                  href="/vagas/nova"
                  className="bg-[#C4FF57] text-[#4A5452] px-6 py-3 rounded-xl text-sm font-bold hover:bg-[#b3ee46] transition inline-flex items-center"
                  style={{ minHeight: "48px" }}
                >
                  Criar primeira vaga
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {jobs.map((job) => {
                  const total = job._count.candidates;
                  const done = job.candidates.filter((c) => c.testCompletedAt).length;
                  const pending = total - done;
                  const lastMatch = job.matchReports[0]?.createdAt ?? null;
                  const noCandidates = total === 0;

                  return (
                    <Link
                      key={job.id}
                      href={`/vagas/${job.id}`}
                      className="bg-white rounded-xl border border-gray-200 p-5 hover:border-[#4A5452] hover:shadow-sm transition group block"
                    >
                      <div className="flex items-start justify-between gap-3 mb-3">
                        <h3 className="font-semibold text-gray-900 text-base group-hover:text-[#4A5452] transition leading-tight">
                          {job.titulo}
                        </h3>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          {noCandidates && (
                            <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-orange-100 text-orange-600">
                              Sem candidatos
                            </span>
                          )}
                          <span
                            className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                              job.status === "active"
                                ? "bg-[#C4FF57] text-[#4A5452]"
                                : "bg-gray-100 text-gray-500"
                            }`}
                          >
                            {job.status === "active" ? "Ativa" : job.status}
                          </span>
                        </div>
                      </div>

                      {job.motivo && (
                        <p className="text-xs text-gray-400 mb-3">
                          {MOTIVO_LABELS[job.motivo] ?? job.motivo}
                        </p>
                      )}

                      <div className="flex items-center justify-between text-xs text-gray-500 gap-2 flex-wrap">
                        <div className="flex items-center gap-3">
                          {total > 0 ? (
                            <>
                              <span>
                                {total} candidato{total !== 1 ? "s" : ""}
                              </span>
                              {done > 0 && (
                                <span className="text-green-600 font-medium">
                                  {done} concluíd{done !== 1 ? "os" : "o"}
                                </span>
                              )}
                              {pending > 0 && (
                                <span className="text-amber-600">
                                  {pending} pendente{pending !== 1 ? "s" : ""}
                                </span>
                              )}
                            </>
                          ) : (
                            <span className="text-gray-400">—</span>
                          )}
                        </div>

                        <div className="flex items-center gap-2">
                          {lastMatch && (
                            <span className="text-gray-400">
                              Match: {relativeDate(lastMatch)}
                            </span>
                          )}
                          <span className="text-gray-300">·</span>
                          <span>
                            {new Date(job.createdAt).toLocaleDateString("pt-BR", {
                              day: "2-digit",
                              month: "short",
                            })}
                          </span>
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </main>
    </>
  );
}
