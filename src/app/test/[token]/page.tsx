import { prisma } from "@/lib/prisma";
import { notFound, redirect } from "next/navigation";
import DiscTestClient from "./DiscTestClient";
import EnneagramClient from "./EnneagramClient";
import MBTIClient from "./MBTIClient";

interface Props {
  params: Promise<{ token: string }>;
}

type Step = 1 | 2 | 3;

interface StepDef {
  label: string;
  num: 1 | 2 | 3;
}

const STEPS: StepDef[] = [
  { num: 1, label: "DISC" },
  { num: 2, label: "Eneagrama" },
  { num: 3, label: "16 Personalidades" },
];

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

  // Candidate name: from Candidate record, or from OrganogramaNode for employee links
  let candidateName: string | null = testLink.candidate?.nome ?? null;
  if (!candidateName && testLink.type === "employee") {
    const node = await prisma.organogramaNode.findFirst({
      where: { testLinkToken: token },
      select: { nome: true },
    });
    candidateName = node?.nome ?? null;
  }

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

  const existingResult = await prisma.personalityResult.findFirst({
    where: {
      companyId: testLink.companyId,
      ...(testLink.candidateId ? { subjectId: testLink.candidateId } : {}),
    },
    orderBy: { createdAt: "desc" },
  });

  const discDone = !!existingResult?.discJson;
  const ennDone = !!existingResult?.enneagramJson;
  const mbtiDone = !!existingResult?.mbtiJson;

  if (discDone && ennDone && mbtiDone) {
    redirect(`/test/${token}/result`);
  }

  const step: Step = !discDone ? 1 : !ennDone ? 2 : 3;

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
          <div className="flex items-center gap-1 mt-2">
            {STEPS.map((s: any, i: number) => {
              const done = s.num < step;
              const active = s.num === step;
              return (
                <div key={s.num} className="flex items-center gap-1">
                  <div className="flex items-center gap-1">
                    <span
                      className="w-5 h-5 rounded-full text-[10px] font-bold flex items-center justify-center flex-shrink-0"
                      style={{
                        backgroundColor: done || active ? "#4A5452" : "#e5e7eb",
                        color: done || active ? "#C4FF57" : "#9ca3af",
                      }}
                    >
                      {done ? "✓" : s.num}
                    </span>
                    <span className="text-[11px] font-medium text-gray-500 hidden sm:inline">
                      {s.label}
                    </span>
                    <span className="text-[10px] font-medium text-gray-500 sm:hidden">
                      {s.num}
                    </span>
                  </div>
                  {i < STEPS.length - 1 && (
                    <div className="w-5 h-px bg-gray-300 mx-0.5" />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </header>

      {step === 1 && (
        <DiscTestClient token={token} candidateName={candidateName} companyName={companyName} />
      )}
      {step === 2 && <EnneagramClient token={token} />}
      {step === 3 && <MBTIClient token={token} />}
    </div>
  );
}
