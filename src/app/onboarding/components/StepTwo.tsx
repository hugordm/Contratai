"use client";

import { useState } from "react";

interface Props {
  data: any;
  onUpdate: (data: any) => void;
  onNext: () => void;
  onBack: () => void;
}

export default function StepTwo({ data, onUpdate, onNext, onBack }: Props) {
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<any>({});

  const buscarCEP = async (cep: string) => {
    const clean = cep.replace(/\D/g, "");
    if (clean.length !== 8) return;
    setLoading(true);
    try {
      const res = await fetch(`https://viacep.com.br/ws/${clean}/json/`);
      const data2 = await res.json();
      if (!data2.erro) {
        onUpdate({
          logradouro: data2.logradouro,
          cidade: data2.localidade,
          estado: data2.uf,
        });
      }
    } catch {}
    setLoading(false);
  };

  const validate = () => {
    const e: any = {};
    if (!data.cep) e.cep = "Campo obrigatório";
    if (!data.cidade) e.cidade = "Campo obrigatório";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-900 mb-2">Endereço</h2>
      <p className="text-gray-500 mb-6">Digite o CEP para preencher automaticamente</p>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">CEP *</label>
          <div className="flex gap-2">
            <input
              type="text"
              value={data.cep}
              onChange={(e) => {
                const v = e.target.value.replace(/\D/g, "").slice(0, 8);
                onUpdate({ cep: v });
                if (v.length === 8) buscarCEP(v);
              }}
              placeholder="00000000"
              className="flex-1 border border-gray-300 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-black"
            />
            {loading && (
              <div className="flex items-center px-4 text-sm text-gray-500">
                Buscando...
              </div>
            )}
          </div>
          {errors.cep && <p className="text-red-500 text-xs mt-1">{errors.cep}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Logradouro</label>
          <input
            type="text"
            value={data.logradouro}
            onChange={(e) => onUpdate({ logradouro: e.target.value })}
            placeholder="Rua, Avenida..."
            className="w-full border border-gray-300 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-black"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Número</label>
            <input
              type="text"
              value={data.numero}
              onChange={(e) => onUpdate({ numero: e.target.value })}
              placeholder="123"
              className="w-full border border-gray-300 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-black"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Estado</label>
            <input
              type="text"
              value={data.estado}
              onChange={(e) => onUpdate({ estado: e.target.value })}
              placeholder="PE"
              className="w-full border border-gray-300 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-black"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Cidade *</label>
          <input
            type="text"
            value={data.cidade}
            onChange={(e) => onUpdate({ cidade: e.target.value })}
            placeholder="Sua cidade"
            className="w-full border border-gray-300 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-black"
          />
          {errors.cidade && <p className="text-red-500 text-xs mt-1">{errors.cidade}</p>}
        </div>
      </div>

      <div className="flex gap-3 mt-8">
        <button
          onClick={onBack}
          className="flex-1 border border-gray-300 text-gray-700 py-3 rounded-lg font-medium hover:bg-gray-50 transition"
        >
          ← Voltar
        </button>
        <button
          onClick={() => validate() && onNext()}
          className="flex-1 bg-black text-white py-3 rounded-lg font-medium hover:bg-gray-800 transition"
        >
          Continuar →
        </button>
      </div>
    </div>
  );
}