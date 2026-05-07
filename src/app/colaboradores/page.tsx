import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import Navbar from "@/components/ui/NavBar";
import ColaboradoresClient, { ColaboradorItem } from "./ColaboradoresClient";

export default async function ColaboradoresPage() {
  const session = await getServerSession(authOptions);
  const user = session?.user as { email?: string | null; companyId?: string | null } | undefined;

  if (!user?.email) redirect("/auth/login");
  if (!user?.companyId) redirect("/onboarding");

  const companyId = user.companyId;

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

  const initialColaboradores: ColaboradorItem[] = nodes.map((node) => {
    const testLink = node.testLinkToken
      ? (testLinkMap.get(node.testLinkToken) ?? null)
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

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-[#F5F7F0] p-4 md:p-8">
        <ColaboradoresClient initialColaboradores={initialColaboradores} />
      </main>
    </>
  );
}
