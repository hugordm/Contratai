import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function DELETE(_req: NextRequest, context: RouteContext) {
  const session = await getServerSession(authOptions);
  const user = session?.user as { email?: string | null; companyId?: string | null } | undefined;

  if (!user?.email || !user?.companyId) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const { id: nodeId } = await context.params;

  const node = await prisma.organogramaNode.findFirst({
    where: { id: nodeId, companyId: user.companyId },
  });

  if (!node) {
    return NextResponse.json({ error: "Colaborador não encontrado" }, { status: 404 });
  }

  if (node.testLinkToken) {
    await prisma.testLink.deleteMany({ where: { token: node.testLinkToken } });
  }

  await prisma.personalityResult.deleteMany({
    where: { nodeId, companyId: user.companyId },
  });

  await prisma.organogramaNode.delete({ where: { id: nodeId } });

  return NextResponse.json({ ok: true });
}
