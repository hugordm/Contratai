"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";

interface VagaInfo {
  titulo: string;
  empresa: string;
  logoUrl: string | null;
  perguntas: string[];
}

export default function CandidaturaPage() {
  const params = useParams();
  const vagaId = params.vagaId as string;
  const router = useRouter();

  const [vaga, setVaga] = useState<VagaInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  const [step, setStep] = useState<"form" | "triagem">("form");

  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [linkedinUrl, setLinkedinUrl] = useState("");
  const [cvBase64, setCvBase64] = useState<string | null>(null);
  const [cvFileName, setCvFileName] = useState("");
  const [cvError, setCvError] = useState("");
  const [errors, setErrors] = useState<{ nome?: string; email?: string }>({});

  const [respostas, setRespostas] = useState<string[]>([]);

  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");

  useEffect(() => {
    fetch(`/api/candidatura/${vagaId}`)
      .then((r) => {
        if (r.status === 404) { setNotFound(true); return null; }
        return r.json();
      })
      .then((data) => {
        if (data) setVaga({ ...data, perguntas: data.perguntas ?? [] });
      })
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));
  }, [vagaId]);

  const validate = () => {
    const e: { nome?: string; email?: string } = {};
    if (!nome.trim()) e.nome = "Nome é obrigatório";
    if (!email.trim()) e.email = "E-mail é obrigatório";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) e.email = "E-mail inválido";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleFormNext = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    if (vaga && vaga.perguntas.length > 0) {
      setRespostas(new Array(vaga.perguntas.length).fill(""));
      setSubmitError("");
      setStep("triagem");
    } else {
      handleFinalSubmit([]);
    }
  };

  const handleCvUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setCvError("");
    if (file.type !== "application/pdf") {
      setCvError("Apenas arquivos PDF são aceitos.");
      e.target.value = "";
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setCvError("Arquivo deve ter no máximo 5MB.");
      e.target.value = "";
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      setCvBase64(reader.result as string);
      setCvFileName(file.name);
    };
    reader.readAsDataURL(file);
  };

  const handleFinalSubmit = async (respostasArr: string[]) => {
    setSubmitting(true);
    setSubmitError("");
    try {
      const body: Record<string, unknown> = { nome: nome.trim(), email: email.trim() };
      if (linkedinUrl.trim()) body.linkedinUrl = linkedinUrl.trim();
      if (cvBase64) body.cvBase64 = cvBase64;
      if (respostasArr.length > 0) {
        body.respostasJson = respostasArr;
      }
      const res = await fetch(`/api/candidatura/${vagaId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) {
        setSubmitError(data.error ?? "Erro ao iniciar avaliação. Tente novamente.");
        return;
      }
      router.push(`/test/${data.token}`);
    } catch {
      setSubmitError("Erro de conexão. Tente novamente.");
    } finally {
      setSubmitting(false);
    }
  };

  const allAnswered =
    respostas.length > 0 && respostas.every((r) => r.trim().length > 0);

  if (loading) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-[#F5F7F0]">
        <div className="w-8 h-8 border-4 border-[#C4FF57] border-t-transparent rounded-full animate-spin" />
      </main>
    );
  }

  if (notFound || !vaga) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-[#F5F7F0] px-4">
        <div className="text-center">
          <p className="text-2xl font-bold text-[#4A5452] mb-2">Vaga não encontrada</p>
          <p className="text-gray-500 text-sm">Este link pode ter expirado ou ser inválido.</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#F5F7F0] flex flex-col items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        {/* Header da empresa */}
        <div className="bg-[#4A5452] rounded-2xl px-6 py-8 mb-6 text-center">
          {vaga.logoUrl ? (
            <img
              src={vaga.logoUrl}
              alt={vaga.empresa}
              className="h-14 w-auto mx-auto mb-3 rounded-lg object-contain"
            />
          ) : (
            <p className="text-[#C4FF57] font-bold text-xl mb-1">{vaga.empresa}</p>
          )}
          <p className="text-white/60 text-sm">está com uma vaga aberta</p>
          <p className="text-white font-bold text-lg mt-2">{vaga.titulo}</p>
        </div>

        {/* Indicador de etapas (só quando há triagem) */}
        {vaga.perguntas.length > 0 && (
          <div className="flex items-center gap-2 mb-4 px-1">
            <div className={`flex-1 h-1.5 rounded-full transition-all ${step === "form" ? "bg-[#C4FF57]" : "bg-[#C4FF57]"}`} />
            <div className={`flex-1 h-1.5 rounded-full transition-all ${step === "triagem" ? "bg-[#C4FF57]" : "bg-gray-200"}`} />
          </div>
        )}

        {/* ETAPA 1 — Dados pessoais */}
        {step === "form" && (
          <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
            <h1 className="text-xl font-bold text-[#4A5452] mb-1">Candidatar-se</h1>
            <p className="text-gray-500 text-sm mb-6">
              Preencha seus dados para iniciar a avaliação de perfil comportamental.
            </p>

            <form onSubmit={handleFormNext} noValidate className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">
                  Nome completo <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={nome}
                  onChange={(e) => { setNome(e.target.value); setErrors((p) => ({ ...p, nome: undefined })); }}
                  placeholder="Seu nome completo"
                  className={`w-full border rounded-xl px-4 py-3 text-sm text-gray-900 placeholder-gray-400 focus:outline-none transition ${
                    errors.nome ? "border-red-400 focus:border-red-500" : "border-gray-200 focus:border-[#4A5452]"
                  }`}
                />
                {errors.nome && <p className="text-red-500 text-xs mt-1">{errors.nome}</p>}
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">
                  E-mail <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => { setEmail(e.target.value); setErrors((p) => ({ ...p, email: undefined })); }}
                  placeholder="seu@email.com"
                  className={`w-full border rounded-xl px-4 py-3 text-sm text-gray-900 placeholder-gray-400 focus:outline-none transition ${
                    errors.email ? "border-red-400 focus:border-red-500" : "border-gray-200 focus:border-[#4A5452]"
                  }`}
                />
                {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">
                  LinkedIn <span className="text-gray-400 font-normal">(opcional)</span>
                </label>
                <input
                  type="url"
                  value={linkedinUrl}
                  onChange={(e) => setLinkedinUrl(e.target.value)}
                  placeholder="https://linkedin.com/in/seu-perfil"
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-[#4A5452] transition"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">
                  Currículo <span className="text-gray-400 font-normal">(opcional, PDF, máx. 5MB)</span>
                </label>
                {cvFileName ? (
                  <div className="flex items-center gap-2 bg-[#F5F7F0] border border-gray-200 rounded-xl px-4 py-3">
                    <span className="text-sm text-[#4A5452] flex-1 truncate">📄 {cvFileName}</span>
                    <button
                      type="button"
                      onClick={() => { setCvBase64(null); setCvFileName(""); setCvError(""); }}
                      className="text-xs text-gray-400 hover:text-gray-600 font-medium flex-shrink-0"
                    >
                      Remover
                    </button>
                  </div>
                ) : (
                  <label className="flex items-center gap-2 cursor-pointer border border-gray-200 rounded-xl px-4 py-3 hover:border-[#4A5452] transition">
                    <span className="text-sm text-gray-400">📎 Anexar currículo</span>
                    <input type="file" accept=".pdf" onChange={handleCvUpload} className="hidden" />
                  </label>
                )}
                {cvError && <p className="text-red-500 text-xs mt-1">{cvError}</p>}
              </div>

              {submitError && (
                <p className="text-red-500 text-sm bg-red-50 border border-red-100 rounded-xl px-4 py-3">
                  {submitError}
                </p>
              )}

              <button
                type="submit"
                disabled={submitting}
                className="w-full bg-[#C4FF57] text-[#4A5452] font-bold py-4 rounded-xl text-base hover:bg-[#b3ee46] transition disabled:opacity-60 mt-2"
              >
                {submitting
                  ? "Iniciando..."
                  : vaga.perguntas.length > 0
                  ? "Continuar →"
                  : "Iniciar avaliação →"}
              </button>
            </form>

            <p className="text-xs text-gray-400 text-center mt-5">
              Seus dados são usados apenas para esta candidatura.
            </p>
          </div>
        )}

        {/* ETAPA 2 — Perguntas de triagem */}
        {step === "triagem" && (
          <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
            <div className="flex items-center gap-3 mb-4">
              <button
                onClick={() => { setStep("form"); setSubmitError(""); }}
                className="text-gray-400 hover:text-[#4A5452] transition text-sm"
              >
                ← Voltar
              </button>
              <div>
                <h2 className="text-lg font-bold text-[#4A5452] leading-tight">Perguntas de triagem</h2>
                <p className="text-xs text-gray-400">
                  {respostas.filter((r) => r.trim()).length} de {vaga.perguntas.length} respondidas
                </p>
              </div>
            </div>

            <p className="text-sm text-gray-500 mb-6">
              Responda todas as perguntas para prosseguir com a candidatura.
              Não há respostas certas ou erradas.
            </p>

            <form
              onSubmit={(e) => { e.preventDefault(); handleFinalSubmit(respostas); }}
              className="space-y-5"
            >
              {vaga.perguntas.map((pergunta, i) => (
                <div key={i}>
                  <label className="block text-sm font-semibold text-[#4A5452] mb-2 leading-snug">
                    <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-[#4A5452] text-white text-xs font-bold mr-2 flex-shrink-0">
                      {i + 1}
                    </span>
                    {pergunta}
                  </label>
                  <textarea
                    value={respostas[i] ?? ""}
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

              {submitError && (
                <p className="text-red-500 text-sm bg-red-50 border border-red-100 rounded-xl px-4 py-3">
                  {submitError}
                </p>
              )}

              {allAnswered && (
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full bg-[#C4FF57] text-[#4A5452] font-bold py-4 rounded-xl text-base hover:bg-[#b3ee46] transition disabled:opacity-60"
                >
                  {submitting ? "Iniciando..." : "Iniciar avaliação →"}
                </button>
              )}

              {!allAnswered && (
                <p className="text-center text-xs text-gray-400">
                  Responda todas as perguntas para continuar
                </p>
              )}
            </form>
          </div>
        )}

        <p className="text-center text-xs text-gray-400 mt-6">
          Powered by <span className="font-semibold text-[#4A5452]">Contratai</span>
        </p>
      </div>
    </main>
  );
}
