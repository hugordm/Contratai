import Link from "next/link";

export default function NotFound() {
  return (
    <main className="min-h-screen bg-[#F5F7F0] flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl border border-gray-200 p-10 max-w-md w-full text-center">
        <div
          className="w-16 h-16 rounded-2xl flex items-center justify-center text-2xl font-bold mx-auto mb-5"
          style={{ backgroundColor: "#C4FF57", color: "#4A5452" }}
        >
          404
        </div>
        <h1 className="text-xl font-bold text-[#4A5452] mb-2">
          Página não encontrada
        </h1>
        <p className="text-sm text-gray-500 mb-7 leading-relaxed">
          O endereço que você acessou não existe ou foi removido. Verifique o link ou volte ao dashboard.
        </p>
        <Link
          href="/dashboard"
          className="inline-flex items-center font-bold px-6 py-3 rounded-xl text-sm transition"
          style={{ backgroundColor: "#C4FF57", color: "#4A5452", minHeight: "44px" }}
        >
          Voltar ao dashboard →
        </Link>
      </div>
    </main>
  );
}
