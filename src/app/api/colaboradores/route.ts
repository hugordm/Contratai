import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";

interface SessionUser {
  email?: string | null;
  companyId?: string | null;
}

export async function GET() {
  const session = await getServerSession(authOptions);
  const user = session?.user as SessionUser | undefined;

  if (!user?.email || !user?.companyId) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const companyId = user.companyId;

  try {
    const [nodes, testLinks, personalityResults] = await Promise.all([
      prisma.organogramaNode.findMany({
        where: { companyId },
        orderBy: { nome: "asc" },
      }),
      prisma.testLink.findMany({
        where: { companyId, type: "employee" },
      }),
      prisma.personalityResult.findMany({
        where: { companyId, subjectType: "employee" },
      }),
    ]);

    const testLinkMap = new Map(testLinks.map((tl) => [tl.token, tl]));
    const personalityMap = new Map(
      personalityResults.map((pr) => [pr.nodeId ?? "", pr])
    );

    const result = nodes.map((node) => {
      const testLink = node.testLinkToken
        ? testLinkMap.get(node.testLinkToken) ?? null
        : null;
      const personality = personalityMap.get(node.id) ?? null;

      const testCompleted = !!(testLink?.completedAt);
      const testPending = !!(node.testLinkToken && !testCompleted);
      const hasPersonality = !!(personality?.discJson);

      const discDominant: string | null = hasPersonality && personality?.discJson
        ? ((personality.discJson as { dominant?: string }).dominant ?? null)
        : null;

      return {
        id: node.id,
        nome: node.nome,
        cargo: node.cargo,
        departamento: node.departamento ?? null,
        email: node.email ?? null,
        testLinkToken: node.testLinkToken ?? null,
        testCompleted,
        testPending,
        hasPersonality,
        discDominant,
      };
    });

    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("[colaboradores] GET Erro:", message, error);
    return NextResponse.json({ error: "Erro ao buscar colaboradores", detail: message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  const user = session?.user as SessionUser | undefined;

  if (!user?.email || !user?.companyId) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const companyId = user.companyId;

  let body: { nome?: string; cargo?: string; departamento?: string; email?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Corpo inválido" }, { status: 400 });
  }

  const { nome, cargo, departamento, email } = body;

  if (!nome?.trim() || !cargo?.trim()) {
    return NextResponse.json(
      { error: "Nome e cargo são obrigatórios" },
      { status: 400 }
    );
  }

  try {
    const node = await prisma.organogramaNode.create({
      data: {
        companyId,
        nome: nome.trim(),
        cargo: cargo.trim(),
        departamento: departamento?.trim() ?? null,
        email: email?.trim() ?? null,
      },
    });

    return NextResponse.json(node, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("[colaboradores] POST Erro:", message, error);
    return NextResponse.json({ error: "Erro ao criar colaborador", detail: message }, { status: 500 });
  }
}
