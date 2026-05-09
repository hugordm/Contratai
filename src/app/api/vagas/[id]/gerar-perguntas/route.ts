import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";
import { anthropic } from "@/lib/anthropic";

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

  const company = job.company;
  const ctx = company.contextoJson as any;

  const motivoLabels: Record<string, string> = {
    crescimento: "Crescimento da equipe",
    substituicao: "Substituição de colaborador",
    nova_area: "Nova área / departamento",
  };

  const userContent = `Você é especialista em RH no mercado brasileiro. Gere entre 5 e 8 perguntas de triagem para avaliar candidatos à vaga abaixo. As perguntas devem ser específicas para o cargo e relevantes para identificar fit cultural e técnico.

EMPRESA: ${company.razaoSocial}
Contexto: ${company.contextoEmpresa ?? "Não informado"}
Valores: ${company.valores?.length ? company.valores.join(", ") : "Não informado"}${ctx?.desafiosInternos ? `\nDesafios: ${ctx.desafiosInternos}` : ""}

VAGA: ${job.titulo}
Motivo: ${motivoLabels[job.motivo ?? ""] ?? job.motivo ?? "Não informado"}
Responsabilidades: ${job.responsabilidades ?? "Não informado"}
Metas (90 dias): ${job.metas ?? "Não informado"}

Gere EXCLUSIVAMENTE o JSON abaixo (sem texto extra, sem markdown, sem backticks):
{"perguntas":["pergunta 1","pergunta 2","pergunta 3","pergunta 4","pergunta 5"]}`;

  const message = await anthropic.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 1024,
    system:
      "Responda EXCLUSIVAMENTE com JSON válido. Não use markdown, não use backticks, não escreva nenhum texto fora do objeto JSON.",
    messages: [{ role: "user", content: userContent }],
  });

  const block = message.content[0];
  if (block.type !== "text") {
    return NextResponse.json({ error: "Resposta inválida da IA" }, { status: 500 });
  }

  let perguntas: string[];
  try {
    const cleanJson = block.text
      .trim()
      .replace(/^```json\n?/, "")
      .replace(/^```\n?/, "")
      .replace(/\n?```$/, "")
      .trim();
    const parsed = JSON.parse(cleanJson);
    if (!Array.isArray(parsed.perguntas) || parsed.perguntas.length === 0) {
      throw new Error("perguntas inválidas");
    }
    perguntas = parsed.perguntas as string[];
  } catch {
    return NextResponse.json(
      { error: "Erro ao processar resposta da IA. Tente novamente." },
      { status: 500 }
    );
  }

  // Merge into existing perfilIdealJson, preserving other fields (disc profile etc.)
  const existing = (job.perfilIdealJson as Record<string, unknown>) ?? {};
  await prisma.job.update({
    where: { id: jobId },
    data: { perfilIdealJson: { ...existing, perguntas } },
  });

  return NextResponse.json({ perguntas });
}
