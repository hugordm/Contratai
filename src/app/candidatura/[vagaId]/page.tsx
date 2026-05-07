"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";

interface VagaInfo {
  titulo: string;
  empresa: string;
  logoUrl: string | null;
}

export default function CandidaturaPage() {
  const params = useParams();
  const vagaId = params.vagaId as string;
  const router = useRouter();

  const [vaga, setVaga] = useState<VagaInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [errors, setErrors] = useState<{ nome?: string; email?: string }>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");

  useEffect(() => {
    fetch(`/api/candidatura/${vagaId}`)
      .then((r) => {
        if (r.status === 404) { setNotFound(true); return null; }
        return r.json();
      })
      .then((data) => {
        if (data) setVaga(data);
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setSubmitting(true);
    setSubmitError("");
    try {
      const res = await fetch(`/api/candidatura/${vagaId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nome: nome.trim(), email: email.trim() }),
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

        {/* Formulário */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
          <h1 className="text-xl font-bold text-[#4A5452] mb-1">Candidatar-se</h1>
          <p className="text-gray-500 text-sm mb-6">
            Preencha seus dados para iniciar a avaliação de perfil comportamental.
          </p>

          <form onSubmit={handleSubmit} noValidate className="space-y-4">
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
              {submitting ? "Iniciando..." : "Iniciar avaliação →"}
            </button>
          </form>

          <p className="text-xs text-gray-400 text-center mt-5">
            Seus dados são usados apenas para esta candidatura.
          </p>
        </div>

        <p className="text-center text-xs text-gray-400 mt-6">
          Powered by <span className="font-semibold text-[#4A5452]">Contratai</span>
        </p>
      </div>
    </main>
  );
}
