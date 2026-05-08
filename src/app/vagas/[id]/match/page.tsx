import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { redirect, notFound } from "next/navigation";
import Navbar from "@/components/ui/NavBar";
import MatchClient from "./MatchClient";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function MatchPage({ params }: Props) {
  const session = await getServerSession(authOptions);
  const user = session?.user as any;

  if (!user?.email || !user?.companyId) redirect("/auth/login");

  const { id: jobId } = await params;

  const job = await prisma.job.findFirst({
    where: { id: jobId, companyId: user.companyId },
    select: { id: true, titulo: true, motivo: true, responsabilidades: true, metas: true, liderId: true, lideresJson: true },
  });

  if (!job) return notFound();

  // Resolve leader name from liderId or lideresJson fallback
  const primaryLiderId: string | null =
    job.liderId ??
    (Array.isArray(job.lideresJson) ? (job.lideresJson as string[])[0] : null) ??
    null;

  let liderNome: string | null = null;
  if (primaryLiderId) {
    const leaderNode = await prisma.organogramaNode.findFirst({
      where: { id: primaryLiderId },
      select: { nome: true },
    });
    liderNome = leaderNode?.nome ?? null;
  }

  const candidates = await prisma.candidate.findMany({
    where: { jobId, companyId: user.companyId },
    select: { id: true, nome: true, email: true },
  });

  const candidateIds = candidates.map((c) => c.id);
  const prsForDisc = candidateIds.length > 0
    ? await prisma.personalityResult.findMany({
        where: {
          companyId: user.companyId,
          subjectType: "candidate",
          subjectId: { in: candidateIds },
        },
        select: { subjectId: true },
      })
    : [];
  const discCompletedIds = new Set(prsForDisc.map((pr) => pr.subjectId).filter(Boolean));

  const reports = await prisma.matchReport.findMany({
    where: { jobId, job: { companyId: user.companyId } },
    orderBy: { rankingPosition: "asc" },
    include: { candidate: { select: { nome: true, email: true } } },
  });

  const initialReports = reports.map((r: any) => ({
    id: r.id,
    candidateId: r.candidateId,
    candidateNome: r.candidate.nome,
    candidateEmail: r.candidate.email,
    rankingPosition: r.rankingPosition,
    matchScore: r.matchScore,
    relatorio: r.relatorioJson as any,
  }));

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-[#F5F7F0] p-3 sm:p-4 md:p-8 pb-28">
        <MatchClient
          jobId={jobId}
          jobTitulo={job.titulo}
          totalCandidates={candidates.length}
          discCompletedCount={discCompletedIds.size}
          initialReports={initialReports}
          liderNome={liderNome}
          hasLider={!!primaryLiderId}
        />
      </main>
    </>
  );
}
