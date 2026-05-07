"use client";

import { useState } from "react";
import Link from "next/link";
import ChatSidebar from "@/components/ui/ChatSidebar";

interface MatchRelatorio {
  candidateId: string;
  matchScore: number;
  justificativa: string;
  pontosFortres: string[];
  pontosAtencao: string[];
  comoDelegarTarefas: string;
  comoDarFeedback: string;
  fitCultura: string;
  perguntasComplementares: string[];
  desafioTecnico?: DesafioTecnico;
}

interface DesafioTecnico {
  titulo: string;
  duracao: string;
  objetivo: string;
  contexto: string;
  tarefas: string[];
  entregaveis: string[];
  criteriosAvaliacao: string[];
  observacoes: string;
}

interface ReportItem {
  id: string;
  candidateId: string;
  candidateNome: string;
  candidateEmail: string;
  rankingPosition: number | null;
  matchScore: number | null;
  relatorio: MatchRelatorio | null;
}

interface Props {
  jobId: string;
  jobTitulo: string;
  totalCandidates: number;
  discCompletedCount: number;
  initialReports: ReportItem[];
}

function scoreColor(score: number) {
  if (score >= 75) return { bar: "bg-[#C4FF57]", text: "text-[#2d7a00]", bg: "bg-[#f0fff0]" };
  if (score >= 50) return { bar: "bg-amber-400", text: "text-amber-700", bg: "bg-amber-50" };
  return { bar: "bg-red-400", text: "text-red-700", bg: "bg-red-50" };
}

function ScoreBar({ score }: { score: number }) {
  const colors = scoreColor(score);
  return (
    <div className="flex items-center gap-3">
      <div className="flex-1 h-2.5 bg-gray-200 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-700 ${colors.bar}`}
          style={{ width: `${score}%` }}
        />
      </div>
      <span className={`text-sm font-bold w-12 text-right ${colors.text}`}>{score}/100</span>
    </div>
  );
}

export default function MatchClient({
  jobId,
  jobTitulo,
  totalCandidates,
  discCompletedCount,
  initialReports,
}: Props) {
  const [reports, setReports] = useState<ReportItem[]>(initialReports);
  const [running, setRunning] = useState(false);
  const [error, setError] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [generatingDesafio, setGeneratingDesafio] = useState<string | null>(null);

  const runMatch = async () => {
    setRunning(true);
    setError("");
    try {
      const res = await fetch(`/api/vagas/${jobId}/match`, { method: "POST" });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error ?? "Erro ao executar match. Tente novamente.");
        return;
      }
      const data: ReportItem[] = await res.json();
      setReports(data);
      if (data.length > 0) setExpandedId(data[0].id);
    } catch {
      setError("Erro de conexão. Tente novamente.");
    } finally {
      setRunning(false);
    }
  };

  const generateDesafio = async (report: ReportItem) => {
    setGeneratingDesafio(report.id);
    try {
      const res = await fetch(`/api/vagas/${jobId}/desafio`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reportId: report.id }),
      });
      if (!res.ok) return;
      const { desafio } = await res.json();
      setReports((prev) =>
        prev.map((r) =>
          r.id === report.id
            ? { ...r, relatorio: r.relatorio ? { ...r.relatorio, desafioTecnico: desafio } : r.relatorio }
            : r
        )
      );
    } finally {
      setGeneratingDesafio(null);
    }
  };

  const noDisc = discCompletedCount === 0;
  const hasReports = reports.length > 0;

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-6 flex items-center justify-between gap-4">
        <Link href={`/vagas/${jobId}`} className="text-sm text-gray-500 hover:text-gray-700 transition">
          ← Voltar para a vaga
        </Link>
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 p-5 md:p-8 mb-6">
        <div className="flex flex-col sm:flex-row sm:items-start gap-4">
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-1">Match com IA</p>
            <h1 className="text-xl md:text-2xl font-bold text-[#4A5452] leading-tight">{jobTitulo}</h1>
            <p className="text-sm text-gray-500 mt-1">
              {totalCandidates} candidato{totalCandidates !== 1 ? "s" : ""} · {discCompletedCount} com avaliação
            </p>
          </div>

          {!noDisc && (
            <button
              onClick={runMatch}
              disabled={running}
              className="bg-[#C4FF57] text-[#4A5452] font-bold px-5 py-3 rounded-xl text-sm hover:bg-[#b3ee46] transition disabled:opacity-50 flex-shrink-0 w-full sm:w-auto"
              style={{ minHeight: "44px" }}
            >
              {running ? "Analisando..." : hasReports ? "Reanalisar" : "✨ Executar Match"}
            </button>
          )}
        </div>
      </div>

      {noDisc && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6 text-center">
          <p className="text-2xl mb-3">⏳</p>
          <p className="font-semibold text-amber-800">Aguardando testes DISC</p>
          <p className="text-sm text-amber-700 mt-1">
            Nenhum candidato completou a avaliação DISC ainda. Envie o link de teste e aguarde as respostas.
          </p>
          <Link
            href={`/vagas/${jobId}`}
            className="inline-block mt-4 text-sm font-semibold text-amber-700 underline"
          >
            Gerenciar candidatos →
          </Link>
        </div>
      )}

      {running && <MatchSkeleton />}

      {error && !running && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-red-700 text-sm mb-4">
          {error}
        </div>
      )}

      {!running && hasReports && (
        <div className="space-y-4">
          {reports.map((report) => {
            const rel = report.relatorio;
            const score = report.matchScore ?? 0;
            const colors = scoreColor(score);
            const isExpanded = expandedId === report.id;

            return (
              <div
                key={report.id}
                className={`bg-white rounded-2xl border transition ${
                  isExpanded ? "border-[#4A5452]" : "border-gray-200"
                }`}
              >
                <button
                  onClick={() => setExpandedId(isExpanded ? null : report.id)}
                  className="w-full p-5 md:p-6 text-left"
                >
                  <div className="flex items-center gap-4">
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 ${colors.bg} ${colors.text}`}
                    >
                      #{report.rankingPosition}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <p className="font-semibold text-[#4A5452] truncate">{report.candidateNome}</p>
                        <span className={`text-xs font-bold flex-shrink-0 ${colors.text}`}>
                          {score}/100
                        </span>
                      </div>
                      <ScoreBar score={score} />
                    </div>
                    <span className="text-gray-400 flex-shrink-0">{isExpanded ? "▲" : "▼"}</span>
                  </div>
                </button>

                {isExpanded && rel && (
                  <div className="px-5 md:px-6 pb-6 border-t border-gray-100 space-y-6 pt-5">
                    <div>
                      <SectionTitle>Análise geral</SectionTitle>
                      <p className="text-sm text-gray-700 leading-relaxed">{rel.justificativa}</p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <SectionTitle>Pontos fortes</SectionTitle>
                        <ul className="space-y-2">
                          {rel.pontosFortres?.map((p, i) => (
                            <li key={i} className="flex gap-2 text-sm">
                              <span className="text-[#C4FF57] font-bold flex-shrink-0">✓</span>
                              <span className="text-gray-700">{p}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                      <div>
                        <SectionTitle>Pontos de atenção</SectionTitle>
                        <ul className="space-y-2">
                          {rel.pontosAtencao?.map((p, i) => (
                            <li key={i} className="flex gap-2 text-sm">
                              <span className="text-amber-500 font-bold flex-shrink-0">⚠</span>
                              <span className="text-gray-700">{p}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>

                    <div>
                      <SectionTitle>Fit cultural</SectionTitle>
                      <p className="text-sm text-gray-700 leading-relaxed">{rel.fitCultura}</p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="bg-[#F5F7F0] rounded-xl p-4">
                        <SectionTitle>Como delegar tarefas</SectionTitle>
                        <p className="text-sm text-gray-700 leading-relaxed">{rel.comoDelegarTarefas}</p>
                      </div>
                      <div className="bg-[#F5F7F0] rounded-xl p-4">
                        <SectionTitle>Como dar feedback</SectionTitle>
                        <p className="text-sm text-gray-700 leading-relaxed">{rel.comoDarFeedback}</p>
                      </div>
                    </div>

                    <div>
                      <SectionTitle>Perguntas para entrevista</SectionTitle>
                      <ol className="space-y-2">
                        {rel.perguntasComplementares?.map((q, i) => (
                          <li key={i} className="flex gap-3 text-sm text-gray-700">
                            <span className="w-6 h-6 rounded-full bg-[#4A5452] text-white text-xs flex items-center justify-center font-bold flex-shrink-0 mt-0.5">
                              {i + 1}
                            </span>
                            {q}
                          </li>
                        ))}
                      </ol>
                    </div>

                    {rel.desafioTecnico ? (
                      <div className="border border-[#C4FF57] bg-[#f7ffe8] rounded-xl p-5">
                        <div className="flex items-center gap-2 mb-3">
                          <span className="text-lg">🎯</span>
                          <SectionTitle>Desafio técnico — {rel.desafioTecnico.titulo}</SectionTitle>
                          <span className="ml-auto text-xs text-gray-500">{rel.desafioTecnico.duracao}</span>
                        </div>
                        <p className="text-sm text-gray-700 mb-3">{rel.desafioTecnico.objetivo}</p>
                        <p className="text-sm text-gray-600 mb-3 italic">{rel.desafioTecnico.contexto}</p>
                        <div className="grid sm:grid-cols-2 gap-4">
                          <div>
                            <p className="text-xs font-semibold text-[#4A5452] uppercase tracking-wide mb-2">Tarefas</p>
                            <ul className="space-y-1">
                              {rel.desafioTecnico.tarefas?.map((t, i) => (
                                <li key={i} className="text-sm text-gray-700 flex gap-2">
                                  <span className="text-[#4A5452] font-bold">·</span>{t}
                                </li>
                              ))}
                            </ul>
                          </div>
                          <div>
                            <p className="text-xs font-semibold text-[#4A5452] uppercase tracking-wide mb-2">Entregáveis</p>
                            <ul className="space-y-1">
                              {rel.desafioTecnico.entregaveis?.map((e, i) => (
                                <li key={i} className="text-sm text-gray-700 flex gap-2">
                                  <span className="text-[#4A5452] font-bold">·</span>{e}
                                </li>
                              ))}
                            </ul>
                          </div>
                        </div>
                        <div className="mt-4">
                          <p className="text-xs font-semibold text-[#4A5452] uppercase tracking-wide mb-2">Critérios de avaliação</p>
                          <ul className="space-y-1">
                            {rel.desafioTecnico.criteriosAvaliacao?.map((c, i) => (
                              <li key={i} className="text-sm text-gray-700 flex gap-2">
                                <span className="text-green-600 font-bold">✓</span>{c}
                              </li>
                            ))}
                          </ul>
                        </div>
                        {rel.desafioTecnico.observacoes && (
                          <div className="mt-4 bg-white rounded-lg p-3 border border-[#C4FF57]">
                            <p className="text-xs font-semibold text-[#4A5452] uppercase tracking-wide mb-1">Dica para o avaliador</p>
                            <p className="text-sm text-gray-700">{rel.desafioTecnico.observacoes}</p>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="pt-2">
                        <button
                          onClick={() => generateDesafio(report)}
                          disabled={generatingDesafio === report.id}
                          className="flex items-center gap-2 text-sm font-semibold border border-[#4A5452] text-[#4A5452] px-4 py-2.5 rounded-xl hover:bg-[#4A5452] hover:text-white transition disabled:opacity-50"
                        >
                          {generatingDesafio === report.id ? (
                            <>
                              <span className="animate-spin">⟳</span> Gerando desafio...
                            </>
                          ) : (
                            <>🎯 Gerar desafio técnico</>
                          )}
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {!running && !hasReports && !noDisc && (
        <div className="bg-white rounded-2xl border border-gray-200 p-10 text-center">
          <p className="text-4xl mb-4">🤖</p>
          <p className="font-semibold text-[#4A5452] text-lg mb-2">Pronto para analisar</p>
          <p className="text-sm text-gray-500 max-w-sm mx-auto">
            {discCompletedCount} candidato{discCompletedCount !== 1 ? "s" : ""} com DISC concluído. Clique em{" "}
            <strong>Executar Match</strong> para gerar o ranking com análise completa de fit.
          </p>
        </div>
      )}

      <ChatSidebar jobId={jobId} />
    </div>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="text-xs font-semibold text-[#4A5452] uppercase tracking-widest mb-2">
      {children}
    </h3>
  );
}

function MatchSkeleton() {
  return (
    <div className="space-y-4 animate-pulse">
      {[1, 2, 3].map((i) => (
        <div key={i} className="bg-white rounded-2xl border border-gray-200 p-5">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-gray-200 rounded-full" />
            <div className="flex-1 space-y-2">
              <div className="h-4 bg-gray-200 rounded w-1/3" />
              <div className="h-2.5 bg-gray-200 rounded-full" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
