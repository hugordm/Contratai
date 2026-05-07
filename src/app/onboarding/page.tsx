"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import StepOne from "./components/StepOne";
import StepOrgChart from "./components/StepOrgChart";
import StepCollaboratorTests from "./components/StepCollaboratorTests";
import StepThree from "./components/StepThree";
import type { Colaborador } from "./components/StepOrgChart";
import type { ColaboradorComToken } from "./components/StepCollaboratorTests";

const STEP_LABELS = ["Dados", "Organograma", "Avaliações", "Contexto"];
const TOTAL_STEPS = 4;

export default function OnboardingPage() {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    razaoSocial: "",
    cnpj: "",
    logoUrl: "",
    urlEmpresa: "",
    cep: "",
    logradouro: "",
    numero: "",
    cidade: "",
    estado: "",
    perfilRitmo: "",
    contextoEmpresa: "",
    desafiosInternos: "",
    estiloLideranca: "",
    valores: [] as string[],
  });
  const [colaboradores, setColaboradores] = useState<Colaborador[]>([]);
  const [colaboradoresComToken, setColaboradoresComToken] = useState<ColaboradorComToken[]>([]);
  const [testOption, setTestOption] = useState<"ja_tenho" | "nao_tenho" | "">("");

  const router = useRouter();
  const { update } = useSession();

  const updateData = (data: Partial<typeof formData>) =>
    setFormData((prev) => ({ ...prev, ...data }));

  const handleTestUpdate = (
    option: "ja_tenho" | "nao_tenho",
    items: ColaboradorComToken[]
  ) => {
    setTestOption(option);
    setColaboradoresComToken(items);
  };

  const handleFinish = async () => {
    const res = await fetch("/api/company/create", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...formData,
        colaboradores: colaboradoresComToken,
        testOption,
      }),
    });
    if (res.ok) {
      const data = await res.json();
      await update({ companyId: data.companyId });
      router.refresh();
      router.push("/dashboard");
    }
  };

  return (
    <main className="min-h-screen bg-[#F5F7F0] flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl border border-gray-200 w-full max-w-2xl p-6 md:p-8">

        {/* Progress bar */}
        <div className="mb-8">
          <div className="flex items-center gap-0 mb-3">
            {STEP_LABELS.map((label: any, i: number) => {
              const s = i + 1;
              const done = step > s;
              const active = step === s;
              return (
                <div key={s} className="flex items-center flex-1">
                  <div className="flex flex-col items-center">
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all flex-shrink-0 ${
                        done
                          ? "bg-[#4A5452] text-[#C4FF57]"
                          : active
                          ? "bg-[#4A5452] text-white"
                          : "bg-gray-100 text-gray-400"
                      }`}
                    >
                      {done ? "✓" : s}
                    </div>
                    <span className={`text-[10px] mt-1 font-medium hidden sm:block ${active ? "text-[#4A5452]" : "text-gray-400"}`}>
                      {label}
                    </span>
                  </div>
                  {s < TOTAL_STEPS && (
                    <div className={`flex-1 h-0.5 mx-1 transition-all ${done ? "bg-[#4A5452]" : "bg-gray-200"}`} />
                  )}
                </div>
              );
            })}
          </div>
          <p className="text-xs text-gray-400 text-right">Etapa {step} de {TOTAL_STEPS}</p>
        </div>

        {step === 1 && (
          <StepOne data={formData} onUpdate={updateData} onNext={() => setStep(2)} />
        )}

        {step === 2 && (
          <StepOrgChart
            colaboradores={colaboradores}
            onUpdate={setColaboradores}
            onNext={() => setStep(3)}
            onBack={() => setStep(1)}
            onSkip={() => { setColaboradores([]); setStep(3); }}
          />
        )}

        {step === 3 && (
          <StepCollaboratorTests
            colaboradores={colaboradores}
            testOption={testOption}
            colaboradoresComToken={colaboradoresComToken}
            onUpdate={handleTestUpdate}
            onNext={() => setStep(4)}
            onBack={() => setStep(2)}
          />
        )}

        {step === 4 && (
          <StepThree
            data={formData}
            onUpdate={updateData}
            onBack={() => setStep(3)}
            onFinish={handleFinish}
          />
        )}
      </div>
    </main>
  );
}
