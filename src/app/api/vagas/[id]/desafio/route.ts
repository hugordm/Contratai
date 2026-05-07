import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";
import { anthropic } from "@/lib/anthropic";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  const user = session?.user as any;

  if (!user?.email || !user?.companyId) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const { id: jobId } = await params;
  const { reportId } = await req.json();

  if (!reportId) {
    return NextResponse.json({ error: "reportId obrigatório" }, { status: 400 });
  }

  const report = await prisma.matchReport.findFirst({
    where: { id: reportId, jobId, job: { companyId: user.companyId } },
    include: {
      candidate: true,
      job: { include: { company: true } },
    },
  });

  if (!report) {
    return NextResponse.json({ error: "Relatório não encontrado" }, { status: 404 });
  }

  const job = report.job;
  const relatorio = report.relatorioJson as any;

  const prompt = `Você é um especialista em RH e desenvolvimento de talentos no mercado brasileiro.

Crie um desafio técnico prático para o candidato ${report.candidate.nome}, que está sendo avaliado para a vaga de ${job.titulo} na empresa ${job.company.razaoSocial}.

CONTEXTO DA VAGA:
- Responsabilidades: ${job.responsabilidades ?? "Não informado"}
- Metas (90 dias): ${job.metas ?? "Não informado"}

PERFIL DO CANDIDATO:
- Match Score: ${report.matchScore}/100
- Pontos fortes: ${relatorio?.pontosFortres?.join(", ") ?? "Não disponível"}
- Pontos de atenção: ${relatorio?.pontosAtencao?.join(", ") ?? "Não disponível"}

O desafio deve:
- Ter duração de 2 a 4 horas
- Ser prático e relevante para o cargo
- Avaliar as competências mais críticas para esta vaga
- Incluir contexto claro e entregáveis definidos
- Ser personalizado para o perfil deste candidato

Gere EXCLUSIVAMENTE o JSON abaixo (sem texto extra, sem markdown, sem backticks):
{
  "titulo": "<título do desafio>",
  "duracao": "<ex: 2-3 horas>",
  "objetivo": "<objetivo em 1-2 frases>",
  "contexto": "<contexto do desafio — situação fictícia ou real>",
  "tarefas": ["<tarefa 1>", "<tarefa 2>", "<tarefa 3>"],
  "entregaveis": ["<entregável 1>", "<entregável 2>"],
  "criteriosAvaliacao": ["<critério 1>", "<critério 2>", "<critério 3>"],
  "observacoes": "<dicas para o avaliador sobre o que observar neste candidato especificamente>"
}`;

  const message = await anthropic.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 1500,
    system:
      "Você é um especialista sênior em RH. Responda EXCLUSIVAMENTE com JSON válido. Não use markdown, não use backticks.",
    messages: [{ role: "user", content: prompt }],
  });

  const block = message.content[0];
  if (block.type !== "text") {
    return NextResponse.json({ error: "Resposta inválida da IA" }, { status: 500 });
  }

  let desafio: any;
  try {
    const cleanJson = block.text
      .trim()
      .replace(/^```json\n?/, '')
      .replace(/^```\n?/, '')
      .replace(/\n?```$/, '')
      .trim();
    desafio = JSON.parse(cleanJson);
  } catch {
    return NextResponse.json({ error: "Erro ao processar resposta da IA" }, { status: 500 });
  }

  const currentRelatorio = (report.relatorioJson as any) ?? {};
  await prisma.matchReport.update({
    where: { id: reportId },
    data: {
      relatorioJson: { ...currentRelatorio, desafioTecnico: desafio },
    },
  });

  return NextResponse.json({ desafio });
}
