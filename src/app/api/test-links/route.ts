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
  const { candidateId, expiresInDays = 7 } = body;

  if (candidateId) {
    const candidate = await prisma.candidate.findFirst({
      where: { id: candidateId, companyId: user.companyId },
    });
    if (!candidate) {
      return NextResponse.json({ error: "Candidato não encontrado" }, { status: 404 });
    }
  }

  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + expiresInDays);

  const testLink = await prisma.testLink.create({
    data: {
      companyId: user.companyId,
      candidateId: candidateId ?? null,
      expiresAt,
      type: "candidate",
    },
  });

  const baseUrl = process.env.NEXTAUTH_URL ?? "http://localhost:3000";

  return NextResponse.json({
    id: testLink.id,
    token: testLink.token,
    url: `${baseUrl}/test/${testLink.token}`,
    expiresAt: testLink.expiresAt,
  });
}
