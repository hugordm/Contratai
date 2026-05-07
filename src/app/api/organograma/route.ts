import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getServerSession(authOptions);
  const user = session?.user as any;

  if (!user?.email || !user?.companyId) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const nodes = await prisma.organogramaNode.findMany({
    where: { companyId: user.companyId },
    orderBy: { nome: "asc" },
    select: { id: true, nome: true, cargo: true, departamento: true, testLinkToken: true },
  });

  return NextResponse.json(nodes);
}
