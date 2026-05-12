import Link from "next/link";

const features = [
  {
    icon: "🧠",
    title: "Motor próprio de testes",
    description:
      "DISC e Eneagrama aplicados diretamente pelo Contratai. Portal white-label com a identidade visual da sua empresa.",
  },
  {
    icon: "✨",
    title: "Match com IA",
    description:
      "Cada candidato recebe um score de compatibilidade, análise de fit cultural, guia de delegação e perguntas de entrevista gerados por IA.",
  },
  {
    icon: "🔗",
    title: "Link de teste para candidatos",
    description:
      "Envie um link personalizado. O candidato responde de qualquer dispositivo. Você recebe o resultado no dashboard automaticamente.",
  },
];

export default function Home() {
  return (
    <main className="min-h-screen flex flex-col bg-[#F5F7F0]">
      {/* Nav */}
      <header className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <span className="font-bold text-[#4A5452] text-xl tracking-tight flex items-center gap-2">
            <img
              src="https://i.postimg.cc/vDpmhs5m/Captura-de-Tela-2026-05-05-as-14-20-29.png"
              alt="Enviagora"
              className="h-10 w-auto"
            />
            Contratai
          </span>
          <div className="flex items-center gap-3">
            <Link
              href="/auth/login"
              className="text-sm font-medium text-[#4A5452] hover:text-black transition px-3 py-2"
              style={{ minHeight: "44px", display: "flex", alignItems: "center" }}
            >
              Entrar
            </Link>
            <Link
              href="/auth/login/register"
              className="text-sm font-bold px-4 py-2.5 rounded-xl transition"
              style={{
                backgroundColor: "#C4FF57",
                color: "#4A5452",
                minHeight: "44px",
                display: "flex",
                alignItems: "center",
              }}
            >
              Criar conta
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="flex-1 flex flex-col items-center justify-center text-center px-4 py-20">
        <div className="max-w-2xl mx-auto">
          <span
            className="inline-block text-xs font-bold uppercase tracking-widest px-3 py-1.5 rounded-full mb-6"
            style={{ backgroundColor: "#C4FF57", color: "#4A5452" }}
          >
            Psicometria + IA para RH
          </span>

          <h1 className="text-4xl md:text-5xl font-bold text-[#4A5452] leading-tight mb-4">
            Contrate quem realmente
            <br />
            <span style={{ color: "#4A5452" }}>encaixa na sua empresa</span>
          </h1>

          <p className="text-lg text-gray-600 mb-10 max-w-xl mx-auto leading-relaxed">
            Aplique testes DISC e Eneagrama, analise candidatos com IA e receba um ranking
            de fit cultural — tudo em um único lugar.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href="/auth/login/register"
              className="font-bold px-8 py-4 rounded-xl text-base transition text-center"
              style={{ backgroundColor: "#C4FF57", color: "#4A5452", minHeight: "56px", display: "flex", alignItems: "center", justifyContent: "center" }}
            >
              Começar agora — é grátis
            </Link>
            <Link
              href="/auth/login"
              className="bg-white border border-gray-300 text-gray-700 font-medium px-8 py-4 rounded-xl text-base hover:border-[#4A5452] transition text-center"
              style={{ minHeight: "56px", display: "flex", alignItems: "center", justifyContent: "center" }}
            >
              Já tenho conta
            </Link>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="bg-white border-t border-gray-200 px-4 py-16">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-center text-2xl font-bold text-[#4A5452] mb-10">
            Tudo que você precisa para contratar melhor
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {features.map((f: any) => (
              <div
                key={f.title}
                className="rounded-2xl border border-gray-200 p-6 hover:border-[#4A5452] transition"
              >
                <div className="text-3xl mb-3">{f.icon}</div>
                <h3 className="font-bold text-[#4A5452] mb-2 text-base">{f.title}</h3>
                <p className="text-sm text-gray-600 leading-relaxed">{f.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Bottom CTA */}
      <section className="bg-[#4A5452] px-4 py-14 text-center">
        <h2 className="text-2xl font-bold text-white mb-3">
          Pronto para contratar com mais inteligência?
        </h2>
        <p className="text-[#C4FF57] mb-7 text-sm">
          Configure sua empresa em menos de 5 minutos.
        </p>
        <Link
          href="/auth/login/register"
          className="inline-flex items-center font-bold px-8 py-4 rounded-xl text-base transition"
          style={{ backgroundColor: "#C4FF57", color: "#4A5452" }}
        >
          Criar conta grátis →
        </Link>
      </section>
    </main>
  );
}
