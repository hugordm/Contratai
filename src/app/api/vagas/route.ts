import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  const user = session?.user as any;

  if (!user?.email || !user?.companyId) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const body = await req.json();
  const { titulo, motivo, responsabilidades, metas, liderId } = body;

  if (!titulo?.trim()) {
    return NextResponse.json({ error: "Cargo é obrigatório" }, { status: 400 });
  }

  try {
    const job = await prisma.job.create({
      data: {
        companyId: user.companyId,
        titulo: titulo.trim(),
        motivo: motivo ?? null,
        responsabilidades: responsabilidades?.trim() || null,
        metas: metas?.trim() || null,
        liderId: liderId || null,
        lideresJson: liderId ? [liderId] : undefined,
        status: "active",
      },
    });

    return NextResponse.json({ id: job.id });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("[vagas] POST Erro:", message, error);
    return NextResponse.json({ error: "Erro ao criar vaga", detail: message }, { status: 500 });
  }
}

export async function GET() {
  const session = await getServerSession(authOptions);
  const user = session?.user as any;

  if (!user?.email || !user?.companyId) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  try {
    const jobs = await prisma.job.findMany({
      where: { companyId: user.companyId },
      orderBy: { createdAt: "desc" },
      include: {
        _count: { select: { candidates: true } },
      },
    });

    return NextResponse.json(jobs);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("[vagas] GET Erro:", message, error);
    return NextResponse.json({ error: "Erro ao buscar vagas", detail: message }, { status: 500 });
  }
}
