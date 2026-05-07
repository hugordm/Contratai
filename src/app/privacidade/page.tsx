export default function PrivacidadePage() {
  return (
    <main className="min-h-screen bg-[#F5F7F0] py-12 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-2xl border border-gray-200 p-8">
          <h1 className="text-2xl font-bold text-[#4A5452] mb-2">
            Política de Privacidade
          </h1>
          <p className="text-sm text-gray-400 mb-8">Última atualização: maio de 2026</p>

          <div className="prose prose-sm max-w-none text-gray-700 space-y-6">
            <section>
              <h2 className="text-base font-semibold text-[#4A5452] mb-2">
                1. Dados coletados
              </h2>
              <p className="text-sm leading-relaxed">
                Coletamos apenas as informações necessárias para o processo seletivo: nome, e-mail
                e respostas ao questionário comportamental DISC. Nenhum dado sensível de saúde ou
                financeiro é solicitado.
              </p>
            </section>

            <section>
              <h2 className="text-base font-semibold text-[#4A5452] mb-2">
                2. Finalidade do tratamento
              </h2>
              <p className="text-sm leading-relaxed">
                Os dados são utilizados exclusivamente para fins de recrutamento e seleção pela
                empresa responsável pelo processo. Não compartilhamos suas informações com
                terceiros sem seu consentimento.
              </p>
            </section>

            <section>
              <h2 className="text-base font-semibold text-[#4A5452] mb-2">
                3. Base legal (LGPD)
              </h2>
              <p className="text-sm leading-relaxed">
                O tratamento é realizado com base no consentimento do titular (Art. 7º, I da Lei
                13.709/2018 — LGPD). Você pode revogar seu consentimento a qualquer momento
                enviando um e-mail para a empresa responsável pelo processo seletivo.
              </p>
            </section>

            <section>
              <h2 className="text-base font-semibold text-[#4A5452] mb-2">
                4. Aviso sobre o teste comportamental
              </h2>
              <p className="text-sm leading-relaxed">
                O teste DISC é uma ferramenta de autoconhecimento e suporte a RH, não uma
                avaliação psicológica clínica oficial (SATEPSI). Os resultados não substituem
                avaliações realizadas por profissionais de saúde mental habilitados.
              </p>
            </section>

            <section>
              <h2 className="text-base font-semibold text-[#4A5452] mb-2">
                5. Retenção de dados
              </h2>
              <p className="text-sm leading-relaxed">
                Os dados são armazenados pelo tempo necessário ao processo seletivo e poderão
                ser excluídos mediante solicitação do titular.
              </p>
            </section>

            <section>
              <h2 className="text-base font-semibold text-[#4A5452] mb-2">
                6. Seus direitos
              </h2>
              <p className="text-sm leading-relaxed">
                Conforme a LGPD, você tem direito a: acesso, correção, exclusão, portabilidade
                e revogação do consentimento. Para exercer esses direitos, entre em contato com
                a empresa responsável pelo processo seletivo.
              </p>
            </section>
          </div>
        </div>
      </div>
    </main>
  );
}
