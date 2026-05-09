import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";

async function resolveCandidate(user: any, jobId: string, candidateId: string) {
  return prisma.candidate.findFirst({
    where: { id: candidateId, jobId, companyId: user.companyId },
  });
}

export async function GET(
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
    select: { id: true, nome: true, email: true, linkedinUrl: true, entrevistaTexto: true },
  });

  if (!candidate) {
    return NextResponse.json({ error: "Candidato não encontrado" }, { status: 404 });
  }

  return NextResponse.json(candidate);
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; candidateId: string }> }
) {
  const session = await getServerSession(authOptions);
  const user = session?.user as any;

  if (!user?.email || !user?.companyId) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const { id: jobId, candidateId } = await params;

  const candidate = await resolveCandidate(user, jobId, candidateId);
  if (!candidate) {
    return NextResponse.json({ error: "Candidato não encontrado" }, { status: 404 });
  }

  const body = await req.json().catch(() => ({}));
  const data: Record<string, unknown> = {};

  if ("linkedinUrl" in body) {
    data.linkedinUrl =
      typeof body.linkedinUrl === "string" && body.linkedinUrl.trim()
        ? body.linkedinUrl.trim()
        : null;
  }
  if ("cvBase64" in body) {
    data.cvUrl =
      typeof body.cvBase64 === "string" &&
      body.cvBase64.startsWith("data:application/pdf;base64,")
        ? body.cvBase64
        : null;
  }
  if ("entrevistaTexto" in body) {
    data.entrevistaTexto =
      typeof body.entrevistaTexto === "string" && body.entrevistaTexto.trim()
        ? body.entrevistaTexto.trim()
        : null;
  }
  if ("respostasJson" in body) {
    data.respostasJson = Array.isArray(body.respostasJson) ? body.respostasJson : null;
  }

  if (Object.keys(data).length === 0) {
    return NextResponse.json({ error: "Nenhum campo para atualizar" }, { status: 400 });
  }

  const updated = await prisma.candidate.update({ where: { id: candidateId }, data });
  return NextResponse.json(updated);
}

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

  const candidate = await resolveCandidate(user, jobId, candidateId);
  if (!candidate) {
    return NextResponse.json({ error: "Candidato não encontrado" }, { status: 404 });
  }

  await prisma.matchReport.deleteMany({ where: { candidateId } });
  await prisma.personalityResult.deleteMany({ where: { subjectId: candidateId } });
  await prisma.testLink.deleteMany({ where: { candidateId } });
  await prisma.candidate.delete({ where: { id: candidateId } });

  return NextResponse.json({ ok: true });
}
