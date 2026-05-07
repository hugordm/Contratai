"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { enneagramQuestions } from "@/lib/enneagram/questions";

interface Props {
  token: string;
}

const SCALE_LABELS: Record<number, string> = {
  1: "Discordo totalmente",
  2: "Discordo",
  3: "Neutro",
  4: "Concordo",
  5: "Concordo totalmente",
};

export default function EnneagramClient({ token }: Props) {
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [current, setCurrent] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  const total = enneagramQuestions.length;
  const question = enneagramQuestions[current];
  const answered = Object.keys(answers).length;
  const progress = Math.round((answered / total) * 100);

  const select = (questionId: number, score: number) => {
    setAnswers((prev) => ({ ...prev, [questionId]: score }));
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
      const res = await fetch("/api/enneagram/submit", {
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
      router.push(`/test/${token}/result`);
    } catch {
      setError("Erro de conexão. Tente novamente.");
      setLoading(false);
    }
  };

  return (
    <div className="flex items-start justify-center p-4 pt-6 pb-12">
      <div className="bg-white rounded-2xl border border-gray-200 w-full max-w-xl p-6 md:p-8">
        {/* Progress */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-base font-medium text-gray-500">
              Pergunta {current + 1} de {total}
            </span>
            <span className="text-sm text-gray-400">{answered} respondidas</span>
          </div>
          <div className="w-full bg-gray-100 rounded-full h-2.5">
            <div
              className="h-2.5 rounded-full transition-all duration-300"
              style={{ width: `${progress}%`, backgroundColor: "#C4FF57" }}
            />
          </div>
        </div>

        {/* Question */}
        <div className="mb-8">
          <h2 className="text-lg font-semibold text-[#4A5452] mb-1 leading-snug">
            {question.text}
          </h2>
          <p className="text-sm text-gray-400 mb-6">
            Escolha o quanto essa afirmação descreve você.
          </p>

          <div className="flex flex-col gap-3">
            {([1, 2, 3, 4, 5] as const).map((score) => {
              const selected = answers[question.id] === score;
              return (
                <button
                  key={score}
                  onClick={() => select(question.id, score)}
                  className={`flex items-center gap-4 p-4 rounded-xl border-2 text-left transition-all ${
                    selected
                      ? "border-[#4A5452] bg-[#4A5452] text-white"
                      : "border-gray-200 hover:border-[#4A5452] text-gray-700"
                  }`}
                  style={{ minHeight: "52px" }}
                >
                  <span
                    className={`flex-shrink-0 w-8 h-8 rounded-full border-2 flex items-center justify-center text-sm font-bold ${
                      selected
                        ? "border-[#C4FF57] bg-[#C4FF57] text-[#4A5452]"
                        : "border-gray-300 text-gray-500"
                    }`}
                  >
                    {score}
                  </span>
                  <span className="text-sm font-medium">{SCALE_LABELS[score]}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Navigation */}
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
              className="font-bold px-6 py-3 rounded-xl text-base transition disabled:opacity-50"
              style={{
                backgroundColor: "#C4FF57",
                color: "#4A5452",
                minHeight: "52px",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#b3ee46")}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "#C4FF57")}
            >
              {loading ? "Enviando..." : "Ver resultado →"}
            </button>
          )}
        </div>

        {/* Dot navigator */}
        <div className="flex flex-wrap gap-1.5 mt-6 justify-center">
          {enneagramQuestions.map((q: any, idx: number) => (
            <button
              key={q.id}
              onClick={() => setCurrent(idx)}
              className="w-4 h-4 rounded-full transition-all"
              style={{
                backgroundColor: idx === current
                  ? "#C4FF57"
                  : answers[q.id]
                  ? "#4A5452"
                  : "#FF6B6B",
                minHeight: "16px",
                minWidth: "16px",
                outline: idx === current ? "2px solid white" : "none",
                outlineOffset: "1px",
                boxShadow: idx === current ? "0 0 0 2px #4A5452" : "none",
              }}
              title={`Pergunta ${idx + 1}`}
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
