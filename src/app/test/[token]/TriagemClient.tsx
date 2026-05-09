"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface Props {
  token: string;
  perguntas: string[];
  companyName: string;
  logoUrl: string | null;
  candidateName: string | null;
}

export default function TriagemClient({
  token,
  perguntas,
  companyName,
  logoUrl,
  candidateName,
}: Props) {
  const router = useRouter();
  const [respostas, setRespostas] = useState<string[]>(
    new Array(perguntas.length).fill("")
  );
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const answeredCount = respostas.filter((r) => r.trim()).length;
  const allAnswered = answeredCount === perguntas.length;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!allAnswered) return;
    setSubmitting(true);
    setError("");
    try {
      const res = await fetch(`/api/test/${token}/triagem`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ respostas }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error ?? "Erro ao salvar respostas. Tente novamente.");
        return;
      }
      router.refresh();
    } catch {
      setError("Erro de conexão. Tente novamente.");
    } finally {
      setSubmitting(false);
    }
  };

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
          <div className="flex items-center gap-2 mt-2">
            <span
              className="w-5 h-5 rounded-full text-[10px] font-bold flex items-center justify-center flex-shrink-0"
              style={{ backgroundColor: "#4A5452", color: "#C4FF57" }}
            >
              ✎
            </span>
            <span className="text-[11px] font-medium text-gray-500 hidden sm:inline">
              Triagem
            </span>
            <div className="w-5 h-px bg-gray-300 mx-0.5" />
            {["DISC", "Eneagrama", "16 Personalidades"].map((label, i) => (
              <div key={label} className="flex items-center gap-1">
                <span
                  className="w-5 h-5 rounded-full text-[10px] font-bold flex items-center justify-center flex-shrink-0"
                  style={{ backgroundColor: "#e5e7eb", color: "#9ca3af" }}
                >
                  {i + 1}
                </span>
                <span className="text-[11px] font-medium text-gray-400 hidden sm:inline">
                  {label}
                </span>
                {i < 2 && <div className="w-5 h-px bg-gray-300 mx-0.5" />}
              </div>
            ))}
          </div>
        </div>
      </header>

      <div className="max-w-xl mx-auto px-4 py-8">
        <div className="bg-white rounded-2xl border border-gray-200 p-6 md:p-8">
          <div className="mb-6">
            <h1 className="text-xl font-bold text-[#4A5452] mb-1">
              Perguntas de triagem
            </h1>
            <p className="text-sm text-gray-500">
              Responda todas as perguntas antes de iniciar os testes comportamentais.
              Não há respostas certas ou erradas.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {perguntas.map((pergunta, i) => (
              <div key={i}>
                <label className="flex gap-2 text-sm font-semibold text-[#4A5452] mb-2 leading-snug">
                  <span
                    className="inline-flex items-center justify-center w-5 h-5 rounded-full text-white text-xs font-bold flex-shrink-0 mt-0.5"
                    style={{ backgroundColor: "#4A5452" }}
                  >
                    {i + 1}
                  </span>
                  {pergunta}
                </label>
                <textarea
                  value={respostas[i]}
                  onChange={(e) => {
                    const next = [...respostas];
                    next[i] = e.target.value;
                    setRespostas(next);
                  }}
                  rows={3}
                  placeholder="Sua resposta..."
                  className={`w-full border rounded-xl px-4 py-3 text-sm text-gray-900 placeholder-gray-400 focus:outline-none resize-none transition ${
                    respostas[i]?.trim()
                      ? "border-[#4A5452]/40 focus:border-[#4A5452]"
                      : "border-gray-200 focus:border-[#4A5452]"
                  }`}
                />
              </div>
            ))}

            <div className="pt-2 border-t border-gray-100">
              <p className="text-xs text-gray-400 mb-4 text-center">
                {answeredCount} de {perguntas.length} respondidas
              </p>

              {error && (
                <p className="text-red-500 text-sm bg-red-50 border border-red-100 rounded-xl px-4 py-3 mb-4">
                  {error}
                </p>
              )}

              {allAnswered ? (
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full bg-[#C4FF57] text-[#4A5452] font-bold py-4 rounded-xl text-base hover:bg-[#b3ee46] transition disabled:opacity-60"
                >
                  {submitting ? "Salvando..." : "Iniciar testes →"}
                </button>
              ) : (
                <p className="text-center text-xs text-gray-400">
                  Responda todas as perguntas para continuar
                </p>
              )}
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
