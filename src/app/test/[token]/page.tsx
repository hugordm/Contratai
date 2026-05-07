import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import DiscTestClient from "./DiscTestClient";
import EnneagramClient from "./EnneagramClient";

interface Props {
  params: Promise<{ token: string }>;
}

export default async function TestPage({ params }: Props) {
  const { token } = await params;

  const testLink = await prisma.testLink.findUnique({
    where: { token },
    include: {
      company: { select: { razaoSocial: true, logoUrl: true } },
      candidate: { select: { nome: true } },
    },
  });

  if (!testLink) return notFound();

  const companyName = testLink.company.razaoSocial;
  const logoUrl = testLink.company.logoUrl ?? null;
  const candidateName = testLink.candidate?.nome ?? null;

  if (testLink.completedAt) {
    return (
      <main className="min-h-screen bg-[#F5F7F0] flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl border border-gray-200 p-8 max-w-md w-full text-center">
          {logoUrl ? (
            <img src={logoUrl} alt={companyName} className="h-10 mx-auto mb-3 object-contain" />
          ) : (
            <p className="font-bold text-[#4A5452] text-lg mb-3">{companyName}</p>
          )}
          <div className="text-4xl mb-4">✓</div>
          <h1 className="text-xl font-bold text-gray-900 mb-2">Avaliação já realizada</h1>
          <p className="text-gray-500 text-sm">
            Este link já foi utilizado. Entre em contato com o recrutador se precisar refazer.
          </p>
        </div>
      </main>
    );
  }

  if (testLink.expiresAt < new Date()) {
    return (
      <main className="min-h-screen bg-[#F5F7F0] flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl border border-gray-200 p-8 max-w-md w-full text-center">
          {logoUrl ? (
            <img src={logoUrl} alt={companyName} className="h-10 mx-auto mb-3 object-contain" />
          ) : (
            <p className="font-bold text-[#4A5452] text-lg mb-3">{companyName}</p>
          )}
          <div className="text-4xl mb-4">⏰</div>
          <h1 className="text-xl font-bold text-gray-900 mb-2">Link expirado</h1>
          <p className="text-gray-500 text-sm">
            Este link de teste não é mais válido. Solicite um novo link ao recrutador.
          </p>
        </div>
      </main>
    );
  }

  // Detect which step the candidate is on
  const existingResult = await prisma.personalityResult.findFirst({
    where: {
      companyId: testLink.companyId,
      ...(testLink.candidateId ? { subjectId: testLink.candidateId } : {}),
    },
    orderBy: { createdAt: "desc" },
  });

  const discDone = !!existingResult?.discJson;
  const step = discDone ? 2 : 1;

  return (
    <div className="min-h-screen bg-[#F5F7F0]">
      <header className="bg-white border-b border-gray-200 px-4 py-4">
        <div className="max-w-xl mx-auto flex flex-col items-center gap-1 text-center">
          {logoUrl ? (
            <img src={logoUrl} alt={companyName} className="h-9 object-contain mb-1" />
          ) : (
            <span className="font-bold text-[#4A5452] text-base">{companyName}</span>
          )}
          {logoUrl && <span className="text-xs text-gray-400">{companyName}</span>}
          {candidateName && (
            <span className="text-sm text-gray-500">
              Olá, <strong>{candidateName}</strong>
            </span>
          )}
          {/* Step indicator */}
          <div className="flex items-center gap-2 mt-2">
            <div className="flex items-center gap-1.5">
              <span
                className="w-6 h-6 rounded-full text-xs font-bold flex items-center justify-center"
                style={{
                  backgroundColor: step >= 1 ? "#4A5452" : "#e5e7eb",
                  color: step >= 1 ? "#C4FF57" : "#9ca3af",
                }}
              >
                {step > 1 ? "✓" : "1"}
              </span>
              <span className="text-xs font-medium text-gray-500">DISC</span>
            </div>
            <div className="w-6 h-px bg-gray-300" />
            <div className="flex items-center gap-1.5">
              <span
                className="w-6 h-6 rounded-full text-xs font-bold flex items-center justify-center"
                style={{
                  backgroundColor: step >= 2 ? "#4A5452" : "#e5e7eb",
                  color: step >= 2 ? "#C4FF57" : "#9ca3af",
                }}
              >
                2
              </span>
              <span className="text-xs font-medium text-gray-500">Eneagrama</span>
            </div>
          </div>
        </div>
      </header>

      {discDone ? (
        <EnneagramClient token={token} />
      ) : (
        <DiscTestClient
          token={token}
          candidateName={candidateName}
          companyName={companyName}
        />
      )}
    </div>
  );
}
