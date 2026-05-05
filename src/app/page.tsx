import Link from "next/link";

export default function Home() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center bg-gray-50">
      <div className="text-center max-w-2xl px-4">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          RH Inteligente
        </h1>
        <p className="text-xl text-gray-600 mb-8">
          Encontre os melhores candidatos com psicometria e inteligência artificial
        </p>
        <div className="flex gap-4 justify-center">
          <Link
            href="/auth/login"
            className="bg-black text-white px-8 py-3 rounded-lg font-medium hover:bg-gray-800 transition"
          >
            Entrar
          </Link>
          <Link
            href="/auth/register"
            className="border border-gray-300 text-gray-700 px-8 py-3 rounded-lg font-medium hover:bg-gray-100 transition"
          >
            Criar conta
          </Link>
        </div>
      </div>
    </main>
  );
}