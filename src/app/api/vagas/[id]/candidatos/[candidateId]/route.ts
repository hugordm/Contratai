import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string; candidateId: string }> }
) {
  const session = await getServerSession(authOptions);
  const user = session?.user as any;

  if (!user?.email || !user?.companyId) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const { id: jobId, candidateId } = await params;

  const candidate = await prisma.candidate.findFirst({
    where: { id: candidateId, jobId, companyId: user.companyId },
  });

  if (!candidate) {
    return NextResponse.json({ error: "Candidato não encontrado" }, { status: 404 });
  }

  await prisma.matchReport.deleteMany({ where: { candidateId } });
  await prisma.personalityResult.deleteMany({ where: { subjectId: candidateId } });
  await prisma.testLink.deleteMany({ where: { candidateId } });
  await prisma.candidate.delete({ where: { id: candidateId } });

  return NextResponse.json({ ok: true });
}
