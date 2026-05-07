"use client";

import { useState, useEffect } from "react";
import type { Colaborador } from "./StepOrgChart";

export interface ColaboradorComToken extends Colaborador {
  token: string;
  resultados: string;
}

interface Props {
  colaboradores: Colaborador[];
  testOption: "ja_tenho" | "nao_tenho" | "";
  colaboradoresComToken: ColaboradorComToken[];
  onUpdate: (option: "ja_tenho" | "nao_tenho", items: ColaboradorComToken[]) => void;
  onNext: () => void;
  onBack: () => void;
}

export default function StepCollaboratorTests({
  colaboradores,
  testOption,
  colaboradoresComToken,
  onUpdate,
  onNext,
  onBack,
}: Props) {
  const [copied, setCopied] = useState<string | null>(null);

  // Generate tokens once on mount / when collaborators change
  useEffect(() => {
    if (colaboradoresComToken.length === colaboradores.length) return;
    const withTokens: ColaboradorComToken[] = colaboradores.map((c: any) => ({
      ...c,
      token: crypto.randomUUID(),
      resultados: "",
    }));
    onUpdate(testOption || "nao_tenho", withTokens);
  }, [colaboradores]); // eslint-disable-line react-hooks/exhaustive-deps

  const baseUrl = typeof window !== "undefined" ? window.location.origin : "";

  const handleOptionChange = (option: "ja_tenho" | "nao_tenho") => {
    onUpdate(option, colaboradoresComToken);
  };

  const updateResultados = (id: string, value: string) => {
    onUpdate(
      testOption as "ja_tenho" | "nao_tenho",
      colaboradoresComToken.map((c: any) => (c.id === id ? { ...c, resultados: value } : c))
    );
  };

  const copyLink = (token: string) => {
    navigator.clipboard.writeText(`${baseUrl}/test/${token}`);
    setCopied(token);
    setTimeout(() => setCopied(null), 2000);
  };

  // If no collaborators, just let them proceed
  if (colaboradores.length === 0) {
    return (
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-1">Testes dos colaboradores</h2>
        <p className="text-gray-500 text-sm mb-6">
          Nenhum colaborador foi cadastrado na etapa anterior. Você pode adicionar avaliações individualmente no dashboard.
        </p>
        <div className="bg-[#F5F7F0] rounded-xl p-6 text-center text-sm text-gray-500">
          Os links de avaliação estarão disponíveis no dashboard após o cadastro.
        </div>
        <div className="flex gap-3 mt-8">
          <button onClick={onBack} className="border border-gray-300 text-gray-700 py-3 px-4 rounded-lg font-medium hover:bg-gray-50 transition" style={{ minHeight: "48px" }}>
            ← Voltar
          </button>
          <button onClick={onNext} className="flex-1 bg-[#4A5452] text-white py-3 rounded-lg font-medium hover:bg-[#3a4442] transition" style={{ minHeight: "48px" }}>
            Continuar →
          </button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-900 mb-1">Testes dos colaboradores</h2>
      <p className="text-gray-500 text-sm mb-6">
        Como prefere coletar os perfis comportamentais do seu time?
      </p>

      {/* Radio options */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
        {[
          { id: "nao_tenho", label: "Ainda não tenho", desc: "Enviar link de avaliação para cada colaborador", emoji: "🔗" },
          { id: "ja_tenho", label: "Já tenho os resultados", desc: "Inserir os resultados manualmente por colaborador", emoji: "📋" },
        ].map((opt: any) => (
          <button
            key={opt.id}
            onClick={() => handleOptionChange(opt.id as "ja_tenho" | "nao_tenho")}
            className={`p-4 rounded-xl border-2 text-left transition ${
              testOption === opt.id
                ? "border-[#4A5452] bg-[#F5F7F0]"
                : "border-gray-200 hover:border-[#4A5452]"
            }`}
          >
            <div className="text-xl mb-1">{opt.emoji}</div>
            <p className="text-sm font-semibold text-gray-800">{opt.label}</p>
            <p className="text-xs text-gray-500 mt-0.5">{opt.desc}</p>
          </button>
        ))}
      </div>

      {/* Content per collaborator */}
      {testOption === "nao_tenho" && (
        <div className="space-y-3">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
            Links de avaliação — {colaboradoresComToken.length} colaborador{colaboradoresComToken.length !== 1 ? "es" : ""}
          </p>
          {colaboradoresComToken.map((c: any) => {
            const url = `${baseUrl}/test/${c.token}`;
            const isCopied = copied === c.token;
            return (
              <div key={c.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl border border-gray-200">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-[#4A5452] truncate">{c.nome}</p>
                  <p className="text-xs text-gray-400 truncate">{c.cargo}</p>
                  <p className="text-xs text-gray-400 font-mono truncate mt-0.5">{url}</p>
                </div>
                <button
                  onClick={() => copyLink(c.token)}
                  className={`flex-shrink-0 px-3 py-2 rounded-lg text-xs font-semibold transition ${
                    isCopied
                      ? "bg-green-100 text-green-700"
                      : "bg-[#C4FF57] text-[#4A5452] hover:bg-[#b3ee46]"
                  }`}
                  style={{ minHeight: "36px", minWidth: "80px" }}
                >
                  {isCopied ? "✓ Copiado" : "Copiar link"}
                </button>
              </div>
            );
          })}
          <p className="text-xs text-gray-400 mt-1">
            Os links são gerados quando você finalizar o cadastro.
          </p>
        </div>
      )}

      {testOption === "ja_tenho" && (
        <div className="space-y-3">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
            Resultados existentes
          </p>
          {colaboradoresComToken.map((c: any) => (
            <div key={c.id} className="border border-gray-200 rounded-xl p-4">
              <p className="text-sm font-semibold text-[#4A5452] mb-1">
                {c.nome} <span className="font-normal text-gray-400">— {c.cargo}</span>
              </p>
              <textarea
                value={c.resultados}
                onChange={(e) => updateResultados(c.id, e.target.value)}
                placeholder="Cole aqui os resultados de DISC, Eneagrama ou outra avaliação já realizada..."
                rows={3}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#4A5452] resize-none mt-1"
              />
            </div>
          ))}
        </div>
      )}

      {!testOption && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-700">
          Selecione uma opção acima para continuar.
        </div>
      )}

      <div className="flex gap-3 mt-8">
        <button
          onClick={onBack}
          className="border border-gray-300 text-gray-700 py-3 px-4 rounded-lg font-medium hover:bg-gray-50 transition"
          style={{ minHeight: "48px" }}
        >
          ← Voltar
        </button>
        <button
          onClick={onNext}
          disabled={!testOption}
          className="flex-1 bg-[#4A5452] text-white py-3 rounded-lg font-medium hover:bg-[#3a4442] transition disabled:opacity-40 disabled:cursor-not-allowed"
          style={{ minHeight: "48px" }}
        >
          Continuar →
        </button>
      </div>
    </div>
  );
}
