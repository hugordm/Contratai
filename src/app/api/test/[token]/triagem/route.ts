import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;

  let body: { respostas?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Corpo da requisição inválido" }, { status: 400 });
  }

  const { respostas } = body;

  if (!Array.isArray(respostas) || respostas.length === 0) {
    return NextResponse.json({ error: "Respostas inválidas" }, { status: 400 });
  }
  if (respostas.some((r) => typeof r !== "string" || !r.trim())) {
    return NextResponse.json({ error: "Todas as respostas são obrigatórias" }, { status: 400 });
  }

  const testLink = await prisma.testLink.findUnique({
    where: { token },
    select: { candidateId: true, type: true, completedAt: true },
  });

  if (!testLink || testLink.type !== "candidate" || !testLink.candidateId) {
    return NextResponse.json({ error: "Link inválido" }, { status: 404 });
  }

  if (testLink.completedAt) {
    return NextResponse.json({ error: "Avaliação já concluída" }, { status: 409 });
  }

  const candidate = await prisma.candidate.findUnique({
    where: { id: testLink.candidateId },
    select: { respostasJson: true },
  });

  if (!candidate) {
    return NextResponse.json({ error: "Candidato não encontrado" }, { status: 404 });
  }

  // Idempotent: already answered, just proceed
  if (candidate.respostasJson) {
    return NextResponse.json({ success: true });
  }

  await prisma.candidate.update({
    where: { id: testLink.candidateId },
    data: { respostasJson: respostas },
  });

  return NextResponse.json({ success: true });
}
