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

  console.log("TOKEN RECEBIDO:", token);

  const testLink = await prisma.testLink.findUnique({
    where: { token },
    include: {
      company: { select: { razaoSocial: true, logoUrl: true } },
      candidate: { select: { nome: true } },
    },
  });

  if (!testLink) {
    return (
      <main className="min-h-screen bg-[#F5F7F0] flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl border border-gray-200 p-8 max-w-md w-full text-center">
          <div className="text-4xl mb-4">🔍</div>
          <h1 className="text-xl font-bold text-gray-900 mb-2">Link não encontrado</h1>
          <p className="text-gray-500 text-sm mb-4">
            Nenhum teste foi encontrado para este link. Verifique se o endereço está correto ou solicite um novo link ao recrutador.
          </p>
          <p className="text-xs text-gray-300 font-mono break-all">token: {token}</p>
        </div>
      </main>
    );
  }

  const companyName = testLink.company.razaoSocial;
  const logoUrl = testLink.company.logoUrl ?? null;

  // Resolve employee node (used for both name and subjectId lookup)
  let candidateName: string | null = testLink.candidate?.nome ?? null;
  let employeeSubjectId: string | null = null;
  if (testLink.type === "employee") {
    const node = await prisma.organogramaNode.findUnique({
      where: { testLinkToken: token },
      select: { id: true, nome: true, companyId: true },
    });
    if (node && node.companyId === testLink.companyId) {
      candidateName = candidateName ?? node.nome;
      employeeSubjectId = node.id;
    }
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

  // Determine subjectId for the PersonalityResult lookup
  let subjectId: string | null = null;
  let subjectType: string | null = null;
  if (testLink.candidateId) {
    subjectId = testLink.candidateId;
    subjectType = "candidate";
  } else if (testLink.type === "employee" && employeeSubjectId) {
    subjectId = employeeSubjectId;
    subjectType = "employee";
  }

  // Only search for an existing result if we have a valid, specific subjectId
  const existingResult = subjectId
    ? await prisma.personalityResult.findFirst({
        where: { companyId: testLink.companyId, subjectId, subjectType: subjectType! },
        orderBy: { createdAt: "desc" },
      })
    : null;

  const discDone = !!existingResult?.discJson;
  const ennDone = !!existingResult?.enneagramJson;
  const mbtiDone = !!existingResult?.mbtiJson;

  // Only redirect to result when all three tests are truly complete
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
