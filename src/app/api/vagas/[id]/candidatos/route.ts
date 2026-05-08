import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";

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
  });

  if (!job) {
    return NextResponse.json({ error: "Vaga não encontrada" }, { status: 404 });
  }

  const body = await req.json();
  const { nome, email, linkedinUrl } = body;

  if (!nome?.trim()) {
    return NextResponse.json({ error: "Nome é obrigatório" }, { status: 400 });
  }
  if (!email?.trim()) {
    return NextResponse.json({ error: "E-mail é obrigatório" }, { status: 400 });
  }

  const candidate = await prisma.candidate.create({
    data: {
      jobId,
      companyId: user.companyId,
      nome: nome.trim(),
      email: email.trim().toLowerCase(),
      linkedinUrl: linkedinUrl?.trim() || null,
    },
  });

  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7);
  const testLink = await prisma.testLink.create({
    data: {
      companyId: user.companyId,
      candidateId: candidate.id,
      expiresAt,
      type: "candidate",
    },
  });

  return NextResponse.json({ ...candidate, testToken: testLink.token });
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  const user = session?.user as any;

  if (!user?.email || !user?.companyId) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const { id: jobId } = await params;

  const candidates = await prisma.candidate.findMany({
    where: { jobId, companyId: user.companyId },
    orderBy: { createdAt: "desc" },
    include: {
      testLinks: { orderBy: { createdAt: "desc" }, take: 1 },
    },
  });

  return NextResponse.json(candidates);
}
