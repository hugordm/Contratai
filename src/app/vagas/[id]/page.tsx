import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { redirect, notFound } from "next/navigation";
import Navbar from "@/components/ui/NavBar";
import VagaClient from "./VagaClient";

interface Props {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ ajuda?: string }>;
}

export default async function VagaPage({ params, searchParams }: Props) {
  const session = await getServerSession(authOptions);
  const user = session?.user as any;

  if (!user?.email || !user?.companyId) redirect("/auth/login");

  const { id } = await params;
  const { ajuda } = await searchParams;

  const job = await prisma.job.findFirst({
    where: { id, companyId: user.companyId },
    include: {
      _count: { select: { candidates: true } },
    },
  });

  if (!job) return notFound();

  const primaryLiderId: string | null =
    job.liderId ??
    (Array.isArray(job.lideresJson) ? (job.lideresJson as string[])[0] : null) ??
    null;

  let liderNome: string | null = null;
  if (primaryLiderId) {
    const leaderNode = await prisma.organogramaNode.findFirst({
      where: { id: primaryLiderId },
      select: { nome: true, cargo: true },
    });
    if (leaderNode) {
      liderNome = `${leaderNode.nome} — ${leaderNode.cargo}`;
    }
  }

  const dbCandidates = await prisma.candidate.findMany({
    where: { jobId: id, companyId: user.companyId },
    orderBy: { createdAt: "desc" },
    include: {
      testLinks: { orderBy: { createdAt: "desc" }, take: 1 },
    },
  });

  const initialCandidates = dbCandidates.map((c: any) => {
    const latestLink = c.testLinks[0] ?? null;
    let testStatus: "none" | "pending" | "completed" = "none";
    if (latestLink) {
      testStatus = latestLink.completedAt ? "completed" : "pending";
    }
    return {
      id: c.id,
      nome: c.nome,
      email: c.email,
      linkedinUrl: c.linkedinUrl ?? null,
      testStatus,
      testToken: latestLink?.token ?? null,
    };
  });

  const perfilIdeal = job.perfilIdealJson as any;
  const initialJd =
    perfilIdeal && job.jdGerada
      ? {
          descricao: perfilIdeal.descricao ?? "",
          jobDescription: job.jdGerada,
          salaryMin: job.salaryMin ?? 0,
          salaryMax: job.salaryMax ?? 0,
          salaryBreakdown: perfilIdeal.salaryBreakdown ?? "",
          perguntas: perfilIdeal.perguntas ?? [],
          perfilIdeal: perfilIdeal.perfilIdeal ?? { disc: [], justificativa: "" },
        }
      : null;

  const criouComIA = ajuda === "ia";

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-[#F5F7F0] p-4 md:p-8">
        {criouComIA && (
          <div className="max-w-3xl mx-auto mb-6">
            <div className="bg-[#C4FF57] border border-[#b3ee46] rounded-2xl p-5 flex items-start gap-3">
              <span className="text-2xl">✨</span>
              <div>
                <p className="font-bold text-[#4A5452] text-base">Vaga criada com sucesso!</p>
                <p className="text-[#4A5452] text-sm mt-0.5">
                  Use a IA para gerar a descrição completa, faixa salarial e perfil DISC ideal para esta vaga.
                </p>
              </div>
            </div>
          </div>
        )}

        <VagaClient
          jobId={job.id}
          jobTitulo={job.titulo}
          jobMotivo={job.motivo}
          jobStatus={job.status}
          jobCreatedAt={job.createdAt.toISOString()}
          jobCandidateCount={job._count.candidates}
          jobResponsabilidades={job.responsabilidades}
          jobMetas={job.metas}
          initialJd={initialJd}
          initialCandidates={initialCandidates}
          criouComIA={criouComIA}
          liderNome={liderNome}
        />
      </main>
    </>
  );
}
