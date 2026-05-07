import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";

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

  const job = await prisma.job.findFirst({
    where: { id: jobId, companyId: user.companyId },
  });

  if (!job) {
    return NextResponse.json({ error: "Vaga não encontrada" }, { status: 404 });
  }

  return NextResponse.json(job);
}

export async function PATCH(
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
  });

  if (!job) {
    return NextResponse.json({ error: "Vaga não encontrada" }, { status: 404 });
  }

  const body = await req.json();
  const { titulo, motivo, responsabilidades, metas, liderId } = body;

  const updated = await prisma.job.update({
    where: { id: jobId },
    data: {
      ...(titulo !== undefined && { titulo }),
      ...(motivo !== undefined && { motivo }),
      ...(responsabilidades !== undefined && { responsabilidades }),
      ...(metas !== undefined && { metas }),
      ...(liderId !== undefined && { liderId: liderId || null }),
      ...(liderId !== undefined && { lideresJson: liderId ? [liderId] : [] }),
    },
  });

  return NextResponse.json(updated);
}

export async function DELETE(
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
  });

  if (!job) {
    return NextResponse.json({ error: "Vaga não encontrada" }, { status: 404 });
  }

  await prisma.matchReport.deleteMany({ where: { jobId } });
  await prisma.chatMessage.deleteMany({ where: { jobId } });

  const candidates = await prisma.candidate.findMany({
    where: { jobId },
    select: { id: true },
  });
  const candidateIds = candidates.map((c: any) => c.id);

  if (candidateIds.length > 0) {
    await prisma.testLink.deleteMany({ where: { candidateId: { in: candidateIds } } });
    await prisma.personalityResult.deleteMany({
      where: { subjectId: { in: candidateIds } },
    });
    await prisma.candidate.deleteMany({ where: { jobId } });
  }

  await prisma.job.delete({ where: { id: jobId } });

  return NextResponse.json({ ok: true });
}
