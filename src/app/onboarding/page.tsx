"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import StepOne from "./components/StepOne";
import StepTwo from "./components/StepTwo";
import StepThree from "./components/StepThree";

export default function OnboardingPage() {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    razaoSocial: "",
    cnpj: "",
    logoUrl: "",
    cep: "",
    logradouro: "",
    numero: "",
    cidade: "",
    estado: "",
    perfilRitmo: "",
    contextoEmpresa: "",
    valores: [] as string[],
  });
  const router = useRouter();

  const updateData = (data: Partial<typeof formData>) => {
    setFormData((prev) => ({ ...prev, ...data }));
  };

  return (
    <main className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl border border-gray-200 w-full max-w-2xl p-8">
        
        {/* Progresso */}
        <div className="flex items-center gap-2 mb-8">
          {[1, 2, 3].map((s) => (
            <div key={s} className="flex items-center gap-2">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-all ${
                step >= s ? "bg-black text-white" : "bg-gray-100 text-gray-400"
              }`}>
                {s}
              </div>
              {s < 3 && (
                <div className={`h-0.5 w-16 transition-all ${step > s ? "bg-black" : "bg-gray-200"}`} />
              )}
            </div>
          ))}
          <span className="ml-2 text-sm text-gray-500">Etapa {step} de 3</span>
        </div>

        {step === 1 && (
          <StepOne
            data={formData}
            onUpdate={updateData}
            onNext={() => setStep(2)}
          />
        )}
        {step === 2 && (
          <StepTwo
            data={formData}
            onUpdate={updateData}
            onNext={() => setStep(3)}
            onBack={() => setStep(1)}
          />
        )}
        {step === 3 && (
          <StepThree
            data={formData}
            onUpdate={updateData}
            onBack={() => setStep(2)}
            onFinish={async () => {
              const res = await fetch("/api/company/create", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(formData),
              });
              if (res.ok) router.push("/dashboard");
            }}
          />
        )}
      </div>
    </main>
  );
}