"use client";

import { useState } from "react";

export interface Colaborador {
  id: string;
  nome: string;
  cargo: string;
  departamento: string;
  email: string;
}

interface Props {
  colaboradores: Colaborador[];
  onUpdate: (colaboradores: Colaborador[]) => void;
  onNext: () => void;
  onBack: () => void;
  onSkip: () => void;
}

function emptyColaborador(): Colaborador {
  return { id: crypto.randomUUID(), nome: "", cargo: "", departamento: "", email: "" };
}

export default function StepOrgChart({ colaboradores, onUpdate, onNext, onBack, onSkip }: Props) {
  const [errors, setErrors] = useState<Record<string, string>>({});

  const add = () => onUpdate([...colaboradores, emptyColaborador()]);

  const remove = (id: string) => onUpdate(colaboradores.filter((c) => c.id !== id));

  const update = (id: string, field: keyof Colaborador, value: string) =>
    onUpdate(colaboradores.map((c) => (c.id === id ? { ...c, [field]: value } : c)));

  const validate = () => {
    if (colaboradores.length === 0) return true; // empty is OK (user can skip)
    const e: Record<string, string> = {};
    colaboradores.forEach((c) => {
      if (!c.nome.trim()) e[`${c.id}-nome`] = "Nome obrigatório";
      if (!c.cargo.trim()) e[`${c.id}-cargo`] = "Cargo obrigatório";
    });
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleNext = () => {
    if (validate()) onNext();
  };

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-900 mb-1">Organograma da empresa</h2>
      <p className="text-gray-500 text-sm mb-6">
        Cadastre sua equipe para enviar avaliações comportamentais. Você pode pular e adicionar depois.
      </p>

      <div className="space-y-4">
        {colaboradores.length === 0 && (
          <div className="border-2 border-dashed border-gray-200 rounded-xl p-8 text-center">
            <p className="text-gray-400 text-sm">Nenhum colaborador cadastrado</p>
            <button
              onClick={add}
              className="mt-3 text-sm font-semibold text-[#4A5452] hover:underline"
            >
              + Adicionar o primeiro colaborador
            </button>
          </div>
        )}

        {colaboradores.map((c, idx) => (
          <div key={c.id} className="border border-gray-200 rounded-xl p-4 bg-gray-50">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                Colaborador {idx + 1}
              </span>
              <button
                onClick={() => remove(c.id)}
                className="text-gray-400 hover:text-red-500 text-sm transition"
              >
                Remover
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Nome *</label>
                <input
                  type="text"
                  value={c.nome}
                  onChange={(e) => update(c.id, "nome", e.target.value)}
                  placeholder="Ex: João Silva"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#4A5452]"
                />
                {errors[`${c.id}-nome`] && (
                  <p className="text-red-500 text-xs mt-0.5">{errors[`${c.id}-nome`]}</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Cargo *</label>
                <input
                  type="text"
                  value={c.cargo}
                  onChange={(e) => update(c.id, "cargo", e.target.value)}
                  placeholder="Ex: Desenvolvedor Senior"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#4A5452]"
                />
                {errors[`${c.id}-cargo`] && (
                  <p className="text-red-500 text-xs mt-0.5">{errors[`${c.id}-cargo`]}</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Departamento</label>
                <input
                  type="text"
                  value={c.departamento}
                  onChange={(e) => update(c.id, "departamento", e.target.value)}
                  placeholder="Ex: Tecnologia"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#4A5452]"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">E-mail</label>
                <input
                  type="email"
                  value={c.email}
                  onChange={(e) => update(c.id, "email", e.target.value)}
                  placeholder="colaborador@empresa.com"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#4A5452]"
                />
              </div>
            </div>
          </div>
        ))}

        {colaboradores.length > 0 && (
          <button
            onClick={add}
            className="w-full border-2 border-dashed border-gray-300 rounded-xl py-3 text-sm font-medium text-gray-500 hover:border-[#4A5452] hover:text-[#4A5452] transition"
          >
            + Adicionar colaborador
          </button>
        )}
      </div>

      <div className="flex gap-3 mt-8">
        <button
          onClick={onBack}
          className="border border-gray-300 text-gray-700 py-3 px-4 rounded-lg font-medium hover:bg-gray-50 transition"
          style={{ minHeight: "48px" }}
        >
          ← Voltar
        </button>
        <button
          onClick={onSkip}
          className="flex-1 border border-gray-300 text-gray-500 py-3 rounded-lg font-medium hover:bg-gray-50 transition"
          style={{ minHeight: "48px" }}
        >
          Pular esta etapa
        </button>
        <button
          onClick={handleNext}
          className="flex-1 bg-[#4A5452] text-white py-3 rounded-lg font-medium hover:bg-[#3a4442] transition"
          style={{ minHeight: "48px" }}
        >
          Continuar →
        </button>
      </div>
    </div>
  );
}
