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
  initialPerguntas: string[];
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
  initialPerguntas,
  initialCandidates,
  criouComIA,
  liderNome,
}: Props) {
  const router = useRouter();

  const [jdData, setJdData] = useState<JDResult | null>(initialJd);
  const [generating, setGenerating] = useState(false);
  const [genError, setGenError] = useState("");

  const [perguntas, setPerguntas] = useState<string[]>(
    initialJd?.perguntas?.length ? initialJd.perguntas : initialPerguntas
  );
  const [generatingPerguntas, setGeneratingPerguntas] = useState(false);
  const [perguntasError, setPerguntasError] = useState("");

  const [candidates, setCandidates] = useState<CandidateItem[]>(initialCandidates);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ nome: "", email: "", linkedinUrl: "", entrevistaTexto: "" });
  const [addingCandidate, setAddingCandidate] = useState(false);
  const [formError, setFormError] = useState("");
  const [cvBase64, setCvBase64] = useState<string | null>(null);
  const [cvFileName, setCvFileName] = useState("");
  const [cvError, setCvError] = useState("");

  const [copiedLink, setCopiedLink] = useState(false);
  const [sendingEmail, setSendingEmail] = useState<string | null>(null);
  const [emailSent, setEmailSent] = useState<Set<string>>(new Set());
  const [copiedIaLink, setCopiedIaLink] = useState(false);

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const [deleteCandidate, setDeleteCandidate] = useState<{ id: string; nome: string } | null>(null);
  const [deletingCandidate, setDeletingCandidate] = useState(false);

  const [editCandidate, setEditCandidate] = useState<{
    id: string; nome: string; email: string; linkedinUrl: string; entrevistaTexto: string;
  } | null>(null);
  const [editLoading, setEditLoading] = useState(false);
  const [editCvBase64, setEditCvBase64] = useState<string | null>(null);
  const [editCvFileName, setEditCvFileName] = useState("");
  const [editCvError, setEditCvError] = useState("");
  const [savingEdit, setSavingEdit] = useState(false);
  const [editError, setEditError] = useState("");

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
      const result = await res.json();
      setJdData(result);
      if (result.perguntas?.length) setPerguntas(result.perguntas);
    } catch {
      setGenError("Erro de conexão. Tente novamente.");
    } finally {
      setGenerating(false);
    }
  };

  const generatePerguntas = async () => {
    setGeneratingPerguntas(true);
    setPerguntasError("");
    try {
      const res = await fetch(`/api/vagas/${jobId}/gerar-perguntas`, { method: "POST" });
      if (!res.ok) {
        const data = await res.json();
        setPerguntasError(data.error ?? "Erro ao gerar perguntas. Tente novamente.");
        return;
      }
      const data = await res.json();
      setPerguntas(data.perguntas ?? []);
    } catch {
      setPerguntasError("Erro de conexão. Tente novamente.");
    } finally {
      setGeneratingPerguntas(false);
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

  const resetCv = () => {
    setCvBase64(null);
    setCvFileName("");
    setCvError("");
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
        body: JSON.stringify({ ...form, cvBase64: cvBase64 ?? undefined }),
      });
      if (!res.ok) {
        const data = await res.json();
        setFormError(data.error ?? "Erro ao adicionar candidato.");
        return;
      }
      const c = await res.json();
      setCandidates((prev) => [
        {
          id: c.id,
          nome: c.nome,
          email: c.email,
          linkedinUrl: c.linkedinUrl,
          testStatus: c.testToken ? "pending" : "none",
          testToken: c.testToken ?? null,
        },
        ...prev,
      ]);
      setForm({ nome: "", email: "", linkedinUrl: "", entrevistaTexto: "" });
      resetCv();
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

  const openEditModal = async (candidate: CandidateItem) => {
    setEditCvBase64(null);
    setEditCvFileName("");
    setEditCvError("");
    setEditError("");
    setEditCandidate({
      id: candidate.id,
      nome: candidate.nome,
      email: candidate.email,
      linkedinUrl: candidate.linkedinUrl ?? "",
      entrevistaTexto: "",
    });
    setEditLoading(true);
    try {
      const res = await fetch(`/api/vagas/${jobId}/candidatos/${candidate.id}`);
      if (res.ok) {
        const data = await res.json();
        setEditCandidate({
          id: candidate.id,
          nome: candidate.nome,
          email: candidate.email,
          linkedinUrl: data.linkedinUrl ?? "",
          entrevistaTexto: data.entrevistaTexto ?? "",
        });
      }
    } catch {
      // fallback to what we already set
    } finally {
      setEditLoading(false);
    }
  };

  const handleEditCvUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setEditCvError("");
    if (file.type !== "application/pdf") {
      setEditCvError("Apenas arquivos PDF são aceitos.");
      e.target.value = "";
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setEditCvError("Arquivo deve ter no máximo 5MB.");
      e.target.value = "";
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      setEditCvBase64(reader.result as string);
      setEditCvFileName(file.name);
    };
    reader.readAsDataURL(file);
  };

  const saveEdit = async () => {
    if (!editCandidate) return;
    setSavingEdit(true);
    setEditError("");
    try {
      const body: Record<string, unknown> = {
        linkedinUrl: editCandidate.linkedinUrl,
        entrevistaTexto: editCandidate.entrevistaTexto,
      };
      if (editCvBase64) body.cvBase64 = editCvBase64;

      const res = await fetch(`/api/vagas/${jobId}/candidatos/${editCandidate.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const data = await res.json();
        setEditError(data.error ?? "Erro ao salvar. Tente novamente.");
        return;
      }
      setCandidates((prev) =>
        prev.map((c) =>
          c.id === editCandidate.id
            ? { ...c, linkedinUrl: editCandidate.linkedinUrl || null }
            : c
        )
      );
      setEditCandidate(null);
    } catch {
      setEditError("Erro de conexão. Tente novamente.");
    } finally {
      setSavingEdit(false);
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
      <div className="mb-6 flex flex-wrap items-center gap-2">
        <Link href="/dashboard" className="text-sm text-gray-500 hover:text-gray-700 transition mr-auto">
          ← Voltar ao dashboard
        </Link>
        <div className="flex items-center gap-2 flex-wrap justify-end">
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
            {copiedLink ? "✅ Copiado!" : "📋 Link candidatura"}
          </button>
          {discCompletedCount > 0 && (
            <Link
              href={`/vagas/${jobId}/match`}
              className="bg-[#4A5452] text-white font-semibold px-4 py-2 rounded-xl text-sm hover:bg-[#3a4442] transition flex items-center gap-1.5"
            >
              🤖 Match IA
              <span className="bg-[#C4FF57] text-[#4A5452] text-xs font-bold rounded-full px-1.5 py-0.5">
                {discCompletedCount}
              </span>
            </Link>
          )}
          <Link
            href={`/vagas/${jobId}/editar`}
            className="text-sm text-gray-600 hover:text-[#4A5452] hover:bg-[#F5F7F0] px-3 py-2 rounded-xl transition border border-gray-200"
          >
            ✏️ Editar
          </Link>
          <button
            onClick={() => setShowDeleteModal(true)}
            className="text-sm text-red-500 hover:text-red-700 hover:bg-red-50 px-3 py-2 rounded-xl transition border border-red-200"
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

      {/* Modal de edição de candidato */}
      {editCandidate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="bg-white rounded-2xl p-6 md:p-8 w-full max-w-lg shadow-2xl max-h-[90vh] overflow-y-auto">
            <h2 className="text-lg font-bold text-[#4A5452] mb-1">Editar candidato</h2>
            <p className="text-sm text-gray-500 mb-5">
              {editCandidate.nome} · {editCandidate.email}
            </p>

            {editLoading ? (
              <div className="flex justify-center py-8">
                <div className="w-6 h-6 border-2 border-[#C4FF57] border-t-transparent rounded-full animate-spin" />
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5">
                    LinkedIn <span className="text-gray-400 font-normal">(opcional)</span>
                  </label>
                  <input
                    type="url"
                    value={editCandidate.linkedinUrl}
                    onChange={(e) =>
                      setEditCandidate((p) => p ? { ...p, linkedinUrl: e.target.value } : p)
                    }
                    placeholder="https://linkedin.com/in/..."
                    className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-[#4A5452]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5">
                    Currículo <span className="text-gray-400 font-normal">(opcional, PDF, máx. 5MB)</span>
                  </label>
                  {editCvFileName ? (
                    <div className="flex items-center gap-2 bg-[#F5F7F0] border border-gray-200 rounded-xl px-4 py-2.5">
                      <span className="text-sm text-[#4A5452] flex-1 truncate">📄 {editCvFileName}</span>
                      <button
                        type="button"
                        onClick={() => { setEditCvBase64(null); setEditCvFileName(""); setEditCvError(""); }}
                        className="text-xs text-gray-400 hover:text-gray-600 font-medium flex-shrink-0"
                      >
                        Remover
                      </button>
                    </div>
                  ) : (
                    <label className="flex items-center gap-2 cursor-pointer border border-gray-200 rounded-xl px-4 py-2.5 hover:border-[#4A5452] transition">
                      <span className="text-sm text-gray-400">📎 Substituir currículo</span>
                      <input type="file" accept=".pdf" onChange={handleEditCvUpload} className="hidden" />
                    </label>
                  )}
                  {editCvError && <p className="text-red-500 text-xs mt-1">{editCvError}</p>}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5">
                    Transcrição de entrevista <span className="text-gray-400 font-normal">(opcional)</span>
                  </label>
                  <textarea
                    value={editCandidate.entrevistaTexto}
                    onChange={(e) =>
                      setEditCandidate((p) => p ? { ...p, entrevistaTexto: e.target.value } : p)
                    }
                    placeholder="Cole aqui a transcrição da entrevista com o candidato..."
                    rows={5}
                    className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-[#4A5452] resize-none"
                  />
                </div>

                {editError && (
                  <p className="text-red-500 text-sm bg-red-50 border border-red-100 rounded-xl px-4 py-3">
                    {editError}
                  </p>
                )}

                <div className="flex gap-3 pt-1">
                  <button
                    onClick={() => setEditCandidate(null)}
                    disabled={savingEdit}
                    className="flex-1 border border-gray-300 text-gray-600 py-2.5 rounded-xl text-sm font-medium hover:bg-gray-50 transition disabled:opacity-50"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={saveEdit}
                    disabled={savingEdit}
                    className="flex-1 bg-[#4A5452] text-white py-2.5 rounded-xl text-sm font-bold hover:bg-[#3a4442] transition disabled:opacity-50"
                  >
                    {savingEdit ? "Salvando..." : "Salvar alterações"}
                  </button>
                </div>
              </div>
            )}
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

      {/* Perguntas de triagem standalone (mostra quando jdData não cobre as perguntas) */}
      {(!jdData || perguntas.length === 0) && (
        <div className="bg-white rounded-2xl border border-gray-200 p-6 md:p-8 mb-6">
          <div className="flex items-center gap-2 mb-5">
            <span className="text-xl">✎</span>
            <h2 className="text-base font-bold text-[#4A5452]">Perguntas de triagem</h2>
          </div>

          {generatingPerguntas && <TriagemSkeleton />}

          {!generatingPerguntas && perguntas.length === 0 && (
            <div className="bg-gradient-to-br from-[#F5F7F0] to-[#eaede5] rounded-xl p-6 text-center border border-[#d8dbd3]">
              <p className="text-[#4A5452] font-semibold text-base mb-2">
                Nenhuma pergunta de triagem cadastrada
              </p>
              <p className="text-gray-500 text-sm mb-5 max-w-sm mx-auto">
                Gere perguntas específicas para este cargo. Elas serão respondidas pelo candidato antes dos testes comportamentais.
              </p>
              {perguntasError && (
                <p className="text-red-500 text-sm mb-4">{perguntasError}</p>
              )}
              <button
                onClick={generatePerguntas}
                className="bg-[#C4FF57] text-[#4A5452] font-bold px-6 py-3 rounded-xl text-sm hover:bg-[#b3ee46] transition"
              >
                ✨ Gerar perguntas de triagem
              </button>
            </div>
          )}

          {!generatingPerguntas && perguntas.length > 0 && (
            <div>
              <ol className="space-y-3 mb-5">
                {perguntas.map((p, i) => (
                  <li key={i} className="flex gap-3 text-sm text-gray-700 leading-relaxed">
                    <span className="flex-shrink-0 w-6 h-6 rounded-full bg-[#4A5452] text-white text-xs flex items-center justify-center font-bold mt-0.5">
                      {i + 1}
                    </span>
                    {p}
                  </li>
                ))}
              </ol>
              {perguntasError && (
                <p className="text-red-500 text-xs mb-3">{perguntasError}</p>
              )}
              <button
                onClick={generatePerguntas}
                className="text-xs text-gray-400 hover:text-gray-600 transition"
              >
                Gerar novamente
              </button>
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
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5">
                Currículo <span className="text-gray-400 font-normal">(opcional, PDF, máx. 5MB)</span>
              </label>
              {cvFileName ? (
                <div className="flex items-center gap-2 bg-[#F5F7F0] border border-[#d8dbd3] rounded-lg px-3 py-2.5">
                  <span className="text-sm text-[#4A5452] flex-1 truncate">📄 {cvFileName}</span>
                  <button
                    type="button"
                    onClick={resetCv}
                    className="text-xs text-gray-400 hover:text-gray-600 font-medium flex-shrink-0"
                  >
                    Remover
                  </button>
                </div>
              ) : (
                <label className="flex items-center gap-2 cursor-pointer border border-gray-200 rounded-lg px-3 py-2.5 hover:border-[#4A5452] transition bg-white">
                  <span className="text-xs text-gray-500">📎 Anexar currículo</span>
                  <input
                    type="file"
                    accept=".pdf"
                    onChange={handleCvUpload}
                    className="hidden"
                  />
                </label>
              )}
              {cvError && <p className="text-red-500 text-xs mt-1">{cvError}</p>}
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5">
                Transcrição de entrevista <span className="text-gray-400 font-normal">(opcional)</span>
              </label>
              <textarea
                value={form.entrevistaTexto}
                onChange={(e) => setForm((f) => ({ ...f, entrevistaTexto: e.target.value }))}
                placeholder="Cole aqui a transcrição da entrevista com o candidato..."
                rows={4}
                className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-[#4A5452] bg-white resize-none"
              />
            </div>
            {formError && <p className="text-red-500 text-xs">{formError}</p>}
            <div className="flex gap-3 pt-1">
              <button
                type="button"
                onClick={() => {
                  setShowForm(false);
                  setFormError("");
                  setForm({ nome: "", email: "", linkedinUrl: "", entrevistaTexto: "" });
                  resetCv();
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
                    onClick={() => openEditModal(candidate)}
                    className="text-xs font-medium border border-gray-200 px-2.5 py-1.5 rounded-lg text-gray-600 hover:border-[#4A5452] hover:text-[#4A5452] transition"
                  >
                    Editar
                  </button>
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

function TriagemSkeleton() {
  return (
    <div className="animate-pulse space-y-4">
      {[1, 2, 3, 4, 5].map((i) => (
        <div key={i} className="flex gap-3 items-start">
          <div className="w-6 h-6 bg-gray-200 rounded-full flex-shrink-0 mt-0.5"></div>
          <div className="flex-1 space-y-1.5">
            <div className="h-4 bg-gray-200 rounded w-full"></div>
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
          </div>
        </div>
      ))}
    </div>
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
