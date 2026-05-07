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

  const job = await prisma.job.findFirst({
    where: { id: jobId, companyId: user.companyId },
    include: { company: true },
  });

  if (!job) {
    return NextResponse.json({ error: "Vaga não encontrada" }, { status: 404 });
  }

  const company = job.company;
  const ctx = company.contextoJson as any;

  const perfilLabels: Record<string, string> = {
    startup: "Startup de alto crescimento",
    consolidada: "Empresa consolidada",
    reestruturacao: "Empresa em reestruturação",
    outro: "Outro",
  };

  const motivoLabels: Record<string, string> = {
    crescimento: "Crescimento da equipe",
    substituicao: "Substituição de colaborador",
    nova_area: "Nova área / departamento",
  };

  const userContent = `EMPRESA:
- Razão Social: ${company.razaoSocial}
- Perfil: ${perfilLabels[company.perfilRitmo ?? ""] ?? company.perfilRitmo ?? "Não informado"}
- Contexto atual: ${company.contextoEmpresa ?? "Não informado"}
- Valores: ${company.valores?.length ? company.valores.join(", ") : "Não informado"}${ctx?.desafiosInternos ? `\n- Desafios internos: ${ctx.desafiosInternos}` : ""}${ctx?.estiloLideranca ? `\n- Estilo de liderança: ${ctx.estiloLideranca}` : ""}

VAGA:
- Cargo: ${job.titulo}
- Motivo: ${motivoLabels[job.motivo ?? ""] ?? job.motivo ?? "Não informado"}
- Responsabilidades: ${job.responsabilidades ?? "Não informado"}
- Metas (primeiros 90 dias): ${job.metas ?? "Não informado"}

Perfis DISC para referência:
D (Dominância): orientado a resultados, decisivo, direto
I (Influência): comunicativo, sociável, otimista
S (Estabilidade): paciente, colaborativo, leal
C (Conformidade): analítico, preciso, sistemático

Gere EXCLUSIVAMENTE o JSON abaixo (sem texto extra, sem markdown, sem backticks):
{
  "descricao": "Texto de 2-3 parágrafos sobre a vaga ao candidato, linguagem humanizada",
  "jobDescription": "Job description completa com: sobre a empresa, sobre o cargo, responsabilidades, requisitos, benefícios. Use \\n\\n entre seções e hifens para listas",
  "salaryMin": número inteiro (faixa mínima mensal em R$ para este cargo no Brasil),
  "salaryMax": número inteiro (faixa máxima mensal),
  "salaryBreakdown": "Justificativa da faixa em 2-3 frases considerando cargo, senioridade esperada e mercado",
  "perguntas": ["pergunta 1", "pergunta 2", "pergunta 3", "pergunta 4", "pergunta 5"],
  "perfilIdeal": {
    "disc": ["X"] ou ["X","Y"] (1 a 2 perfis mais adequados entre D, I, S, C),
    "justificativa": "Por que esses perfis são ideais para este cargo nesta empresa"
  }
}`;

  const message = await anthropic.messages.create({
    model: "claude-sonnet-4-5",
    max_tokens: 4000,
    system:
      "Você é um especialista sênior em RH e talent acquisition no mercado brasileiro. Responda EXCLUSIVAMENTE com JSON válido. Não use markdown, não use backticks, não escreva nenhum texto fora do objeto JSON.",
    messages: [{ role: "user", content: userContent }],
  });

  const block = message.content[0];
  if (block.type !== "text") {
    return NextResponse.json({ error: "Resposta inválida da IA" }, { status: 500 });
  }

  let parsed: any;
  try {
    const cleanJson = block.text
      .trim()
      .replace(/^```json\n?/, '')
      .replace(/^```\n?/, '')
      .replace(/\n?```$/, '')
      .trim();
    parsed = JSON.parse(cleanJson);
  } catch {
    return NextResponse.json(
      { error: "Erro ao processar resposta da IA. Tente novamente." },
      { status: 500 }
    );
  }

  await prisma.job.update({
    where: { id: jobId },
    data: {
      jdGerada: parsed.jobDescription,
      salaryMin: parsed.salaryMin,
      salaryMax: parsed.salaryMax,
      perfilIdealJson: parsed,
    },
  });

  return NextResponse.json(parsed);
}
