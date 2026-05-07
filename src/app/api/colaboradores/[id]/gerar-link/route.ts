import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";

interface SessionUser {
  email?: string | null;
  companyId?: string | null;
}

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function POST(_request: NextRequest, context: RouteContext) {
  const session = await getServerSession(authOptions);
  const user = session?.user as SessionUser | undefined;

  if (!user?.email || !user?.companyId) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const companyId = user.companyId;
  const { id: nodeId } = await context.params;

  const node = await prisma.organogramaNode.findFirst({
    where: { id: nodeId, companyId },
  });

  if (!node) {
    return NextResponse.json({ error: "Colaborador não encontrado" }, { status: 404 });
  }

  // If there's already a token that hasn't been completed, return the existing one
  if (node.testLinkToken) {
    const existingLink = await prisma.testLink.findUnique({
      where: { token: node.testLinkToken },
    });
    if (existingLink && !existingLink.completedAt) {
      const baseUrl = process.env.NEXTAUTH_URL ?? "http://localhost:3000";
      return NextResponse.json({
        token: existingLink.token,
        url: `${baseUrl}/test/${existingLink.token}`,
      });
    }
  }

  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 60);

  const testLink = await prisma.testLink.create({
    data: {
      companyId,
      expiresAt,
      type: "employee",
    },
  });

  await prisma.organogramaNode.update({
    where: { id: nodeId },
    data: { testLinkToken: testLink.token },
  });

  const baseUrl = process.env.NEXTAUTH_URL ?? "http://localhost:3000";
  return NextResponse.json({
    token: testLink.token,
    url: `${baseUrl}/test/${testLink.token}`,
  });
}
