import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

interface Params {
  params: Promise<{ vagaId: string }>;
}

export async function GET(_req: NextRequest, { params }: Params) {
  const { vagaId } = await params;

  try {
    const job = await prisma.job.findUnique({
      where: { id: vagaId },
      select: {
        titulo: true,
        status: true,
        company: { select: { razaoSocial: true, logoUrl: true } },
      },
    });

    if (!job || job.status !== "active") {
      return NextResponse.json({ error: "Vaga não encontrada" }, { status: 404 });
    }

    return NextResponse.json({
      titulo: job.titulo,
      empresa: job.company.razaoSocial,
      logoUrl: job.company.logoUrl ?? null,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("[candidatura] GET Erro:", message, error);
    return NextResponse.json({ error: "Erro ao buscar vaga", detail: message }, { status: 500 });
  }
}

export async function POST(req: NextRequest, { params }: Params) {
  const { vagaId } = await params;

  const body = await req.json().catch(() => null);
  const nome = body?.nome?.trim();
  const email = body?.email?.trim();

  if (!nome) return NextResponse.json({ error: "Nome é obrigatório" }, { status: 400 });
  if (!email) return NextResponse.json({ error: "E-mail é obrigatório" }, { status: 400 });

  try {
    const job = await prisma.job.findUnique({
      where: { id: vagaId },
      select: { companyId: true, status: true },
    });

    if (!job || job.status !== "active") {
      return NextResponse.json({ error: "Vaga não encontrada" }, { status: 404 });
    }

    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    const candidate = await prisma.candidate.create({
      data: {
        jobId: vagaId,
        companyId: job.companyId,
        nome,
        email,
      },
    });

    const testLink = await prisma.testLink.create({
      data: {
        companyId: job.companyId,
        candidateId: candidate.id,
        expiresAt,
        type: "candidate",
      },
    });

    return NextResponse.json({ token: testLink.token }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("[candidatura] POST Erro:", message, error);
    return NextResponse.json({ error: "Erro ao registrar candidatura", detail: message }, { status: 500 });
  }
}
