import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.email) {
    redirect("/auth/login");
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    include: { company: true },
  });

  if (!user?.companyId) {
    redirect("/onboarding");
  }

  const company = user.company;

  const jobsCount = await prisma.job.count({
    where: { companyId: company!.id },
  });

  const candidatesCount = await prisma.candidate.count({
    where: { companyId: company!.id },
  });

  const matchesCount = await prisma.matchReport.count({
    where: { job: { companyId: company!.id } },
  });

  return (
    <main className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
            <p className="text-gray-500 text-sm mt-1">{company?.razaoSocial}</p>
          </div>
          <a href="/vagas/nova" className="bg-black text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-800 transition">
            + Nova Vaga
          </a>
        </div>

        <div className="grid grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <p className="text-sm text-gray-500 mb-1">Vagas ativas</p>
            <p className="text-3xl font-bold text-gray-900">{jobsCount}</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <p className="text-sm text-gray-500 mb-1">Candidatos em processo</p>
            <p className="text-3xl font-bold text-gray-900">{candidatesCount}</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <p className="text-sm text-gray-500 mb-1">Análises realizadas</p>
            <p className="text-3xl font-bold text-gray-900">{matchesCount}</p>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-8 text-center">
          <p className="text-gray-500 mb-4">Nenhuma vaga criada ainda</p>
          <a href="/vagas/nova" className="bg-black text-white px-6 py-2 rounded-lg text-sm font-medium hover:bg-gray-800 transition">
            Criar primeira vaga
          </a>
        </div>
      </div>
    </main>
  );
}