import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";

interface Props {
  params: Promise<{ token: string }>;
}

const DISC_INFO = {
  D: { label: "Dominância", color: "bg-red-500", lightColor: "bg-red-50 border-red-200", textColor: "text-red-700", emoji: "🦁", description: "Você é orientado a resultados, direto e assertivo. Toma decisões rápidas, gosta de desafios e não tem medo de liderar. Prospera em ambientes competitivos e de alta pressão.", strengths: ["Liderança decisiva", "Orientação a resultados", "Resolução de problemas", "Iniciativa"], watchOut: "Pode parecer impaciente ou dominador em situações que exigem consenso." },
  I: { label: "Influência", color: "bg-yellow-400", lightColor: "bg-yellow-50 border-yellow-200", textColor: "text-yellow-700", emoji: "🌟", description: "Você é comunicativo, entusiasta e inspirador. Constrói relacionamentos com facilidade, motiva equipes e traz energia positiva. Brilha em funções que envolvem pessoas e criatividade.", strengths: ["Comunicação", "Entusiasmo", "Trabalho em equipe", "Criatividade"], watchOut: "Pode perder o foco em detalhes e prazo quando muitas ideias surgem ao mesmo tempo." },
  S: { label: "Estabilidade", color: "bg-green-500", lightColor: "bg-green-50 border-green-200", textColor: "text-green-700", emoji: "🌿", description: "Você é paciente, leal e colaborativo. Cria ambientes seguros e harmoniosos, é confiável e consistente. Excelente para funções que exigem suporte, continuidade e trabalho em equipe.", strengths: ["Confiabilidade", "Paciência", "Colaboração", "Escuta ativa"], watchOut: "Pode ter dificuldade com mudanças bruscas ou em expressar discordâncias." },
  C: { label: "Conformidade", color: "bg-blue-500", lightColor: "bg-blue-50 border-blue-200", textColor: "text-blue-700", emoji: "🔬", description: "Você é analítico, preciso e criterioso. Segue padrões elevados de qualidade, analisa dados antes de decidir e produz trabalho de excelência. Indispensável onde precisão é fundamental.", strengths: ["Análise crítica", "Precisão", "Qualidade", "Planejamento sistemático"], watchOut: "Pode ser excessivamente perfeccionista ou demorar para agir sem dados suficientes." },
};

const ENNEAGRAM_INFO: Record<number, { label: string; emoji: string; tagline: string; description: string; strengths: string[]; watchOut: string }> = {
  1: { label: "Perfeccionista", emoji: "⚖️", tagline: "O Reformador Ético", description: "Principioso, responsável e com alto senso de dever. Busca constantemente melhorar a si mesmo e o mundo ao redor.", strengths: ["Integridade", "Organização", "Senso crítico", "Confiabilidade"], watchOut: "Pode ser autocrítico em excesso e ter dificuldade em aceitar imperfeições nos outros." },
  2: { label: "Prestativo", emoji: "🤝", tagline: "O Doador Generoso", description: "Atencioso, generoso e orientado às pessoas. Tem grande capacidade de perceber as necessidades alheias e genuíno prazer em ajudar.", strengths: ["Empatia", "Generosidade", "Habilidade interpessoal", "Suporte emocional"], watchOut: "Pode negligenciar suas próprias necessidades ao se dedicar demais aos outros." },
  3: { label: "Realizador", emoji: "🏆", tagline: "O Alcançador Adaptável", description: "Ambicioso, competente e orientado a resultados. Altamente adaptável e eficiente, sabe como atingir metas e inspirar outros.", strengths: ["Foco em resultados", "Adaptabilidade", "Eficiência", "Liderança"], watchOut: "Pode priorizar a imagem externa em detrimento da autenticidade." },
  4: { label: "Individualista", emoji: "🎨", tagline: "O Romântico Introspectivo", description: "Expressivo, sensível e em busca de identidade. Tem profunda vida emocional e valoriza autenticidade acima de tudo.", strengths: ["Criatividade", "Profundidade emocional", "Autenticidade", "Empatia"], watchOut: "Pode se perder em sentimentos de insuficiência ou inveja do que os outros têm." },
  5: { label: "Investigador", emoji: "🔭", tagline: "O Observador Perspicaz", description: "Analítico, perspicaz e inovador. Busca compreender o mundo através do conhecimento e da observação aprofundada.", strengths: ["Análise", "Especialização", "Pensamento independente", "Objetividade"], watchOut: "Pode se isolar em excesso e ter dificuldade em compartilhar recursos emocionais." },
  6: { label: "Leal", emoji: "🛡️", tagline: "O Questionador Comprometido", description: "Responsável, confiável e orientado à segurança. Extremamente leal às pessoas e grupos com quem se compromete.", strengths: ["Lealdade", "Comprometimento", "Pensamento estratégico", "Antecipação de riscos"], watchOut: "Pode ser ansioso e projetar inseguranças em situações sem real ameaça." },
  7: { label: "Entusiasta", emoji: "✨", tagline: "O Epicurista Espontâneo", description: "Espontâneo, versátil e otimista. Ama explorar possibilidades e traz energia e entusiasmo para tudo que faz.", strengths: ["Entusiasmo", "Criatividade", "Versatilidade", "Otimismo"], watchOut: "Pode ter dificuldade em comprometer-se a longo prazo e evitar o desconforto necessário." },
  8: { label: "Desafiador", emoji: "⚡", tagline: "O Protetor Poderoso", description: "Autoconfiante, decisivo e assertivo. Tem presença natural de liderança e não hesita em assumir o controle de situações.", strengths: ["Liderança", "Decisão", "Coragem", "Proteção dos outros"], watchOut: "Pode parecer intimidador e ter dificuldade em mostrar vulnerabilidade." },
  9: { label: "Pacificador", emoji: "🕊️", tagline: "O Mediador Receptivo", description: "Receptivo, calmo e estável. Tem capacidade única de ver todos os lados de uma situação e criar harmonia.", strengths: ["Mediação", "Equilíbrio", "Empatia ampla", "Estabilidade"], watchOut: "Pode evitar conflitos necessários e perder contato com suas próprias prioridades." },
};

const MBTI_INFO: Record<string, { name: string; tagline: string; description: string; strengths: string[]; watchOut: string }> = {
  ISTJ: { name: "O Inspetor", tagline: "Responsável e metódico", description: "Confiável, organizado e dedicado. Cumpre compromissos com rigor, valoriza tradição e é referência de estabilidade.", strengths: ["Confiabilidade", "Atenção a detalhes", "Organização", "Integridade"], watchOut: "Pode ter dificuldade com mudanças bruscas e flexibilidade." },
  ISFJ: { name: "O Protetor", tagline: "Dedicado e atencioso", description: "Carinhoso, responsável e comprometido. Cuida das necessidades alheias com atenção constante e entrega consistente.", strengths: ["Empatia", "Confiabilidade", "Atenção", "Cooperação"], watchOut: "Pode negligenciar as próprias necessidades ao cuidar demais dos outros." },
  INFJ: { name: "O Advogado", tagline: "Visionário e idealista", description: "Perspicaz, empático e determinado. Busca significado profundo e trabalha com intensidade por causas que acredita.", strengths: ["Visão estratégica", "Empatia", "Determinação", "Criatividade"], watchOut: "Pode se sobrecarregar ao buscar perfeição e isolamento emocional." },
  INTJ: { name: "O Arquiteto", tagline: "Estratégico e independente", description: "Analítico, estratégico e decidido. Tem visão de longo prazo e executa planos com eficiência e alto nível de exigência.", strengths: ["Planejamento", "Análise", "Autonomia", "Eficiência"], watchOut: "Pode ser excessivamente crítico e ter dificuldade em aceitar outras perspectivas." },
  ISTP: { name: "O Virtuoso", tagline: "Prático e curioso", description: "Observador, analítico e habilidoso. Aprende fazendo e resolve problemas complexos com lógica e eficiência prática.", strengths: ["Resolução de problemas", "Adaptabilidade", "Objetividade", "Habilidade técnica"], watchOut: "Pode ser impulsivo em decisões e ter dificuldade com comprometimento." },
  ISFP: { name: "O Aventureiro", tagline: "Flexível e criativo", description: "Gentil, aberto e presente. Vive o momento, valoriza estética e age com espontaneidade, bondade e sensibilidade.", strengths: ["Criatividade", "Flexibilidade", "Empatia", "Espontaneidade"], watchOut: "Pode evitar conflitos e ter dificuldade em afirmar suas próprias necessidades." },
  INFP: { name: "O Mediador", tagline: "Idealista e empático", description: "Criativo, idealista e profundamente empático. Busca autenticidade e significado em tudo o que faz e valoriza.", strengths: ["Criatividade", "Empatia", "Autenticidade", "Abertura"], watchOut: "Pode ser excessivamente idealista e sensível a críticas." },
  INTP: { name: "O Lógico", tagline: "Analítico e inventivo", description: "Curioso, analítico e objetivo. Explora ideias complexas com rigor intelectual e pensamento independente e inovador.", strengths: ["Análise lógica", "Criatividade intelectual", "Objetividade", "Curiosidade"], watchOut: "Pode ter dificuldade em comunicar ideias de forma acessível e decidir rapidamente." },
  ESTP: { name: "O Empreendedor", tagline: "Energético e direto", description: "Ativo, observador e pragmático. Age com rapidez, gosta de desafios concretos e aprende muito pela ação direta.", strengths: ["Ação", "Adaptabilidade", "Persuasão", "Pragmatismo"], watchOut: "Pode tomar riscos excessivos e ter dificuldade com planejamento de longo prazo." },
  ESFP: { name: "O Animador", tagline: "Espontâneo e sociável", description: "Entusiasta, amigável e presente. Traz alegria e energia ao ambiente e prospera em interações e experiências novas.", strengths: ["Entusiasmo", "Sociabilidade", "Flexibilidade", "Presença"], watchOut: "Pode ter dificuldade com disciplina e comprometimento de longo prazo." },
  ENFP: { name: "O Ativista", tagline: "Criativo e entusiasta", description: "Imaginativo, sociável e cheio de energia. Inspira os outros com entusiasmo, visão de possibilidades e ideias originais.", strengths: ["Criatividade", "Entusiasmo", "Empatia", "Comunicação"], watchOut: "Pode ter dificuldade em focar e concluir projetos iniciados." },
  ENTP: { name: "O Debatedor", tagline: "Inovador e argumentativo", description: "Inteligente, curioso e direto. Gosta de debater ideias, questionar o status quo e explorar soluções criativas e incomuns.", strengths: ["Inovação", "Análise", "Debate", "Resolução criativa"], watchOut: "Pode ser pouco diplomático e ter dificuldade em seguir rotinas." },
  ESTJ: { name: "O Executivo", tagline: "Organizado e decisivo", description: "Leal, organizado e focado em resultados. Lidera com clareza, cumpre regras e cria estruturas que funcionam.", strengths: ["Liderança", "Organização", "Confiabilidade", "Decisão"], watchOut: "Pode ser inflexível e ter dificuldade em aceitar abordagens não convencionais." },
  ESFJ: { name: "O Cônsul", tagline: "Cuidadoso e sociável", description: "Caloroso, leal e atento às necessidades da equipe. Cria harmonia, senso de pertencimento e cuida das relações.", strengths: ["Empatia", "Cooperação", "Organização", "Lealdade"], watchOut: "Pode ser excessivamente sensível a críticas e buscar aprovação em excesso." },
  ENFJ: { name: "O Protagonista", tagline: "Inspirador e empático", description: "Carismático, empático e orientado às pessoas. Lidera com paixão e genuíno interesse no desenvolvimento dos outros.", strengths: ["Liderança", "Empatia", "Comunicação", "Inspiração"], watchOut: "Pode se sobrecarregar ao colocar as necessidades alheias acima das suas." },
  ENTJ: { name: "O Comandante", tagline: "Líder nato e estratégico", description: "Assertivo, estratégico e eficiente. Assume a liderança naturalmente e busca sempre melhorar sistemas e resultados.", strengths: ["Liderança", "Planejamento", "Decisão", "Eficiência"], watchOut: "Pode parecer dominador e ter dificuldade em considerar o impacto emocional das decisões." },
};

export default async function ResultPage({ params }: Props) {
  const { token } = await params;

  const testLink = await prisma.testLink.findUnique({
    where: { token },
    include: { company: { select: { razaoSocial: true, logoUrl: true } } },
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

  const disc = result.discJson as { dominant: string; percentages: Record<string, number> };
  const enneagram = result.enneagramJson as { dominant: number; wing: number; scores: Record<string, number> } | null;
  const mbti = result.mbtiJson as { type: string; percentages: Record<string, number> } | null;

  const dominant = disc.dominant as keyof typeof DISC_INFO;
  const discInfo = DISC_INFO[dominant];
  const order = ["D", "I", "S", "C"] as const;

  const ennDominant = enneagram?.dominant;
  const ennWing = enneagram?.wing;
  const ennInfo = ennDominant ? ENNEAGRAM_INFO[ennDominant] : null;

  const mbtiType = mbti?.type;
  const mbtiInfo = mbtiType ? MBTI_INFO[mbtiType] : null;

  return (
    <main className="min-h-screen bg-[#F5F7F0] py-10 px-4">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Header */}
        <div className="bg-white rounded-2xl border border-gray-200 p-8 text-center">
          {testLink.company.logoUrl && (
            <img src={testLink.company.logoUrl} alt="Logo" className="h-10 mx-auto mb-3 object-contain" />
          )}
          <p className="text-sm text-gray-400 mb-4">{testLink.company.razaoSocial}</p>
          <h1 className="text-2xl font-bold text-[#4A5452] mb-1">Avaliação Comportamental Completa</h1>
          <p className="text-sm text-gray-500">DISC · Eneagrama · 16 Personalidades</p>
        </div>

        {/* ── DISC ── */}
        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-2">
            <span className="text-lg font-bold text-[#4A5452]">Etapa 1</span>
            <span className="text-sm text-gray-400">— Perfil DISC</span>
          </div>
          <div className="p-6 text-center border-b border-gray-100">
            <div className="text-4xl mb-2">{discInfo.emoji}</div>
            <h2 className="text-2xl font-bold text-gray-900 mb-0.5">Perfil {discInfo.label}</h2>
            <p className="text-sm text-gray-400">Seu perfil comportamental dominante</p>
          </div>
          <div className="p-6 border-b border-gray-100">
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-4">Distribuição DISC</h3>
            <div className="space-y-3">
              {order.map((type: any) => {
                const pct = disc.percentages[type as string] ?? 0;
                const typeInfo = DISC_INFO[type as keyof typeof DISC_INFO];
                return (
                  <div key={type}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium text-gray-700"><span className="font-bold">{type}</span> — {typeInfo.label}</span>
                      <span className="text-sm font-semibold text-gray-900">{pct}%</span>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-2.5">
                      <div className={`${typeInfo.color} h-2.5 rounded-full`} style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
          <div className={`m-4 rounded-xl border p-5 ${discInfo.lightColor}`}>
            <h3 className={`text-base font-bold mb-2 ${discInfo.textColor}`}>{discInfo.emoji} Sobre o seu perfil</h3>
            <p className="text-sm text-gray-700 leading-relaxed mb-4">{discInfo.description}</p>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Pontos fortes</h4>
                <ul className="space-y-1">{discInfo.strengths.map((s: any) => (<li key={s} className="text-sm text-gray-700 flex items-center gap-1.5"><span className="text-green-500">✓</span> {s}</li>))}</ul>
              </div>
              <div>
                <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Atenção</h4>
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
              <h2 className="text-2xl font-bold text-gray-900 mb-0.5">Tipo {ennDominant} — {ennInfo.label}</h2>
              <p className="text-sm text-gray-400">{ennInfo.tagline}</p>
              {ennWing && (<p className="text-xs text-gray-400 mt-1">Asa {ennDominant}w{ennWing} — influência do Tipo {ennWing} ({ENNEAGRAM_INFO[ennWing]?.label})</p>)}
            </div>
            <div className="p-6 border-b border-gray-100">
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-4">Pontuação por tipo</h3>
              <div className="space-y-2.5">
                {([1, 2, 3, 4, 5, 6, 7, 8, 9] as const).map((tipo) => {
                  const score = enneagram.scores[String(tipo)] ?? 0;
                  const pct = Math.round((score / 20) * 100);
                  const isDominant = tipo === ennDominant;
                  return (
                    <div key={tipo}>
                      <div className="flex items-center justify-between mb-0.5">
                        <span className={`text-sm ${isDominant ? "font-bold text-[#4A5452]" : "text-gray-600"}`}>Tipo {tipo} — {ENNEAGRAM_INFO[tipo].label}{isDominant && " ★"}</span>
                        <span className="text-sm text-gray-500">{score}/20</span>
                      </div>
                      <div className="w-full bg-gray-100 rounded-full h-2">
                        <div className="h-2 rounded-full" style={{ width: `${pct}%`, backgroundColor: isDominant ? "#C4FF57" : "#4A5452", opacity: isDominant ? 1 : 0.4 }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
            <div className="m-4 rounded-xl border border-[#C4FF57] bg-[#f9ffe6] p-5">
              <h3 className="text-base font-bold text-[#4A5452] mb-2">{ennInfo.emoji} Sobre o seu tipo</h3>
              <p className="text-sm text-gray-700 leading-relaxed mb-4">{ennInfo.description}</p>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Pontos fortes</h4>
                  <ul className="space-y-1">{ennInfo.strengths.map((s: any) => (<li key={s} className="text-sm text-gray-700 flex items-center gap-1.5"><span className="text-green-500">✓</span> {s}</li>))}</ul>
                </div>
                <div>
                  <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Atenção</h4>
                  <p className="text-sm text-gray-600">{ennInfo.watchOut}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── MBTI ── */}
        {mbtiInfo && mbti && (
          <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-2">
              <span className="text-lg font-bold text-[#4A5452]">Etapa 3</span>
              <span className="text-sm text-gray-400">— 16 Personalidades</span>
            </div>
            <div className="p-6 text-center border-b border-gray-100">
              <div
                className="inline-flex items-center justify-center w-20 h-20 rounded-2xl mb-3 text-2xl font-bold tracking-widest"
                style={{ backgroundColor: "#C4FF57", color: "#4A5452" }}
              >
                {mbtiType}
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-0.5">{mbtiInfo.name}</h2>
              <p className="text-sm text-gray-400">{mbtiInfo.tagline}</p>
            </div>

            {/* Dimension bars */}
            <div className="p-6 border-b border-gray-100">
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-4">Perfil por dimensão</h3>
              <div className="space-y-4">
                {(
                  [
                    ["E", "I", "Extroversão", "Introversão"],
                    ["S", "N", "Sensorial", "Intuitivo"],
                    ["T", "F", "Racional", "Sentimental"],
                    ["J", "P", "Julgamento", "Percepção"],
                  ] as const
                ).map(([a, b, la, lb]) => {
                  const pctA = mbti.percentages[a] ?? 50;
                  const pctB = 100 - pctA;
                  const dominant = pctA >= 50;
                  return (
                    <div key={a}>
                      <div className="flex items-center justify-between mb-1.5">
                        <span className={`text-sm font-semibold ${dominant ? "text-[#4A5452]" : "text-gray-400"}`}>{a} — {la}</span>
                        <span className={`text-sm font-semibold ${!dominant ? "text-[#4A5452]" : "text-gray-400"}`}>{b} — {lb}</span>
                      </div>
                      <div className="relative w-full h-3 bg-gray-100 rounded-full overflow-hidden">
                        <div className="absolute left-0 top-0 h-full rounded-l-full" style={{ width: `${pctA}%`, backgroundColor: dominant ? "#C4FF57" : "#e5e7eb" }} />
                        <div className="absolute right-0 top-0 h-full rounded-r-full" style={{ width: `${pctB}%`, backgroundColor: !dominant ? "#4A5452" : "#e5e7eb" }} />
                      </div>
                      <div className="flex items-center justify-between mt-0.5">
                        <span className="text-xs text-gray-400">{pctA}%</span>
                        <span className="text-xs text-gray-400">{pctB}%</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="m-4 rounded-xl border border-gray-200 bg-gray-50 p-5">
              <h3 className="text-base font-bold text-[#4A5452] mb-2">Sobre a sua personalidade</h3>
              <p className="text-sm text-gray-700 leading-relaxed mb-4">{mbtiInfo.description}</p>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Pontos fortes</h4>
                  <ul className="space-y-1">{mbtiInfo.strengths.map((s: any) => (<li key={s} className="text-sm text-gray-700 flex items-center gap-1.5"><span className="text-green-500">✓</span> {s}</li>))}</ul>
                </div>
                <div>
                  <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Atenção</h4>
                  <p className="text-sm text-gray-600">{mbtiInfo.watchOut}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        <p className="text-center text-xs text-gray-400 pb-4">
          Resultado gerado em{" "}
          {new Date(result.createdAt).toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" })}
        </p>
      </div>
    </main>
  );
}
