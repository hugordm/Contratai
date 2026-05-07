"use client";

import { useState } from "react";

interface Props {
  data: any;
  onUpdate: (data: any) => void;
  onNext: () => void;
}

function formatCNPJ(value: string) {
  return value
    .replace(/\D/g, "")
    .slice(0, 14)
    .replace(/^(\d{2})(\d)/, "$1.$2")
    .replace(/^(\d{2})\.(\d{3})(\d)/, "$1.$2.$3")
    .replace(/\.(\d{3})(\d)/, ".$1/$2")
    .replace(/(\d{4})(\d)/, "$1-$2");
}

export default function StepOne({ data, onUpdate, onNext }: Props) {
  const [errors, setErrors] = useState<any>({});

  const validate = () => {
    const e: any = {};
    if (!data.razaoSocial) e.razaoSocial = "Campo obrigatório";
    if (!data.cnpj || data.cnpj.replace(/\D/g, "").length < 14)
      e.cnpj = "CNPJ inválido";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-900 mb-2">Dados da empresa</h2>
      <p className="text-gray-500 mb-6">Vamos começar com as informações básicas</p>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Razão Social *
          </label>
          <input
            type="text"
            value={data.razaoSocial}
            onChange={(e) => onUpdate({ razaoSocial: e.target.value })}
            placeholder="Ex: Empresa Exemplo Ltda"
            className="w-full border border-gray-300 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#4A5452]"
          />
          {errors.razaoSocial && (
            <p className="text-red-500 text-xs mt-1">{errors.razaoSocial}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            CNPJ *
          </label>
          <input
            type="text"
            value={data.cnpj}
            onChange={(e) => onUpdate({ cnpj: formatCNPJ(e.target.value) })}
            placeholder="00.000.000/0000-00"
            className="w-full border border-gray-300 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#4A5452]"
          />
          {errors.cnpj && (
            <p className="text-red-500 text-xs mt-1">{errors.cnpj}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            URL da empresa
          </label>
          <input
            type="url"
            value={data.urlEmpresa || ""}
            onChange={(e) => onUpdate({ urlEmpresa: e.target.value })}
            placeholder="https://suaempresa.com.br (opcional)"
            className="w-full border border-gray-300 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#4A5452]"
          />
          <p className="text-xs text-gray-400 mt-1">Usada pela IA para enriquecer o contexto da empresa</p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Logo da empresa
          </label>
          <input
            type="url"
            value={data.logoUrl}
            onChange={(e) => onUpdate({ logoUrl: e.target.value })}
            placeholder="https://suaempresa.com/logo.png (opcional)"
            className="w-full border border-gray-300 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#4A5452]"
          />
          <p className="text-xs text-gray-400 mt-1">Cole a URL da logo ou deixe em branco por enquanto</p>
        </div>
      </div>

      <button
        onClick={() => validate() && onNext()}
        className="w-full mt-8 bg-[#4A5452] text-white py-3 rounded-lg font-medium hover:bg-[#597048] transition">
        Continuar →
      </button>
    </div>
  );
}