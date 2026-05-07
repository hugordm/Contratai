"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import Navbar from "@/components/ui/NavBar";

const MOTIVOS = [
  { value: "crescimento", label: "Crescimento da equipe" },
  { value: "substituicao", label: "Substituição de colaborador" },
  { value: "nova_area", label: "Nova área / departamento" },
];

interface ColaboradorLider {
  id: string;
  nome: string;
  cargo: string;
  departamento?: string | null;
  hasPersonality: boolean;
}

interface Props {
  params: Promise<{ id: string }>;
}

export default function EditarVagaPage({ params }: Props) {
  const { id: jobId } = use(params);
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [nodes, setNodes] = useState<ColaboradorLider[]>([]);

  const [form, setForm] = useState({
    titulo: "",
    motivo: "",
    responsabilidades: "",
    metas: "",
    liderId: "",
  });

  useEffect(() => {
    async function load() {
      try {
        const [vagaRes, nodesRes] = await Promise.all([
          fetch(`/api/vagas/${jobId}`),
          fetch("/api/colaboradores"),
        ]);

        if (!vagaRes.ok) { router.push("/dashboard"); return; }

        const vaga = await vagaRes.json();
        const nodesData: ColaboradorLider[] = nodesRes.ok ? await nodesRes.json() : [];
        const withPersonality = nodesData.filter((n) => n.hasPersonality);

        const existingLideres: string[] = Array.isArray(vaga.lideresJson) ? vaga.lideresJson : [];

        setForm({
          titulo: vaga.titulo ?? "",
          motivo: vaga.motivo ?? "",
          responsabilidades: vaga.responsabilidades ?? "",
          metas: vaga.metas ?? "",
          liderId: vaga.liderId ?? existingLideres[0] ?? "",
        });
        setNodes(withPersonality);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [jobId, router]);

  const set = (field: string, value: string) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  const save = async () => {
    if (!form.titulo.trim()) { setError("O campo cargo é obrigatório."); return; }
    setSaving(true);
    setError("");
    try {
      const res = await fetch(`/api/vagas/${jobId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          titulo: form.titulo,
          motivo: form.motivo,
          responsabilidades: form.responsabilidades,
          metas: form.metas,
          liderId: form.liderId || null,
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error ?? "Erro ao salvar.");
        return;
      }
      router.push(`/vagas/${jobId}`);
    } catch {
      setError("Erro de conexão. Tente novamente.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <>
        <Navbar />
        <main className="min-h-screen bg-[#F5F7F0] p-4 md:p-8 flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-[#4A5452] border-t-transparent rounded-full animate-spin" />
        </main>
      </>
    );
  }

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-[#F5F7F0] p-4 md:p-8">
        <div className="max-w-2xl mx-auto">
          <div className="mb-6">
            <a
              href={`/vagas/${jobId}`}
              className="text-sm text-gray-500 hover:text-gray-700 transition"
            >
              ← Voltar à vaga
            </a>
          </div>

          <div className="bg-white rounded-2xl border border-gray-200 p-6 md:p-8">
            <h1 className="text-2xl font-bold text-[#4A5452] mb-1">Editar Vaga</h1>
            <p className="text-gray-500 text-sm mb-8">
              Atualize as informações da vaga.
            </p>

            <div className="space-y-6">
              <div>
                <label className="block text-sm font-semibold text-[#4A5452] mb-2">
                  Cargo <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={form.titulo}
                  onChange={(e) => set("titulo", e.target.value)}
                  placeholder="Ex: Analista de Marketing Sênior"
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-base text-gray-900 placeholder-gray-400 focus:outline-none focus:border-[#4A5452] transition"
                  style={{ minHeight: "52px" }}
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-[#4A5452] mb-2">
                  Motivo da abertura
                </label>
                <select
                  value={form.motivo}
                  onChange={(e) => set("motivo", e.target.value)}
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-base text-gray-900 focus:outline-none focus:border-[#4A5452] transition bg-white"
                  style={{ minHeight: "52px" }}
                >
                  <option value="">Selecione o motivo</option>
                  {MOTIVOS.map((m) => (
                    <option key={m.value} value={m.value}>
                      {m.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-[#4A5452] mb-2">
                  Responsabilidades
                </label>
                <textarea
                  value={form.responsabilidades}
                  onChange={(e) => set("responsabilidades", e.target.value)}
                  placeholder="Descreva as principais responsabilidades do cargo..."
                  rows={4}
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-base text-gray-900 placeholder-gray-400 focus:outline-none focus:border-[#4A5452] transition resize-none"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-[#4A5452] mb-1">
                  Metas e objetivos{" "}
                  <span className="text-gray-400 font-normal">(opcional)</span>
                </label>
                <textarea
                  value={form.metas}
                  onChange={(e) => set("metas", e.target.value)}
                  placeholder="O que esperamos que esta pessoa alcance nos primeiros 90 dias?"
                  rows={3}
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-base text-gray-900 placeholder-gray-400 focus:outline-none focus:border-[#4A5452] transition resize-none"
                />
              </div>

              {nodes.length > 0 && (
                <div>
                  <label className="block text-sm font-semibold text-[#4A5452] mb-2">
                    Líder da vaga{" "}
                    <span className="text-gray-400 font-normal">(opcional)</span>
                  </label>
                  <p className="text-xs text-gray-500 mb-3">
                    Selecione o líder direto desta posição para análise de compatibilidade.
                  </p>
                  <select
                    value={form.liderId}
                    onChange={(e) => set("liderId", e.target.value)}
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 text-base text-gray-900 focus:outline-none focus:border-[#4A5452] transition bg-white"
                    style={{ minHeight: "52px" }}
                  >
                    <option value="">Nenhum líder selecionado</option>
                    {nodes.map((node) => (
                      <option key={node.id} value={node.id}>
                        {node.nome} — {node.cargo}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {error && <p className="text-red-500 text-sm">{error}</p>}
            </div>

            <div className="flex flex-col sm:flex-row gap-3 mt-8">
              <a
                href={`/vagas/${jobId}`}
                className="flex-1 text-center border-2 border-gray-200 text-gray-600 font-bold py-4 rounded-xl text-base hover:bg-gray-50 transition"
                style={{ minHeight: "56px", lineHeight: "1", display: "flex", alignItems: "center", justifyContent: "center" }}
              >
                Cancelar
              </a>
              <button
                onClick={save}
                disabled={saving}
                className="flex-1 bg-[#C4FF57] text-[#4A5452] font-bold py-4 rounded-xl text-base hover:bg-[#b3ee46] transition disabled:opacity-50"
                style={{ minHeight: "56px" }}
              >
                {saving ? "Salvando..." : "Salvar alterações"}
              </button>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
