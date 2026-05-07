import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";

interface Props {
  params: Promise<{ token: string }>;
}

const DISC_INFO = {
  D: {
    label: "Dominância",
    color: "bg-red-500",
    lightColor: "bg-red-50 border-red-200",
    textColor: "text-red-700",
    emoji: "🦁",
    description:
      "Você é orientado a resultados, direto e assertivo. Toma decisões rápidas, gosta de desafios e não tem medo de liderar. Prospera em ambientes competitivos e de alta pressão.",
    strengths: ["Liderança decisiva", "Orientação a resultados", "Resolução de problemas", "Iniciativa"],
    watchOut: "Pode parecer impaciente ou dominador em situações que exigem consenso.",
  },
  I: {
    label: "Influência",
    color: "bg-yellow-400",
    lightColor: "bg-yellow-50 border-yellow-200",
    textColor: "text-yellow-700",
    emoji: "🌟",
    description:
      "Você é comunicativo, entusiasta e inspirador. Constrói relacionamentos com facilidade, motiva equipes e traz energia positiva. Brilha em funções que envolvem pessoas e criatividade.",
    strengths: ["Comunicação", "Entusiasmo", "Trabalho em equipe", "Criatividade"],
    watchOut: "Pode perder o foco em detalhes e prazo quando muitas ideias surgem ao mesmo tempo.",
  },
  S: {
    label: "Estabilidade",
    color: "bg-green-500",
    lightColor: "bg-green-50 border-green-200",
    textColor: "text-green-700",
    emoji: "🌿",
    description:
      "Você é paciente, leal e colaborativo. Cria ambientes seguros e harmoniosos, é confiável e consistente. Excelente para funções que exigem suporte, continuidade e trabalho em equipe.",
    strengths: ["Confiabilidade", "Paciência", "Colaboração", "Escuta ativa"],
    watchOut: "Pode ter dificuldade com mudanças bruscas ou em expressar discordâncias.",
  },
  C: {
    label: "Conformidade",
    color: "bg-blue-500",
    lightColor: "bg-blue-50 border-blue-200",
    textColor: "text-blue-700",
    emoji: "🔬",
    description:
      "Você é analítico, preciso e criterioso. Segue padrões elevados de qualidade, analisa dados antes de decidir e produz trabalho de excelência. Indispensável onde precisão é fundamental.",
    strengths: ["Análise crítica", "Precisão", "Qualidade", "Planejamento sistemático"],
    watchOut: "Pode ser excessivamente perfeccionista ou demorar para agir sem dados suficientes.",
  },
};

const ENNEAGRAM_INFO: Record<number, {
  label: string;
  emoji: string;
  tagline: string;
  description: string;
  strengths: string[];
  watchOut: string;
}> = {
  1: {
    label: "Perfeccionista",
    emoji: "⚖️",
    tagline: "O Reformador Ético",
    description:
      "Principioso, responsável e com alto senso de dever. Busca constantemente melhorar a si mesmo e o mundo ao redor. Tem padrões elevados e um forte senso de certo e errado.",
    strengths: ["Integridade", "Organização", "Senso crítico", "Confiabilidade"],
    watchOut: "Pode ser autocrítico em excesso e ter dificuldade em aceitar imperfeições nos outros.",
  },
  2: {
    label: "Prestativo",
    emoji: "🤝",
    tagline: "O Doador Generoso",
    description:
      "Atencioso, generoso e orientado às pessoas. Tem grande capacidade de perceber as necessidades alheias e genuíno prazer em ajudar. Valoriza relações calorosas e conexões humanas.",
    strengths: ["Empatia", "Generosidade", "Habilidade interpessoal", "Suporte emocional"],
    watchOut: "Pode negligenciar suas próprias necessidades ao se dedicar demais aos outros.",
  },
  3: {
    label: "Realizador",
    emoji: "🏆",
    tagline: "O Alcançador Adaptável",
    description:
      "Ambicioso, competente e orientado a resultados. Altamente adaptável e eficiente, sabe como atingir metas e inspirar outros com seu sucesso. Valoriza reconhecimento e progresso.",
    strengths: ["Foco em resultados", "Adaptabilidade", "Eficiência", "Liderança"],
    watchOut: "Pode priorizar a imagem externa em detrimento da autenticidade.",
  },
  4: {
    label: "Individualista",
    emoji: "🎨",
    tagline: "O Romântico Introspectivo",
    description:
      "Expressivo, sensível e em busca de identidade. Tem profunda vida emocional e valoriza autenticidade acima de tudo. Traz originalidade e perspectivas únicas para o ambiente.",
    strengths: ["Criatividade", "Profundidade emocional", "Autenticidade", "Empatia"],
    watchOut: "Pode se perder em sentimentos de insuficiência ou inveja do que os outros têm.",
  },
  5: {
    label: "Investigador",
    emoji: "🔭",
    tagline: "O Observador Perspicaz",
    description:
      "Analítico, perspicaz e inovador. Busca compreender o mundo através do conhecimento e da observação. Independente e capaz de pensar de forma original e aprofundada.",
    strengths: ["Análise", "Especialização", "Pensamento independente", "Objetividade"],
    watchOut: "Pode se isolar em excesso e ter dificuldade em compartilhar recursos emocionais.",
  },
  6: {
    label: "Leal",
    emoji: "🛡️",
    tagline: "O Questionador Comprometido",
    description:
      "Responsável, confiável e orientado à segurança. Extremamente leal às pessoas e grupos com quem se compromete. Pensa estrategicamente sobre riscos e é bom em antecipar problemas.",
    strengths: ["Lealdade", "Comprometimento", "Pensamento estratégico", "Antecipação de riscos"],
    watchOut: "Pode ser ansioso e projetar inseguranças em situações que não representam real ameaça.",
  },
  7: {
    label: "Entusiasta",
    emoji: "✨",
    tagline: "O Epicurista Espontâneo",
    description:
      "Espontâneo, versátil e otimista. Ama explorar possibilidades e traz energia e entusiasmo para tudo que faz. Criativo, rápido e com grande capacidade de gerar ideias inovadoras.",
    strengths: ["Entusiasmo", "Criatividade", "Versatilidade", "Otimismo"],
    watchOut: "Pode ter dificuldade em comprometer-se a longo prazo e evitar o desconforto necessário.",
  },
  8: {
    label: "Desafiador",
    emoji: "⚡",
    tagline: "O Protetor Poderoso",
    description:
      "Autoconfiante, decisivo e assertivo. Tem presença natural de liderança e não hesita em assumir o controle de situações. Protege quem está ao seu lado e confronta injustiças diretamente.",
    strengths: ["Liderança", "Decisão", "Coragem", "Proteção dos outros"],
    watchOut: "Pode parecer intimidador e ter dificuldade em mostrar vulnerabilidade.",
  },
  9: {
    label: "Pacificador",
    emoji: "🕊️",
    tagline: "O Mediador Receptivo",
    description:
      "Receptivo, calmo e estável. Tem capacidade única de ver todos os lados de uma situação e criar harmonia entre pessoas com perspectivas diferentes. Transmite tranquilidade e equilíbrio.",
    strengths: ["Mediação", "Equilíbrio", "Empatia ampla", "Estabilidade"],
    watchOut: "Pode evitar conflitos necessários e perder contato com suas próprias prioridades.",
  },
};

export default async function ResultPage({ params }: Props) {
  const { token } = await params;

  const testLink = await prisma.testLink.findUnique({
    where: { token },
    include: {
      company: { select: { razaoSocial: true, logoUrl: true } },
    },
  });

  if (!testLink || !testLink.completedAt) return notFound();

  const result = await prisma.personalityResult.findFirst({
    where: {
      companyId: testLink.companyId,
      ...(testLink.candidateId ? { subjectId: testLink.candidateId } : {}),
    },
    orderBy: { createdAt: "desc" },
  });

  if (!result) return notFound();

  const disc = result.discJson as {
    dominant: string;
    percentages: Record<string, number>;
    counts: Record<string, number>;
  };

  const enneagram = result.enneagramJson as {
    dominant: number;
    wing: number;
    scores: Record<string, number>;
  } | null;

  const dominant = disc.dominant as keyof typeof DISC_INFO;
  const discInfo = DISC_INFO[dominant];
  const order = ["D", "I", "S", "C"] as const;

  const ennDominant = enneagram?.dominant;
  const ennWing = enneagram?.wing;
  const ennInfo = ennDominant ? ENNEAGRAM_INFO[ennDominant] : null;

  return (
    <main className="min-h-screen bg-[#F5F7F0] py-10 px-4">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Header */}
        <div className="bg-white rounded-2xl border border-gray-200 p-8 text-center">
          {testLink.company.logoUrl && (
            <img
              src={testLink.company.logoUrl}
              alt="Logo"
              className="h-10 mx-auto mb-3 object-contain"
            />
          )}
          <p className="text-sm text-gray-400 mb-4">{testLink.company.razaoSocial}</p>
          <h1 className="text-2xl font-bold text-[#4A5452] mb-1">
            Avaliação Comportamental Completa
          </h1>
          <p className="text-sm text-gray-500">DISC + Eneagrama</p>
        </div>

        {/* ── DISC ── */}
        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-2">
            <span className="text-lg font-bold text-[#4A5452]">Etapa 1</span>
            <span className="text-sm text-gray-400">— Perfil DISC</span>
          </div>

          <div className="p-6 text-center border-b border-gray-100">
            <div className="text-4xl mb-2">{discInfo.emoji}</div>
            <h2 className="text-2xl font-bold text-gray-900 mb-0.5">
              Perfil {discInfo.label}
            </h2>
            <p className="text-sm text-gray-400">Seu perfil comportamental dominante</p>
          </div>

          <div className="p-6 border-b border-gray-100">
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-4">
              Distribuição DISC
            </h3>
            <div className="space-y-3">
              {order.map((type) => {
                const pct = disc.percentages[type] ?? 0;
                const typeInfo = DISC_INFO[type];
                return (
                  <div key={type}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium text-gray-700">
                        <span className="font-bold">{type}</span> — {typeInfo.label}
                      </span>
                      <span className="text-sm font-semibold text-gray-900">{pct}%</span>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-2.5">
                      <div
                        className={`${typeInfo.color} h-2.5 rounded-full`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className={`m-4 rounded-xl border p-5 ${discInfo.lightColor}`}>
            <h3 className={`text-base font-bold mb-2 ${discInfo.textColor}`}>
              {discInfo.emoji} Sobre o seu perfil
            </h3>
            <p className="text-sm text-gray-700 leading-relaxed mb-4">{discInfo.description}</p>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
                  Pontos fortes
                </h4>
                <ul className="space-y-1">
                  {discInfo.strengths.map((s) => (
                    <li key={s} className="text-sm text-gray-700 flex items-center gap-1.5">
                      <span className="text-green-500">✓</span> {s}
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
                  Atenção
                </h4>
                <p className="text-sm text-gray-600">{discInfo.watchOut}</p>
              </div>
            </div>
          </div>
        </div>

        {/* ── ENNEAGRAM ── */}
        {ennInfo && enneagram && (
          <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-2">
              <span className="text-lg font-bold text-[#4A5452]">Etapa 2</span>
              <span className="text-sm text-gray-400">— Eneagrama</span>
            </div>

            <div className="p-6 text-center border-b border-gray-100">
              <div className="text-4xl mb-2">{ennInfo.emoji}</div>
              <h2 className="text-2xl font-bold text-gray-900 mb-0.5">
                Tipo {ennDominant} — {ennInfo.label}
              </h2>
              <p className="text-sm text-gray-400">{ennInfo.tagline}</p>
              {ennWing && (
                <p className="text-xs text-gray-400 mt-1">
                  Asa {ennDominant}w{ennWing} — influência do Tipo {ennWing} ({ENNEAGRAM_INFO[ennWing]?.label})
                </p>
              )}
            </div>

            {/* Score bars */}
            <div className="p-6 border-b border-gray-100">
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-4">
                Pontuação por tipo
              </h3>
              <div className="space-y-2.5">
                {([1, 2, 3, 4, 5, 6, 7, 8, 9] as const).map((tipo) => {
                  const score = enneagram.scores[String(tipo)] ?? 0;
                  const maxScore = 20; // 4 perguntas × 5 pontos
                  const pct = Math.round((score / maxScore) * 100);
                  const isDominant = tipo === ennDominant;
                  return (
                    <div key={tipo}>
                      <div className="flex items-center justify-between mb-0.5">
                        <span
                          className={`text-sm ${isDominant ? "font-bold text-[#4A5452]" : "text-gray-600"}`}
                        >
                          Tipo {tipo} — {ENNEAGRAM_INFO[tipo].label}
                          {isDominant && " ★"}
                        </span>
                        <span className="text-sm text-gray-500">{score}/20</span>
                      </div>
                      <div className="w-full bg-gray-100 rounded-full h-2">
                        <div
                          className="h-2 rounded-full transition-all"
                          style={{
                            width: `${pct}%`,
                            backgroundColor: isDominant ? "#C4FF57" : "#4A5452",
                            opacity: isDominant ? 1 : 0.4,
                          }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="m-4 rounded-xl border border-[#C4FF57] bg-[#f9ffe6] p-5">
              <h3 className="text-base font-bold text-[#4A5452] mb-2">
                {ennInfo.emoji} Sobre o seu tipo
              </h3>
              <p className="text-sm text-gray-700 leading-relaxed mb-4">{ennInfo.description}</p>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
                    Pontos fortes
                  </h4>
                  <ul className="space-y-1">
                    {ennInfo.strengths.map((s) => (
                      <li key={s} className="text-sm text-gray-700 flex items-center gap-1.5">
                        <span className="text-green-500">✓</span> {s}
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
                    Atenção
                  </h4>
                  <p className="text-sm text-gray-600">{ennInfo.watchOut}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        <p className="text-center text-xs text-gray-400 pb-4">
          Resultado gerado em{" "}
          {new Date(result.createdAt).toLocaleDateString("pt-BR", {
            day: "2-digit",
            month: "long",
            year: "numeric",
          })}
        </p>
      </div>
    </main>
  );
}
