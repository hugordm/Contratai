import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

type DiscType = "D" | "I" | "S" | "C";

function calculateDISC(answers: Record<number, DiscType>) {
  const counts: Record<DiscType, number> = { D: 0, I: 0, S: 0, C: 0 };
  Object.values(answers).forEach((type: any) => {
    counts[type as DiscType]++;
  });
  const total = Object.values(counts).reduce((a: any, b: any) => a + b, 0);
  const percentages = {
    D: Math.round((counts.D / total) * 100),
    I: Math.round((counts.I / total) * 100),
    S: Math.round((counts.S / total) * 100),
    C: Math.round((counts.C / total) * 100),
  };
  const dominant = (Object.entries(counts).sort((a, b) => b[1] - a[1])[0][0]) as DiscType;
  return { counts, percentages, dominant };
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { token, answers } = body as {
    token: string;
    answers: Record<number, DiscType>;
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
    return NextResponse.json({ error: "Teste já realizado" }, { status: 409 });
  }

  if (testLink.expiresAt < new Date()) {
    return NextResponse.json({ error: "Link expirado" }, { status: 410 });
  }

  const answeredCount = Object.keys(answers).length;
  if (answeredCount < 28) {
    return NextResponse.json(
      { error: `Responda todas as perguntas (${answeredCount}/28)` },
      { status: 400 }
    );
  }

  const disc = calculateDISC(answers);

  let subjectType = "anonymous";
  let nodeId: string | undefined;

  if (testLink.candidateId) {
    subjectType = "candidate";
  } else if (testLink.type === "employee") {
    subjectType = "employee";
    const node = await prisma.organogramaNode.findFirst({
      where: { testLinkToken: token, companyId: testLink.companyId },
      select: { id: true },
    });
    if (node) nodeId = node.id;
  }

  const result = await prisma.personalityResult.create({
    data: {
      companyId: testLink.companyId,
      subjectId: testLink.candidateId ?? undefined,
      subjectType,
      nodeId,
      discJson: {
        ...disc,
        answers,
      },
    },
  });

  // completedAt is set by enneagram/submit (final step)
  return NextResponse.json({ resultId: result.id });
}
