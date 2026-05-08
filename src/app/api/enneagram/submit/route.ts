import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { calculateEnneagram } from "@/lib/enneagram/scoring";

export async function POST(req: NextRequest) {
  let body: { token?: string; answers?: Record<number, number> };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Corpo da requisição inválido" }, { status: 400 });
  }

  const { token, answers } = body;

  if (!token || !answers) {
    return NextResponse.json({ error: "Dados inválidos" }, { status: 400 });
  }

  try {
    const testLink = await prisma.testLink.findUnique({
      where: { token },
      include: { candidate: true },
    });

    if (!testLink) {
      return NextResponse.json({ error: "Link inválido" }, { status: 404 });
    }

    if (testLink.completedAt) {
      return NextResponse.json({ error: "Teste já finalizado" }, { status: 409 });
    }

    if (testLink.expiresAt < new Date()) {
      return NextResponse.json({ error: "Link expirado" }, { status: 410 });
    }

    const answeredCount = Object.keys(answers).length;
    if (answeredCount < 36) {
      return NextResponse.json(
        { error: `Responda todas as perguntas (${answeredCount}/36)` },
        { status: 400 }
      );
    }

    let subjectId: string;
    let subjectType: string;
    const companyId = testLink.companyId;

    if (testLink.candidateId) {
      subjectId = testLink.candidateId;
      subjectType = "candidate";
    } else if (testLink.type === "employee") {
      const node = await prisma.organogramaNode.findUnique({
        where: { testLinkToken: token },
        select: { id: true, companyId: true },
      });
      if (!node || node.companyId !== companyId) {
        return NextResponse.json({ error: "Colaborador não identificado" }, { status: 400 });
      }
      subjectId = node.id;
      subjectType = "employee";
    } else {
      return NextResponse.json({ error: "Colaborador não identificado" }, { status: 400 });
    }

    // Find existing PersonalityResult created by DISC submit for this specific subject
    const existing = await prisma.personalityResult.findFirst({
      where: { companyId, subjectId, subjectType },
      orderBy: { createdAt: "desc" },
    });

    if (!existing || !existing.discJson) {
      return NextResponse.json(
        { error: "Complete o teste DISC antes do Eneagrama" },
        { status: 422 }
      );
    }

    const enneagram = calculateEnneagram(answers);

    await prisma.personalityResult.update({
      where: { id: existing.id },
      data: { enneagramJson: enneagram as object },
    });

    // completedAt and emails are handled by mbti/submit (final step)
    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("[enneagram/submit] Erro:", message, error);
    return NextResponse.json({ error: "Erro ao salvar resultado Eneagrama", detail: message }, { status: 500 });
  }
}
