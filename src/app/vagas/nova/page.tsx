"use client";

import { useState, useEffect } from "react";
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

export default function NovaVagaPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
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
    fetch("/api/colaboradores")
      .then((r) => r.ok ? r.json() : [])
      .then((data: ColaboradorLider[]) => setNodes(data.filter((n) => n.hasPersonality)))
      .catch(() => {});
  }, []);

  const set = (field: string, value: string) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  const save = async (redirectTo: "ia" | "candidatos") => {
    if (!form.titulo.trim()) {
      setError("O campo cargo é obrigatório.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/vagas", {
        method: "POST",
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
        setError(data.error ?? "Erro ao criar vaga.");
        setLoading(false);
        return;
      }
      const { id } = await res.json();
      router.push(`/vagas/${id}${redirectTo === "ia" ? "?ajuda=ia" : ""}`);
    } catch {
      setError("Erro de conexão. Tente novamente.");
      setLoading(false);
    }
  };

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-[#F5F7F0] p-4 md:p-8">
        <div className="max-w-2xl mx-auto">
          <div className="mb-6">
            <a
              href="/dashboard"
              className="text-sm text-gray-500 hover:text-gray-700 transition"
            >
              ← Voltar ao dashboard
            </a>
          </div>

          <div className="bg-white rounded-2xl border border-gray-200 p-6 md:p-8">
            <h1 className="text-2xl font-bold text-[#4A5452] mb-1">Nova Vaga</h1>
            <p className="text-gray-500 text-sm mb-8">
              Preencha as informações da vaga para iniciar o processo seletivo.
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
                  {MOTIVOS.map((m: any) => (
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
                    Selecione o líder direto para análise de compatibilidade no match.
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

              {error && (
                <p className="text-red-500 text-sm">{error}</p>
              )}
            </div>

            <div className="flex flex-col sm:flex-row gap-3 mt-8">
              <button
                onClick={() => save("ia")}
                disabled={loading}
                className="flex-1 bg-[#C4FF57] text-[#4A5452] font-bold py-4 rounded-xl text-base hover:bg-[#b3ee46] transition disabled:opacity-50"
                style={{ minHeight: "56px" }}
              >
                {loading ? "Salvando..." : "✨ Preciso de ajuda da IA"}
              </button>
              <button
                onClick={() => save("candidatos")}
                disabled={loading}
                className="flex-1 border-2 border-[#4A5452] text-[#4A5452] font-bold py-4 rounded-xl text-base hover:bg-[#4A5452] hover:text-white transition disabled:opacity-50"
                style={{ minHeight: "56px" }}
              >
                {loading ? "Salvando..." : "Já tenho candidatos"}
              </button>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
