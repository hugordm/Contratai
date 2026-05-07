"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import ChatSidebar from "@/components/ui/ChatSidebar";

interface JDResult {
  descricao: string;
  jobDescription: string;
  salaryMin: number;
  salaryMax: number;
  salaryBreakdown: string;
  perguntas: string[];
  perfilIdeal: { disc: string[]; justificativa: string };
}

interface CandidateItem {
  id: string;
  nome: string;
  email: string;
  linkedinUrl?: string | null;
  testStatus: "none" | "pending" | "completed";
  testToken?: string | null;
}

interface Props {
  jobId: string;
  jobTitulo: string;
  jobMotivo?: string | null;
  jobStatus: string;
  jobCreatedAt: string;
  jobCandidateCount: number;
  jobResponsabilidades?: string | null;
  jobMetas?: string | null;
  initialJd: JDResult | null;
  initialCandidates: CandidateItem[];
  criouComIA: boolean;
  liderNome?: string | null;
}

const MOTIVO_LABELS: Record<string, string> = {
  crescimento: "Crescimento da equipe",
  substituicao: "Substituição de colaborador",
  nova_area: "Nova área / departamento",
};

const DISC_INFO: Record<string, { label: string; desc: string; color: string }> = {
  D: { label: "Dominância", desc: "Orientado a resultados, decisivo", color: "bg-red-50 text-red-700 border-red-200" },
  I: { label: "Influência", desc: "Comunicativo, sociável", color: "bg-yellow-50 text-yellow-700 border-yellow-200" },
  S: { label: "Estabilidade", desc: "Colaborativo, paciente", color: "bg-green-50 text-green-700 border-green-200" },
  C: { label: "Conformidade", desc: "Analítico, preciso", color: "bg-blue-50 text-blue-700 border-blue-200" },
};

export default function VagaClient({
  jobId,
  jobTitulo,
  jobMotivo,
  jobStatus,
  jobCreatedAt,
  jobCandidateCount,
  jobResponsabilidades,
  jobMetas,
  initialJd,
  initialCandidates,
  criouComIA,
  liderNome,
}: Props) {
  const router = useRouter();

  const [jdData, setJdData] = useState<JDResult | null>(initialJd);
  const [generating, setGenerating] = useState(false);
  const [genError, setGenError] = useState("");

  const [candidates, setCandidates] = useState<CandidateItem[]>(initialCandidates);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ nome: "", email: "", linkedinUrl: "" });
  const [addingCandidate, setAddingCandidate] = useState(false);
  const [formError, setFormError] = useState("");

  const [copiedLink, setCopiedLink] = useState(false);
  const [sendingEmail, setSendingEmail] = useState<string | null>(null);
  const [emailSent, setEmailSent] = useState<Set<string>>(new Set());
  const [copiedIaLink, setCopiedIaLink] = useState(false);

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const [deleteCandidate, setDeleteCandidate] = useState<{ id: string; nome: string } | null>(null);
  const [deletingCandidate, setDeletingCandidate] = useState(false);

  const totalCandidates = jobCandidateCount + (candidates.length - initialCandidates.length);

  const generateJD = async () => {
    setGenerating(true);
    setGenError("");
    try {
      const res = await fetch(`/api/vagas/${jobId}/gerar-jd`, { method: "POST" });
      if (!res.ok) {
        const data = await res.json();
        setGenError(data.error ?? "Erro ao gerar com IA. Tente novamente.");
        return;
      }
      setJdData(await res.json());
    } catch {
      setGenError("Erro de conexão. Tente novamente.");
    } finally {
      setGenerating(false);
    }
  };

  const addCandidate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.nome.trim()) { setFormError("Nome é obrigatório"); return; }
    if (!form.email.trim()) { setFormError("E-mail é obrigatório"); return; }
    setAddingCandidate(true);
    setFormError("");
    try {
      const res = await fetch(`/api/vagas/${jobId}/candidatos`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) {
        const data = await res.json();
        setFormError(data.error ?? "Erro ao adicionar candidato.");
        return;
      }
      const c = await res.json();
      setCandidates((prev) => [
        { id: c.id, nome: c.nome, email: c.email, linkedinUrl: c.linkedinUrl, testStatus: "none", testToken: null },
        ...prev,
      ]);
      setForm({ nome: "", email: "", linkedinUrl: "" });
      setShowForm(false);
    } catch {
      setFormError("Erro de conexão. Tente novamente.");
    } finally {
      setAddingCandidate(false);
    }
  };

  const sendEmail = async (candidateId: string) => {
    setSendingEmail(candidateId);
    try {
      const res = await fetch(`/api/candidatos/${candidateId}/enviar-link`, { method: "POST" });
      if (res.ok) {
        setEmailSent((prev) => new Set([...prev, candidateId]));
      }
    } finally {
      setSendingEmail(null);
    }
  };

  const copyApplicationLink = () => {
    const link = `${window.location.origin}/candidatura/${jobId}`;
    navigator.clipboard.writeText(link).then(() => {
      setCopiedIaLink(true);
      setTimeout(() => setCopiedIaLink(false), 2500);
    });
  };

  const deleteJob = async () => {
    setDeleting(true);
    try {
      const res = await fetch(`/api/vagas/${jobId}`, { method: "DELETE" });
      if (res.ok) {
        router.push("/dashboard");
      }
    } catch {
      setDeleting(false);
    }
  };

  const confirmDeleteCandidate = async () => {
    if (!deleteCandidate) return;
    setDeletingCandidate(true);
    try {
      const res = await fetch(`/api/vagas/${jobId}/candidatos/${deleteCandidate.id}`, { method: "DELETE" });
      if (res.ok) {
        setCandidates((prev) => prev.filter((c: any) => c.id !== deleteCandidate.id));
        setDeleteCandidate(null);
      }
    } finally {
      setDeletingCandidate(false);
    }
  };

  const showIASection = criouComIA || !!jdData;
  const discCompletedCount = candidates.filter((c: any) => c.testStatus === "completed").length;

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-6 flex items-center justify-between gap-4">
        <Link href="/dashboard" className="text-sm text-gray-500 hover:text-gray-700 transition">
          ← Voltar ao dashboard
        </Link>
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              const link = `${window.location.origin}/candidatura/${jobId}`;
              navigator.clipboard.writeText(link).then(() => {
                setCopiedLink(true);
                setTimeout(() => setCopiedLink(false), 2500);
              });
            }}
            className="text-xs font-medium border border-gray-200 px-3 py-2 rounded-xl text-gray-600 hover:border-[#4A5452] hover:text-[#4A5452] transition"
          >
            {copiedLink ? "✅ Link copiado!" : "📋 Copiar link de candidatura"}
          </button>
          {discCompletedCount > 0 && (
            <Link
              href={`/vagas/${jobId}/match`}
              className="bg-[#4A5452] text-white font-semibold px-4 py-2 rounded-xl text-sm hover:bg-[#3a4442] transition flex items-center gap-1.5"
            >
              🤖 Ver Match com IA
              <span className="bg-[#C4FF57] text-[#4A5452] text-xs font-bold rounded-full px-1.5 py-0.5">
                {discCompletedCount}
              </span>
            </Link>
          )}
          <Link
            href={`/vagas/${jobId}/editar`}
            className="text-sm text-gray-600 hover:text-[#4A5452] hover:bg-[#F5F7F0] px-3 py-2 rounded-xl transition border border-gray-200"
          >
            ✏️ Editar vaga
          </Link>
          <button
            onClick={() => setShowDeleteModal(true)}
            className="text-sm text-red-500 hover:text-red-700 hover:bg-red-50 px-3 py-2 rounded-xl transition"
          >
            Excluir vaga
          </button>
        </div>
      </div>

      {/* Modal de exclusão */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="bg-white rounded-2xl p-6 md:p-8 w-full max-w-sm shadow-2xl">
            <h2 className="text-lg font-bold text-[#4A5452] mb-2">Excluir vaga</h2>
            <p className="text-sm text-gray-600 mb-6">
              Tem certeza que deseja excluir a vaga <strong>{jobTitulo}</strong>? Todos os candidatos e análises serão removidos permanentemente.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteModal(false)}
                disabled={deleting}
                className="flex-1 border border-gray-300 text-gray-600 py-2.5 rounded-xl text-sm font-medium hover:bg-gray-50 transition disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                onClick={deleteJob}
                disabled={deleting}
                className="flex-1 bg-red-500 text-white py-2.5 rounded-xl text-sm font-bold hover:bg-red-600 transition disabled:opacity-50"
              >
                {deleting ? "Excluindo..." : "Excluir"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal exclusão de candidato */}
      {deleteCandidate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="bg-white rounded-2xl p-6 md:p-8 w-full max-w-sm shadow-2xl">
            <h2 className="text-lg font-bold text-[#4A5452] mb-2">Excluir candidato</h2>
            <p className="text-sm text-gray-600 mb-6">
              Tem certeza que deseja excluir <strong>{deleteCandidate.nome}</strong>? Todos os resultados e links vinculados serão removidos permanentemente.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteCandidate(null)}
                disabled={deletingCandidate}
                className="flex-1 border border-gray-300 text-gray-600 py-2.5 rounded-xl text-sm font-medium hover:bg-gray-50 transition disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                onClick={confirmDeleteCandidate}
                disabled={deletingCandidate}
                className="flex-1 bg-red-500 text-white py-2.5 rounded-xl text-sm font-bold hover:bg-red-600 transition disabled:opacity-50"
              >
                {deletingCandidate ? "Excluindo..." : "Excluir"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Dados da vaga */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6 md:p-8 mb-6">
        <div className="flex items-start justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-[#4A5452]">{jobTitulo}</h1>
            {jobMotivo && (
              <p className="text-sm text-gray-500 mt-1">{MOTIVO_LABELS[jobMotivo] ?? jobMotivo}</p>
            )}
          </div>
          <span
            className={`px-3 py-1 rounded-full text-xs font-semibold flex-shrink-0 ${
              jobStatus === "active" ? "bg-[#C4FF57] text-[#4A5452]" : "bg-gray-100 text-gray-500"
            }`}
          >
            {jobStatus === "active" ? "Ativa" : jobStatus}
          </span>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="bg-[#F5F7F0] rounded-xl p-4">
            <p className="text-xs text-gray-500 mb-1">Candidatos</p>
            <p className="text-2xl font-bold text-[#4A5452]">{totalCandidates}</p>
          </div>
          <div className="bg-[#F5F7F0] rounded-xl p-4">
            <p className="text-xs text-gray-500 mb-1">Criada em</p>
            <p className="text-base font-semibold text-[#4A5452]">
              {new Date(jobCreatedAt).toLocaleDateString("pt-BR", {
                day: "2-digit",
                month: "short",
                year: "numeric",
              })}
            </p>
          </div>
        </div>

        {jobResponsabilidades && (
          <div className="mb-5">
            <h2 className="text-sm font-semibold text-[#4A5452] uppercase tracking-wide mb-2">
              Responsabilidades
            </h2>
            <p className="text-gray-700 text-sm leading-relaxed whitespace-pre-wrap">
              {jobResponsabilidades}
            </p>
          </div>
        )}

        {jobMetas && (
          <div className="mb-5">
            <h2 className="text-sm font-semibold text-[#4A5452] uppercase tracking-wide mb-2">
              Metas e objetivos
            </h2>
            <p className="text-gray-700 text-sm leading-relaxed whitespace-pre-wrap">{jobMetas}</p>
          </div>
        )}

        <div className="flex items-center justify-between gap-3 pt-4 border-t border-gray-100">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-[#4A5452] uppercase tracking-wide">
              Líder direto
            </span>
            {liderNome ? (
              <span className="text-sm text-gray-700 font-medium">{liderNome}</span>
            ) : (
              <span className="text-sm text-gray-400 italic">Não selecionado</span>
            )}
          </div>
          <Link
            href={`/vagas/${jobId}/editar`}
            className="text-xs text-gray-500 hover:text-[#4A5452] transition underline"
          >
            {liderNome ? "Alterar" : "Selecionar líder"}
          </Link>
        </div>
      </div>

      {/* Seção IA */}
      {showIASection && (
        <div className="bg-white rounded-2xl border border-gray-200 p-6 md:p-8 mb-6">
          <div className="flex items-center gap-2 mb-6">
            <span className="text-xl">✨</span>
            <h2 className="text-base font-bold text-[#4A5452]">Geração com IA</h2>
          </div>

          {!jdData && !generating && (
            <div className="bg-gradient-to-br from-[#F5F7F0] to-[#eaede5] rounded-xl p-6 text-center border border-[#d8dbd3]">
              <p className="text-[#4A5452] font-semibold text-base mb-2">
                Deixa a IA trabalhar por você
              </p>
              <p className="text-gray-500 text-sm mb-6 max-w-md mx-auto">
                Gere a Job Description completa, estimativa salarial com justificativa, perguntas de
                triagem e o perfil DISC ideal para esta vaga — em segundos.
              </p>
              {genError && <p className="text-red-500 text-sm mb-4">{genError}</p>}
              <button
                onClick={generateJD}
                className="bg-[#C4FF57] text-[#4A5452] font-bold px-8 py-4 rounded-xl text-base hover:bg-[#b3ee46] transition"
                style={{ minHeight: "56px" }}
              >
                ✨ Gerar com IA
              </button>
            </div>
          )}

          {generating && <JDSkeleton />}

          {jdData && !generating && (
            <div className="space-y-7">
              <div>
                <SectionTitle>Descrição da vaga</SectionTitle>
                <p className="text-gray-700 text-sm leading-relaxed whitespace-pre-wrap">
                  {jdData.descricao}
                </p>
              </div>

              <div>
                <SectionTitle>Job Description completa</SectionTitle>
                <div className="bg-[#F5F7F0] rounded-xl p-5">
                  <p className="text-gray-700 text-sm leading-relaxed whitespace-pre-wrap">
                    {jdData.jobDescription}
                  </p>
                </div>
              </div>

              <div>
                <SectionTitle>Faixa salarial estimada</SectionTitle>
                <div className="bg-[#C4FF57]/20 border border-[#C4FF57] rounded-xl p-4">
                  <p className="text-xl font-bold text-[#4A5452]">
                    R${" "}
                    {jdData.salaryMin.toLocaleString("pt-BR")} —{" "}
                    R$ {jdData.salaryMax.toLocaleString("pt-BR")}
                    <span className="text-sm font-normal text-gray-500 ml-1">/mês</span>
                  </p>
                  <p className="text-sm text-gray-600 mt-2 leading-relaxed">
                    {jdData.salaryBreakdown}
                  </p>
                </div>
              </div>

              <div>
                <SectionTitle>Perguntas de triagem</SectionTitle>
                <ol className="space-y-3">
                  {jdData.perguntas.map((p: any, i: number) => (
                    <li key={i} className="flex gap-3 text-sm text-gray-700 leading-relaxed">
                      <span className="flex-shrink-0 w-6 h-6 rounded-full bg-[#4A5452] text-white text-xs flex items-center justify-center font-bold mt-0.5">
                        {i + 1}
                      </span>
                      {p}
                    </li>
                  ))}
                </ol>
              </div>

              <div>
                <SectionTitle>Perfil DISC ideal</SectionTitle>
                <div className="flex flex-wrap gap-3 mb-4">
                  {jdData.perfilIdeal.disc.map((d: any) => {
                    const info = DISC_INFO[d];
                    return info ? (
                      <div
                        key={d}
                        className={`px-4 py-3 rounded-xl text-sm font-semibold border ${info.color}`}
                      >
                        <span className="font-bold text-base">{d}</span> — {info.label}
                        <span className="block text-xs font-normal opacity-75 mt-0.5">
                          {info.desc}
                        </span>
                      </div>
                    ) : null;
                  })}
                </div>
                <p className="text-sm text-gray-600 leading-relaxed">
                  {jdData.perfilIdeal.justificativa}
                </p>
              </div>

              <div className="pt-4 border-t border-gray-100 flex flex-col sm:flex-row gap-3">
                <button
                  onClick={copyApplicationLink}
                  className="flex items-center gap-2 text-sm font-semibold text-[#4A5452] border border-[#4A5452] px-4 py-2.5 rounded-xl hover:bg-[#4A5452] hover:text-white transition"
                >
                  {copiedIaLink ? "✅ Link copiado!" : "📋 Copiar link de candidatura"}
                </button>
                <button
                  onClick={generateJD}
                  className="text-sm text-gray-400 hover:text-gray-600 transition px-4 py-2.5"
                >
                  Gerar novamente
                </button>
              </div>
              {copiedIaLink && (
                <p className="text-xs text-gray-500 -mt-4">
                  Compartilhe este link para que candidatos se candidatem à vaga.
                </p>
              )}
            </div>
          )}
        </div>
      )}

      {/* Candidatos */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6 md:p-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-base font-bold text-[#4A5452]">Candidatos</h2>
          {!showForm && (
            <button
              onClick={() => setShowForm(true)}
              className="bg-[#C4FF57] text-[#4A5452] font-bold px-4 py-2 rounded-xl text-sm hover:bg-[#b3ee46] transition"
              style={{ minHeight: "40px" }}
            >
              + Adicionar candidato
            </button>
          )}
        </div>

        {showForm && (
          <form
            onSubmit={addCandidate}
            className="bg-[#F5F7F0] rounded-xl p-5 mb-6 space-y-4 border border-[#d8dbd3]"
          >
            <p className="text-sm font-semibold text-[#4A5452]">Novo candidato</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">
                  Nome <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={form.nome}
                  onChange={(e) => setForm((f) => ({ ...f, nome: e.target.value }))}
                  placeholder="Nome completo"
                  className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-[#4A5452] bg-white"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">
                  E-mail <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                  placeholder="email@exemplo.com"
                  className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-[#4A5452] bg-white"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5">
                LinkedIn <span className="text-gray-400 font-normal">(opcional)</span>
              </label>
              <input
                type="url"
                value={form.linkedinUrl}
                onChange={(e) => setForm((f) => ({ ...f, linkedinUrl: e.target.value }))}
                placeholder="https://linkedin.com/in/..."
                className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-[#4A5452] bg-white"
              />
            </div>
            {formError && <p className="text-red-500 text-xs">{formError}</p>}
            <div className="flex gap-3 pt-1">
              <button
                type="button"
                onClick={() => {
                  setShowForm(false);
                  setFormError("");
                  setForm({ nome: "", email: "", linkedinUrl: "" });
                }}
                className="flex-1 border border-gray-300 text-gray-600 py-2.5 rounded-lg text-sm font-medium hover:bg-gray-50 transition"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={addingCandidate}
                className="flex-1 bg-[#4A5452] text-white py-2.5 rounded-lg text-sm font-bold hover:bg-[#3a4442] transition disabled:opacity-50"
              >
                {addingCandidate ? "Salvando..." : "Adicionar candidato"}
              </button>
            </div>
          </form>
        )}

        {candidates.length === 0 ? (
          <div className="text-center py-10">
            <p className="text-gray-400 text-sm">Nenhum candidato adicionado ainda.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {candidates.map((candidate: any) => (
              <div
                key={candidate.id}
                className="flex items-center justify-between gap-3 p-4 bg-[#F5F7F0] rounded-xl"
              >
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-[#4A5452] truncate">{candidate.nome}</p>
                  <p className="text-xs text-gray-500 truncate">{candidate.email}</p>
                  {candidate.linkedinUrl && (
                    <a
                      href={candidate.linkedinUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="text-xs text-blue-500 hover:underline"
                    >
                      LinkedIn
                    </a>
                  )}
                </div>

                <div className="flex items-center gap-2 flex-shrink-0 flex-wrap justify-end">
                  <span
                    className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                      candidate.testStatus === "completed"
                        ? "bg-[#C4FF57] text-[#4A5452]"
                        : candidate.testStatus === "pending"
                        ? "bg-yellow-100 text-yellow-700"
                        : "bg-gray-100 text-gray-500"
                    }`}
                  >
                    {candidate.testStatus === "completed"
                      ? "Concluído ✓"
                      : candidate.testStatus === "pending"
                      ? "Aguardando"
                      : "Pendente"}
                  </span>

                  {candidate.testStatus === "completed" && candidate.testToken ? (
                    <Link
                      href={`/test/${candidate.testToken}/result`}
                      className="text-xs text-[#4A5452] underline font-medium"
                    >
                      Ver resultado
                    </Link>
                  ) : (
                    <button
                      onClick={() => sendEmail(candidate.id)}
                      disabled={sendingEmail === candidate.id}
                      className={`text-xs font-medium border px-2.5 py-1.5 rounded-lg transition disabled:opacity-50 ${
                        emailSent.has(candidate.id)
                          ? "bg-[#C4FF57] border-[#b3ee46] text-[#4A5452]"
                          : "border-gray-200 text-gray-600 hover:border-[#4A5452] hover:text-[#4A5452]"
                      }`}
                    >
                      {sendingEmail === candidate.id
                        ? "Enviando..."
                        : emailSent.has(candidate.id)
                        ? "✓ E-mail enviado"
                        : "📧 Enviar link"}
                    </button>
                  )}
                  <button
                    onClick={() => setDeleteCandidate({ id: candidate.id, nome: candidate.nome })}
                    className="text-xs font-medium border border-gray-200 px-2.5 py-1.5 rounded-lg text-red-400 hover:border-red-400 hover:text-red-600 transition"
                  >
                    Excluir
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {discCompletedCount > 0 && (
          <div className="mt-6 pt-5 border-t border-gray-100 text-center">
            <Link
              href={`/vagas/${jobId}/match`}
              className="inline-flex items-center gap-2 bg-[#4A5452] text-white font-bold px-6 py-3 rounded-xl text-sm hover:bg-[#3a4442] transition"
            >
              🤖 Ver Match com IA
              <span className="bg-[#C4FF57] text-[#4A5452] text-xs font-bold rounded-full px-2 py-0.5">
                {discCompletedCount} DISC
              </span>
            </Link>
            <p className="text-xs text-gray-400 mt-2">
              Ranking inteligente com análise de fit, DISC e perguntas de entrevista
            </p>
          </div>
        )}
      </div>

      <ChatSidebar jobId={jobId} />
    </div>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="text-xs font-semibold text-[#4A5452] uppercase tracking-widest mb-3">
      {children}
    </h3>
  );
}

function JDSkeleton() {
  return (
    <div className="animate-pulse space-y-6">
      <div className="space-y-2">
        <div className="h-2.5 bg-gray-200 rounded w-28"></div>
        <div className="h-4 bg-gray-200 rounded w-full"></div>
        <div className="h-4 bg-gray-200 rounded w-5/6"></div>
        <div className="h-4 bg-gray-200 rounded w-4/6"></div>
      </div>
      <div className="space-y-2">
        <div className="h-2.5 bg-gray-200 rounded w-36"></div>
        <div className="h-28 bg-gray-200 rounded-xl"></div>
      </div>
      <div className="space-y-2">
        <div className="h-2.5 bg-gray-200 rounded w-32"></div>
        <div className="h-14 bg-gray-200 rounded-xl"></div>
      </div>
      <div className="space-y-2">
        <div className="h-2.5 bg-gray-200 rounded w-40"></div>
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="flex gap-3 items-center">
            <div className="w-6 h-6 bg-gray-200 rounded-full flex-shrink-0"></div>
            <div className="h-4 bg-gray-200 rounded flex-1"></div>
          </div>
        ))}
      </div>
      <div className="flex gap-3">
        <div className="h-10 bg-gray-200 rounded-xl w-40"></div>
        <div className="h-10 bg-gray-200 rounded-xl w-36"></div>
      </div>
    </div>
  );
}
