"use client";

import { useState } from "react";
import Link from "next/link";

export interface ColaboradorItem {
  id: string;
  nome: string;
  cargo: string;
  departamento: string | null;
  email: string | null;
  testLinkToken: string | null;
  testCompleted: boolean;
  testPending: boolean;
  hasPersonality: boolean;
  discDominant: string | null;
}

interface Props {
  initialColaboradores: ColaboradorItem[];
}

const DISC_LABELS: Record<string, string> = {
  D: "Dominância",
  I: "Influência",
  S: "Estabilidade",
  C: "Conformidade",
};

export default function ColaboradoresClient({ initialColaboradores }: Props) {
  const [colaboradores, setColaboradores] = useState<ColaboradorItem[]>(initialColaboradores);
  const [showForm, setShowForm] = useState(false);
  const [generatingLink, setGeneratingLink] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [formError, setFormError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const [form, setForm] = useState({
    nome: "",
    cargo: "",
    departamento: "",
    email: "",
  });

  const setField = (field: string, value: string) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.nome.trim() || !form.cargo.trim()) {
      setFormError("Nome e cargo são obrigatórios.");
      return;
    }
    setSubmitting(true);
    setFormError("");
    try {
      const res = await fetch("/api/colaboradores", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nome: form.nome.trim(),
          cargo: form.cargo.trim(),
          departamento: form.departamento.trim() || undefined,
          email: form.email.trim() || undefined,
        }),
      });
      if (!res.ok) {
        const data = await res.json() as { error?: string };
        setFormError(data.error ?? "Erro ao adicionar colaborador.");
        return;
      }
      const newNode = await res.json() as {
        id: string;
        nome: string;
        cargo: string;
        departamento: string | null;
        email: string | null;
      };
      const newColaborador: ColaboradorItem = {
        id: newNode.id,
        nome: newNode.nome,
        cargo: newNode.cargo,
        departamento: newNode.departamento ?? null,
        email: newNode.email ?? null,
        testLinkToken: null,
        testCompleted: false,
        testPending: false,
        hasPersonality: false,
        discDominant: null,
      };
      setColaboradores((prev) => [newColaborador, ...prev]);
      setForm({ nome: "", cargo: "", departamento: "", email: "" });
      setShowForm(false);
    } catch {
      setFormError("Erro de conexão. Tente novamente.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleGerarLink = async (id: string) => {
    setGeneratingLink(id);
    try {
      const res = await fetch(`/api/colaboradores/${id}/gerar-link`, {
        method: "POST",
      });
      if (!res.ok) return;
      const data = await res.json() as { token: string; url: string };
      const url = data.url;
      await navigator.clipboard.writeText(url);
      setColaboradores((prev) =>
        prev.map((c) =>
          c.id === id
            ? { ...c, testLinkToken: data.token, testPending: true, testCompleted: false }
            : c
        )
      );
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2500);
    } finally {
      setGeneratingLink(null);
    }
  };

  const handleCopiarLink = async (colaborador: ColaboradorItem) => {
    if (!colaborador.testLinkToken) return;
    const url = `${window.location.origin}/test/${colaborador.testLinkToken}`;
    await navigator.clipboard.writeText(url);
    setCopiedId(colaborador.id);
    setTimeout(() => setCopiedId(null), 2500);
  };

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6 md:mb-8 gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-gray-900">Colaboradores</h1>
          <p className="text-gray-500 text-sm mt-0.5">
            Gerencie sua equipe e acompanhe os perfis comportamentais.
          </p>
        </div>
        <button
          onClick={() => { setShowForm((v) => !v); setFormError(""); }}
          className="bg-[#C4FF57] text-[#4A5452] px-4 py-2.5 rounded-xl text-sm font-bold hover:bg-[#b3ee46] transition flex-shrink-0"
          style={{ minHeight: "44px" }}
        >
          + Adicionar
        </button>
      </div>

      {/* Add form */}
      {showForm && (
        <div className="bg-white rounded-2xl border border-gray-200 p-6 mb-6">
          <h2 className="text-base font-bold text-[#4A5452] mb-4">Novo colaborador</h2>
          <form onSubmit={handleAddSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-[#4A5452] mb-1.5">
                  Nome <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={form.nome}
                  onChange={(e) => setField("nome", e.target.value)}
                  placeholder="Ex: Ana Silva"
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-[#4A5452] transition"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-[#4A5452] mb-1.5">
                  Cargo <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={form.cargo}
                  onChange={(e) => setField("cargo", e.target.value)}
                  placeholder="Ex: Gerente de Projetos"
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-[#4A5452] transition"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-[#4A5452] mb-1.5">
                  Departamento <span className="text-gray-400 font-normal">(opcional)</span>
                </label>
                <input
                  type="text"
                  value={form.departamento}
                  onChange={(e) => setField("departamento", e.target.value)}
                  placeholder="Ex: Tecnologia"
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-[#4A5452] transition"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-[#4A5452] mb-1.5">
                  E-mail <span className="text-gray-400 font-normal">(opcional)</span>
                </label>
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => setField("email", e.target.value)}
                  placeholder="ana@empresa.com"
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-[#4A5452] transition"
                />
              </div>
            </div>

            {formError && <p className="text-red-500 text-sm">{formError}</p>}

            <div className="flex gap-3 pt-1">
              <button
                type="button"
                onClick={() => { setShowForm(false); setFormError(""); }}
                className="px-5 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-600 font-semibold hover:bg-gray-50 transition"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="px-5 py-2.5 rounded-xl bg-[#C4FF57] text-[#4A5452] text-sm font-bold hover:bg-[#b3ee46] transition disabled:opacity-50"
              >
                {submitting ? "Salvando..." : "Salvar"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Collaborators list */}
      {colaboradores.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-10 text-center">
          <p className="text-gray-500 mb-4">Nenhum colaborador cadastrado ainda.</p>
          <button
            onClick={() => setShowForm(true)}
            className="bg-[#C4FF57] text-[#4A5452] px-6 py-3 rounded-xl text-sm font-bold hover:bg-[#b3ee46] transition"
          >
            Adicionar primeiro colaborador
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {colaboradores.map((c) => (
            <div
              key={c.id}
              className="bg-white rounded-xl border border-gray-200 p-4 md:p-5 hover:border-gray-300 transition"
            >
              <div className="flex flex-col sm:flex-row sm:items-start gap-3">
                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-1">
                    <h3 className="font-semibold text-gray-900 text-base">{c.nome}</h3>
                    {c.departamento && (
                      <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-500">
                        {c.departamento}
                      </span>
                    )}
                    {/* Status badge */}
                    {c.testCompleted ? (
                      <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-[#C4FF57] text-[#4A5452]">
                        Concluído
                      </span>
                    ) : c.testPending ? (
                      <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-700">
                        Aguardando
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-400">
                        Sem link
                      </span>
                    )}
                    {/* DISC badge */}
                    {c.hasPersonality && c.discDominant && (
                      <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-[#4A5452] text-white">
                        DISC: {c.discDominant} — {DISC_LABELS[c.discDominant] ?? c.discDominant}
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-500">{c.cargo}</p>
                  {c.email && (
                    <p className="text-xs text-gray-400 mt-0.5">{c.email}</p>
                  )}
                </div>

                {/* Actions */}
                <div className="flex flex-wrap items-center gap-2 flex-shrink-0">
                  {c.testCompleted && c.testLinkToken ? (
                    <Link
                      href={`/test/${c.testLinkToken}/result`}
                      className="px-4 py-2 rounded-xl bg-[#4A5452] text-white text-xs font-semibold hover:bg-[#3a4341] transition"
                    >
                      Ver resultado
                    </Link>
                  ) : c.testPending ? (
                    <>
                      <button
                        onClick={() => handleCopiarLink(c)}
                        className="px-4 py-2 rounded-xl border border-[#4A5452] text-[#4A5452] text-xs font-semibold hover:bg-[#F5F7F0] transition"
                      >
                        {copiedId === c.id ? "Link copiado!" : "Copiar link"}
                      </button>
                      <button
                        onClick={() => handleGerarLink(c.id)}
                        disabled={generatingLink === c.id}
                        className="px-4 py-2 rounded-xl border border-gray-300 text-gray-600 text-xs font-semibold hover:bg-gray-50 transition disabled:opacity-50"
                      >
                        {generatingLink === c.id ? "Gerando..." : "Reenviar"}
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={() => handleGerarLink(c.id)}
                      disabled={generatingLink === c.id}
                      className="px-4 py-2 rounded-xl bg-[#C4FF57] text-[#4A5452] text-xs font-bold hover:bg-[#b3ee46] transition disabled:opacity-50"
                    >
                      {generatingLink === c.id
                        ? "Gerando..."
                        : copiedId === c.id
                        ? "Link copiado!"
                        : "Gerar link"}
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
