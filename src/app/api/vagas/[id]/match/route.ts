import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";
import { anthropic } from "@/lib/anthropic";

const MOTIVO_LABELS: Record<string, string> = {
  crescimento: "Crescimento da equipe",
  substituicao: "Substituição de colaborador",
  nova_area: "Nova área / departamento",
};

const PERFIL_LABELS: Record<string, string> = {
  startup: "Startup de alto crescimento",
  consolidada: "Empresa consolidada",
  reestruturacao: "Empresa em reestruturação",
  outro: "Outro",
};

const ENNEAGRAM_NAMES: Record<number, string> = {
  1: "Perfeccionista", 2: "Prestativo", 3: "Realizador", 4: "Individualista",
  5: "Investigador", 6: "Leal", 7: "Entusiasta", 8: "Desafiador", 9: "Pacificador",
};

async function analyzeCandidate(
  candidateId: string,
  candidateName: string,
  discJson: any,
  enneagramJson: any,
  mbtiJson: any,
  jobContext: string,
  leadersContext: string,
  hasLeader: boolean
): Promise<any> {
  const disc = discJson as any;
  const percentages = disc?.percentages ?? {};
  const dominant = disc?.dominant ?? "?";

  const enn = enneagramJson as any;
  const ennDominant = enn?.dominant;
  const ennWing = enn?.wing;
  const ennLine = ennDominant
    ? `- Tipo Eneagrama: ${ennDominant} (${ENNEAGRAM_NAMES[ennDominant] ?? ""})${ennWing ? ` — Asa ${ennDominant}w${ennWing}` : ""}`
    : "- Tipo Eneagrama: não realizado";

  const mbti = mbtiJson as any;
  const mbtiLine = mbti?.type
    ? `- 16 Personalidades (MBTI): ${mbti.type}`
    : "- 16 Personalidades: não realizado";

  const leaderFields = hasLeader
    ? `  "compatibilidadeLider": "<análise de 2-3 frases sobre como candidato e líder vão interagir considerando todos os perfis>",
  "pontosFortesDupla": ["<complementaridade 1>", "<complementaridade 2>", "<complementaridade 3>"],
  "riscosRelacionamento": ["<risco ou conflito potencial 1>", "<risco ou conflito potencial 2>"],`
    : `  "compatibilidadeLider": "Não aplicável — vaga sem líder direto cadastrado",
  "pontosFortesDupla": [],
  "riscosRelacionamento": [],`;

  const candidateContext = `CANDIDATO:
- Nome: ${candidateName}
- Perfil DISC dominante: ${dominant}
- Percentuais DISC: D=${percentages.D ?? 0}% | I=${percentages.I ?? 0}% | S=${percentages.S ?? 0}% | C=${percentages.C ?? 0}%
${ennLine}
${mbtiLine}

${jobContext}
${leadersContext}

Gere EXCLUSIVAMENTE o JSON abaixo (sem texto extra, sem markdown, sem backticks):
{
  "candidateId": "${candidateId}",
  "matchScore": <número 0-100>,
  "justificativa": "<análise de 3-4 frases sobre o fit geral deste candidato para esta vaga e empresa>",
  "pontosFortres": ["<ponto forte 1>", "<ponto forte 2>", "<ponto forte 3>"],
  "pontosAtencao": ["<ponto de atenção 1>", "<ponto de atenção 2>"],
  "comoDelegarTarefas": "<como delegar tarefas de forma eficaz para este perfil DISC específico>",
  "comoDarFeedback": "<como dar feedback construtivo para este perfil DISC>",
  "fitCultura": "<análise do fit cultural considerando os valores e ritmo da empresa>",
${leaderFields}
  "perguntasComplementares": ["<pergunta 1>", "<pergunta 2>", "<pergunta 3>"]
}`;

  const message = await anthropic.messages.create({
    model: "claude-sonnet-4-5",
    max_tokens: 1500,
    system:
      "Você é um especialista sênior em RH e psicologia organizacional no mercado brasileiro. Responda EXCLUSIVAMENTE com JSON válido. Não use markdown, não use backticks, não escreva nenhum texto fora do objeto JSON.",
    messages: [{ role: "user", content: candidateContext }],
  });

  const block = message.content[0];
  if (block.type !== "text") throw new Error("Resposta inválida da IA");

  const cleanJson = block.text
    .trim()
    .replace(/^```json\n?/, '')
    .replace(/^```\n?/, '')
    .replace(/\n?```$/, '')
    .trim();

  return JSON.parse(cleanJson);
}

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  const user = session?.user as any;

  if (!user?.email || !user?.companyId) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const { id: jobId } = await params;

  const job = await prisma.job.findFirst({
    where: { id: jobId, companyId: user.companyId },
    include: { company: true },
  });

  if (!job) {
    return NextResponse.json({ error: "Vaga não encontrada" }, { status: 404 });
  }

  const candidates = await prisma.candidate.findMany({
    where: { jobId, companyId: user.companyId },
    include: {
      personalityResults: {
        orderBy: { createdAt: "desc" },
        take: 1,
      },
    },
  });

  const withDisc = candidates.filter((c: any) => c.personalityResults.length > 0);

  if (withDisc.length === 0) {
    return NextResponse.json(
      { error: "Nenhum candidato completou o teste DISC" },
      { status: 422 }
    );
  }

  const company = job.company;
  const ctx = company.contextoJson as any;
  const perfilIdeal = job.perfilIdealJson as any;

  // Prefer liderId (new field), fallback to first entry of lideresJson for backward compat
  const lideresIds: string[] = Array.isArray(job.lideresJson) ? (job.lideresJson as string[]) : [];
  const primaryLiderId: string | null = job.liderId ?? lideresIds[0] ?? null;

  const jobContext = `EMPRESA:
- Razão Social: ${company.razaoSocial}
- Perfil/Ritmo: ${PERFIL_LABELS[company.perfilRitmo ?? ""] ?? company.perfilRitmo ?? "Não informado"}
- Contexto atual: ${company.contextoEmpresa ?? "Não informado"}
- Valores: ${company.valores?.length ? company.valores.join(", ") : "Não informado"}${ctx?.desafiosInternos ? `\n- Desafios internos: ${ctx.desafiosInternos}` : ""}${ctx?.estiloLideranca ? `\n- Estilo de liderança: ${ctx.estiloLideranca}` : ""}

VAGA:
- Cargo: ${job.titulo}
- Motivo: ${MOTIVO_LABELS[job.motivo ?? ""] ?? job.motivo ?? "Não informado"}
- Responsabilidades: ${job.responsabilidades ?? "Não informado"}
- Metas (90 dias): ${job.metas ?? "Não informado"}
- Perfil DISC ideal: ${perfilIdeal?.perfilIdeal ? JSON.stringify(perfilIdeal.perfilIdeal) : "Não definido"}`;

  let leadersContext = "";
  let liderNome: string | null = null;

  if (primaryLiderId) {
    const [leaderResult, leaderNode] = await Promise.all([
      prisma.personalityResult.findFirst({
        where: { companyId: user.companyId, nodeId: primaryLiderId },
        orderBy: { createdAt: "desc" },
      }),
      prisma.organogramaNode.findFirst({
        where: { id: primaryLiderId },
        select: { nome: true, cargo: true },
      }),
    ]);

    if (leaderNode) {
      liderNome = leaderNode.nome;
    }

    if (leaderResult?.discJson) {
      const disc = leaderResult.discJson as any;
      const enn = leaderResult.enneagramJson as any;
      const mbti = leaderResult.mbtiJson as any;

      const name = leaderNode ? `${leaderNode.nome} (${leaderNode.cargo})` : "Líder";

      const ennDominant = enn?.dominant;
      const ennWing = enn?.wing;
      const ennStr = ennDominant
        ? `${ennDominant} (${ENNEAGRAM_NAMES[ennDominant] ?? ""})${ennWing ? ` asa ${ennDominant}w${ennWing}` : ""}`
        : "não realizado";

      const mbtiStr = mbti?.type ?? "não realizado";

      leadersContext = `\nLÍDER DIRETO DA VAGA (para análise de compatibilidade com o candidato):
  - Nome: ${name}
  - DISC: ${disc?.dominant ?? "?"} | D=${disc?.percentages?.D ?? 0}% I=${disc?.percentages?.I ?? 0}% S=${disc?.percentages?.S ?? 0}% C=${disc?.percentages?.C ?? 0}%
  - Eneagrama: ${ennStr}
  - MBTI: ${mbtiStr}`;
    }
  }

  let results: any[];
  try {
    results = await Promise.all(
      withDisc.map((c: any) =>
        analyzeCandidate(
          c.id,
          c.nome,
          c.personalityResults[0].discJson,
          c.personalityResults[0].enneagramJson,
          c.personalityResults[0].mbtiJson,
          jobContext,
          leadersContext,
          !!leadersContext
        ).catch(() => null)
      )
    );
    results = results.filter(Boolean);
  } catch {
    return NextResponse.json(
      { error: "Erro ao processar análise com IA. Tente novamente." },
      { status: 500 }
    );
  }

  if (results.length === 0) {
    return NextResponse.json(
      { error: "A IA não conseguiu processar os candidatos. Tente novamente." },
      { status: 500 }
    );
  }

  const sorted = [...results].sort((a, b) => b.matchScore - a.matchScore);
  sorted.forEach((r: any, i: number) => {
    r.rankingPosition = i + 1;
  });

  const saved = await Promise.all(
    sorted.map((r: any) =>
      prisma.matchReport.upsert({
        where: {
          jobId_candidateId: { jobId, candidateId: r.candidateId },
        },
        create: {
          jobId,
          candidateId: r.candidateId,
          rankingPosition: r.rankingPosition,
          matchScore: r.matchScore,
          relatorioJson: r,
        },
        update: {
          rankingPosition: r.rankingPosition,
          matchScore: r.matchScore,
          relatorioJson: r,
        },
      })
    )
  );

  return NextResponse.json({
    liderNome,
    reports: saved.map((s: any) => ({
      id: s.id,
      candidateId: s.candidateId,
      rankingPosition: s.rankingPosition,
      matchScore: s.matchScore,
      relatorio: s.relatorioJson,
    })),
  });
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  const user = session?.user as any;

  if (!user?.email || !user?.companyId) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const { id: jobId } = await params;

  const reports = await prisma.matchReport.findMany({
    where: { jobId, job: { companyId: user.companyId } },
    orderBy: { rankingPosition: "asc" },
    include: { candidate: { select: { nome: true, email: true } } },
  });

  return NextResponse.json(
    reports.map((r: any) => ({
      id: r.id,
      candidateId: r.candidateId,
      candidateNome: r.candidate.nome,
      candidateEmail: r.candidate.email,
      rankingPosition: r.rankingPosition,
      matchScore: r.matchScore,
      relatorio: r.relatorioJson,
    }))
  );
}
