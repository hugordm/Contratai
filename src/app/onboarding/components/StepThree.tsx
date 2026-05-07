"use client";

import { useState } from "react";

interface Props {
  data: any;
  onUpdate: (data: any) => void;
  onBack: () => void;
  onFinish: () => void;
}

const perfis = [
  { id: "startup", label: "Startup de alto crescimento", emoji: "🚀" },
  { id: "consolidada", label: "Empresa consolidada", emoji: "🏢" },
  { id: "reestruturacao", label: "Empresa em reestruturação", emoji: "🔄" },
  { id: "outro", label: "Outro", emoji: "💼" },
];

const estilosLideranca = [
  { id: "diretivo", label: "Diretivo", desc: "Toma decisões e delega execução" },
  { id: "colaborativo", label: "Colaborativo", desc: "Decide em conjunto com o time" },
  { id: "coaching", label: "Coaching", desc: "Desenvolve e mentora as pessoas" },
  { id: "liberal", label: "Liberal", desc: "Dá autonomia total ao time" },
];

export default function StepThree({ data, onUpdate, onBack, onFinish }: Props) {
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<any>({});
  const [valorInput, setValorInput] = useState("");

  const addValor = () => {
    if (!valorInput.trim()) return;
    onUpdate({ valores: [...(data.valores || []), valorInput.trim()] });
    setValorInput("");
  };

  const removeValor = (index: number) => {
    onUpdate({ valores: data.valores.filter((_: any, i: number) => i !== index) });
  };

  const validate = () => {
    const e: any = {};
    if (!data.perfilRitmo) e.perfilRitmo = "Selecione um perfil";
    if (!data.contextoEmpresa || data.contextoEmpresa.length < 100)
      e.contextoEmpresa = "Descreva com pelo menos 100 caracteres";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleFinish = async () => {
    if (!validate()) return;
    setLoading(true);
    await onFinish();
    setLoading(false);
  };

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-900 mb-2">Contexto da empresa</h2>
      <p className="text-gray-500 mb-6">Essas informações alimentam a IA para encontrar os melhores candidatos</p>

      <div className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Perfil da empresa *
          </label>
          <div className="grid grid-cols-2 gap-3">
            {perfis.map((p) => (
              <button
                key={p.id}
                onClick={() => onUpdate({ perfilRitmo: p.id })}
                className={`p-3 rounded-lg border text-left transition ${
                  data.perfilRitmo === p.id
                    ? "border-[#4A5452] bg-[#F5F7F0]"
                    : "border-gray-200 hover:border-[#4A5452]"
                }`}>
                <span className="text-lg">{p.emoji}</span>
                <p className="text-sm font-medium text-gray-700 mt-1">{p.label}</p>
              </button>
            ))}
          </div>
          {errors.perfilRitmo && (
            <p className="text-red-500 text-xs mt-1">{errors.perfilRitmo}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Descreva o momento atual da empresa *
          </label>
          <textarea
            value={data.contextoEmpresa || ""}
            onChange={(e) => onUpdate({ contextoEmpresa: e.target.value })}
            placeholder="Conte sobre os desafios atuais, cultura, objetivos..."
            rows={4}
            className="w-full border border-gray-300 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#4A5452] resize-none"
          />
          <div className="flex justify-between mt-1">
            {errors.contextoEmpresa && (
              <p className="text-red-500 text-xs">{errors.contextoEmpresa}</p>
            )}
            <p className={`text-xs ml-auto ${data.contextoEmpresa?.length >= 100 ? "text-green-600" : "text-gray-400"}`}>
              {data.contextoEmpresa?.length || 0}/100 caracteres mínimos
            </p>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Principais desafios internos atualmente
          </label>
          <textarea
            value={data.desafiosInternos || ""}
            onChange={(e) => onUpdate({ desafiosInternos: e.target.value })}
            placeholder="Ex: Reter talentos, escalar o time de tech, melhorar comunicação entre áreas..."
            rows={3}
            className="w-full border border-gray-300 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#4A5452] resize-none"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Estilo de liderança predominante
          </label>
          <div className="grid grid-cols-2 gap-3">
            {estilosLideranca.map((e) => (
              <button
                key={e.id}
                onClick={() => onUpdate({ estiloLideranca: e.id })}
                className={`p-3 rounded-lg border text-left transition ${
                  data.estiloLideranca === e.id
                    ? "border-[#4A5452] bg-[#F5F7F0]"
                    : "border-gray-200 hover:border-[#4A5452]"
                }`}>
                <p className="text-sm font-medium text-gray-700">{e.label}</p>
                <p className="text-xs text-gray-500 mt-0.5">{e.desc}</p>
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Valores da empresa
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              value={valorInput}
              onChange={(e) => setValorInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && addValor()}
              placeholder="Ex: Inovação, Transparência..."
              className="flex-1 border border-gray-300 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#4A5452]"
            />
            <button
              onClick={addValor}
              className="px-4 py-3 bg-gray-100 rounded-lg text-sm font-medium hover:bg-gray-200 transition">
              + Adicionar
            </button>
          </div>
          {data.valores?.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-3">
              {data.valores.map((v: string, i: number) => (
                <span key={i} className="bg-gray-100 text-gray-700 px-3 py-1 rounded-full text-sm flex items-center gap-2">
                  {v}
                  <button onClick={() => removeValor(i)} className="text-gray-400 hover:text-red-500">×</button>
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="flex gap-3 mt-8">
        <button
          onClick={onBack}
          className="flex-1 border border-gray-300 text-gray-700 py-3 rounded-lg font-medium hover:bg-gray-50 transition">
          ← Voltar
        </button>
        <button
          onClick={handleFinish}
          disabled={loading}
          className="flex-1 bg-[#4A5452] text-white py-3 rounded-lg font-medium hover:bg-[#597048] transition disabled:opacity-50">
          {loading ? "Salvando..." : "Concluir →"}
        </button>
      </div>
    </div>
  );
}