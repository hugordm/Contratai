import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";
import { anthropic } from "@/lib/anthropic";

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

  const messages = await prisma.chatMessage.findMany({
    where: { jobId, companyId: user.companyId },
    orderBy: { createdAt: "asc" },
    take: 50,
  });

  return NextResponse.json(messages);
}

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
  const { message: userMessage } = await req.json();

  if (!userMessage?.trim()) {
    return NextResponse.json({ error: "Mensagem vazia" }, { status: 400 });
  }

  const job = await prisma.job.findFirst({
    where: { id: jobId, companyId: user.companyId },
    include: {
      company: true,
      candidates: {
        include: {
          matchReports: { orderBy: { rankingPosition: "asc" }, take: 1 },
        },
      },
    },
  });

  if (!job) {
    return NextResponse.json({ error: "Vaga não encontrada" }, { status: 404 });
  }

  const candidatePrMap = new Map<string, any>();
  if (job.candidates.length > 0) {
    const prs = await prisma.personalityResult.findMany({
      where: {
        companyId: user.companyId,
        subjectType: "candidate",
        subjectId: { in: job.candidates.map((c) => c.id) },
      },
      orderBy: { createdAt: "desc" },
    });
    for (const pr of prs) {
      if (pr.subjectId && !candidatePrMap.has(pr.subjectId)) {
        candidatePrMap.set(pr.subjectId, pr);
      }
    }
  }

  await prisma.chatMessage.create({
    data: {
      companyId: user.companyId,
      jobId,
      role: "user",
      content: userMessage.trim(),
    },
  });

  const history = await prisma.chatMessage.findMany({
    where: { jobId, companyId: user.companyId },
    orderBy: { createdAt: "asc" },
    take: 20,
  });

  const company = job.company;
  const ctx = company.contextoJson as any;

  const candidatesSummary = job.candidates
    .map((c) => {
      const disc = (candidatePrMap.get(c.id)?.discJson) as any;
      const match = c.matchReports[0];
      const relatorio = match?.relatorioJson as any;
      let summary = `- ${c.nome} (${c.email})`;
      if (disc) {
        summary += ` | DISC: ${disc.dominant} (D=${disc.percentages?.D}% I=${disc.percentages?.I}% S=${disc.percentages?.S}% C=${disc.percentages?.C}%)`;
      } else {
        summary += ` | DISC: aguardando`;
      }
      if (relatorio) {
        summary += ` | Match: ${relatorio.matchScore}/100 (pos. ${match?.rankingPosition})`;
      }
      return summary;
    })
    .join("\n");

  const systemPrompt = `Você é um assistente de RH especializado, auxiliando o time de recrutamento da empresa ${company.razaoSocial}.

CONTEXTO DA EMPRESA:
- Razão Social: ${company.razaoSocial}
- Perfil: ${company.perfilRitmo ?? "Não informado"}
- Contexto atual: ${company.contextoEmpresa ?? "Não informado"}
- Valores: ${company.valores?.join(", ") ?? "Não informado"}${ctx?.desafiosInternos ? `\n- Desafios internos: ${ctx.desafiosInternos}` : ""}${ctx?.estiloLideranca ? `\n- Estilo de liderança: ${ctx.estiloLideranca}` : ""}

VAGA EM ANÁLISE:
- Cargo: ${job.titulo}
- Motivo: ${job.motivo ?? "Não informado"}
- Responsabilidades: ${job.responsabilidades ?? "Não informado"}
- Metas (90 dias): ${job.metas ?? "Não informado"}

CANDIDATOS (${job.candidates.length} no total):
${candidatesSummary || "Nenhum candidato adicionado ainda"}

Seja direto, prático e use linguagem profissional mas acessível. Foque em insights acionáveis sobre os candidatos, a vaga e o processo seletivo. Responda em português brasileiro.`;

  const anthropicMessages = history.slice(0, -1).map((m: any) => ({
    role: m.role as "user" | "assistant",
    content: m.content,
  }));
  anthropicMessages.push({ role: "user", content: userMessage.trim() });

  const encoder = new TextEncoder();
  let fullText = "";

  const readable = new ReadableStream({
    async start(controller) {
      try {
        const stream = anthropic.messages.stream({
          model: "claude-haiku-4-5-20251001",
          max_tokens: 1000,
          system: systemPrompt,
          messages: anthropicMessages,
        });

        stream.on("text", (text) => {
          fullText += text;
          controller.enqueue(encoder.encode(text));
        });

        await stream.finalMessage();

        await prisma.chatMessage.create({
          data: {
            companyId: user.companyId,
            jobId,
            role: "assistant",
            content: fullText,
          },
        });
      } catch (err) {
        controller.enqueue(encoder.encode("\n[Erro ao gerar resposta]"));
      } finally {
        controller.close();
      }
    },
  });

  return new Response(readable, {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}
