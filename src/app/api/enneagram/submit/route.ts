import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { calculateEnneagram } from "@/lib/enneagram/scoring";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { token, answers } = body as {
    token: string;
    answers: Record<number, number>;
  };

  if (!token || !answers) {
    return NextResponse.json({ error: "Dados inválidos" }, { status: 400 });
  }

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

  // Find existing PersonalityResult created by DISC submit
  const existing = await prisma.personalityResult.findFirst({
    where: {
      companyId: testLink.companyId,
      ...(testLink.candidateId ? { subjectId: testLink.candidateId } : {}),
    },
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
}
