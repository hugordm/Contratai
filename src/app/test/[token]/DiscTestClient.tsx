"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { discQuestions } from "@/lib/disc/questions";

type DiscType = "D" | "I" | "S" | "C";

interface Props {
  token: string;
  candidateName: string | null;
  companyName: string;
}

function ConsentScreen({
  companyName,
  onAccept,
}: {
  companyName: string;
  onAccept: () => void;
}) {
  const [checked, setChecked] = useState(false);

  return (
    <div className="min-h-screen bg-[#F5F7F0] flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl border border-gray-200 w-full max-w-xl p-6 md:p-8">
        <h1 className="text-2xl font-bold text-[#4A5452] mb-2">
          Teste de Perfil Comportamental
        </h1>
        <p className="text-gray-500 text-base mb-6">
          28 perguntas · aproximadamente 5 minutos
        </p>

        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6">
          <p className="text-sm text-amber-800 leading-relaxed">
            <strong>Aviso SATEPSI:</strong> Este teste é uma ferramenta de
            autoconhecimento e suporte a RH, não uma avaliação psicológica
            clínica oficial. Os resultados não substituem avaliações realizadas
            por profissionais de saúde mental habilitados.
          </p>
        </div>

        <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 mb-6">
          <h2 className="text-sm font-semibold text-gray-700 mb-2">
            Como funciona
          </h2>
          <ul className="text-sm text-gray-600 space-y-1">
            <li>• Não há respostas certas ou erradas</li>
            <li>• Escolha a palavra que mais te descreve naturalmente</li>
            <li>• Seja espontâneo — a primeira impressão costuma ser a mais fiel</li>
          </ul>
        </div>

        <label className="flex items-start gap-3 cursor-pointer mb-8">
          <div className="mt-0.5 flex-shrink-0">
            <input
              type="checkbox"
              checked={checked}
              onChange={(e) => setChecked(e.target.checked)}
              className="w-5 h-5 accent-[#4A5452] cursor-pointer"
            />
          </div>
          <span className="text-sm text-gray-700 leading-relaxed">
            Concordo com o uso dos meus dados para fins de recrutamento por{" "}
            <strong>{companyName}</strong>, conforme a{" "}
            <a
              href="/privacidade"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#4A5452] underline hover:text-black"
            >
              Política de Privacidade
            </a>
            . Entendo que estes dados serão tratados de acordo com a Lei Geral
            de Proteção de Dados (LGPD — Lei 13.709/2018).
          </span>
        </label>

        <button
          onClick={onAccept}
          disabled={!checked}
          className="w-full bg-[#C4FF57] text-[#4A5452] font-bold py-4 rounded-xl text-base transition hover:bg-[#b3ee46] disabled:opacity-40 disabled:cursor-not-allowed"
          style={{ minHeight: "52px" }}
        >
          Iniciar Teste →
        </button>
      </div>
    </div>
  );
}

export default function DiscTestClient({ token, candidateName, companyName }: Props) {
  const [consented, setConsented] = useState(false);
  const [answers, setAnswers] = useState<Record<number, DiscType>>({});
  const [current, setCurrent] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  if (!consented) {
    return (
      <ConsentScreen
        companyName={companyName}
        onAccept={() => setConsented(true)}
      />
    );
  }

  const total = discQuestions.length;
  const question = discQuestions[current];
  const answered = Object.keys(answers).length;
  const progress = Math.round((answered / total) * 100);

  const select = (questionId: number, type: DiscType) => {
    setAnswers((prev) => ({ ...prev, [questionId]: type }));
    if (current < total - 1) {
      setTimeout(() => setCurrent((c) => c + 1), 220);
    }
  };

  const submit = async () => {
    if (answered < total) {
      setError(`Responda todas as perguntas antes de enviar (${answered}/${total})`);
      return;
    }
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/disc/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, answers }),
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error ?? "Erro ao enviar");
        setLoading(false);
        return;
      }
      router.push(`/test/${token}`);
    } catch {
      setError("Erro de conexão. Tente novamente.");
      setLoading(false);
    }
  };

  return (
    <div className="flex items-start justify-center p-4 pt-6 pb-12">
      <div className="bg-white rounded-2xl border border-gray-200 w-full max-w-xl p-6 md:p-8">
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-base font-medium text-gray-500">
              Pergunta {current + 1} de {total}
            </span>
            <span className="text-sm text-gray-400">{answered} respondidas</span>
          </div>
          <div className="w-full bg-gray-100 rounded-full h-2.5">
            <div
              className="bg-[#C4FF57] h-2.5 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        <div className="mb-8">
          <h2 className="text-xl font-semibold text-[#4A5452] mb-1">
            Qual palavra mais te descreve?
          </h2>
          <p className="text-base text-gray-500 mb-6">
            Escolha a que melhor representa você no trabalho.
          </p>

          <div className="grid grid-cols-2 gap-3">
            {question.options.map((opt: any) => {
              const selected = answers[question.id] === opt.type;
              return (
                <button
                  key={opt.type}
                  onClick={() => select(question.id, opt.type as DiscType)}
                  className={`p-4 rounded-xl border-2 text-left transition-all ${
                    selected
                      ? "border-[#4A5452] bg-[#4A5452] text-white"
                      : "border-gray-200 hover:border-[#4A5452] text-gray-700"
                  }`}
                  style={{ minHeight: "56px" }}
                >
                  <span className="font-medium text-base">{opt.text}</span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="flex items-center justify-between">
          <button
            onClick={() => setCurrent((c) => Math.max(0, c - 1))}
            disabled={current === 0}
            className="text-base text-gray-500 hover:text-gray-700 disabled:opacity-30 transition py-3 px-2"
            style={{ minHeight: "44px" }}
          >
            ← Anterior
          </button>

          {current < total - 1 ? (
            <button
              onClick={() => setCurrent((c) => Math.min(total - 1, c + 1))}
              className="text-base text-[#4A5452] hover:text-black font-medium transition py-3 px-2"
              style={{ minHeight: "44px" }}
            >
              Próxima →
            </button>
          ) : (
            <button
              onClick={submit}
              disabled={loading || answered < total}
              className="bg-[#C4FF57] text-[#4A5452] font-bold px-6 py-3 rounded-xl text-base hover:bg-[#b3ee46] transition disabled:opacity-50"
              style={{ minHeight: "52px" }}
            >
              {loading ? "Enviando..." : "Ver resultado →"}
            </button>
          )}
        </div>

        <div className="flex flex-wrap gap-1.5 mt-6 justify-center">
          {discQuestions.map((q: any, idx: number) => (
            <button
              key={q.id}
              onClick={() => setCurrent(idx)}
              className="w-4 h-4 rounded-full transition-all"
              title={`Pergunta ${idx + 1}`}
              style={{
                minHeight: "16px",
                minWidth: "16px",
                backgroundColor: idx === current
                  ? "#C4FF57"
                  : answers[q.id]
                  ? "#4A5452"
                  : "#FF6B6B",
                outline: idx === current ? "2px solid white" : "none",
                outlineOffset: "1px",
                boxShadow: idx === current ? "0 0 0 2px #4A5452" : "none",
              }}
            />
          ))}
        </div>

        {error && (
          <p className="text-red-500 text-base text-center mt-4">{error}</p>
        )}
      </div>
    </div>
  );
}
