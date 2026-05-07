import Link from "next/link";

export default function RegisterPage() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-[#F5F7F0]">
      <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-200 w-full max-w-md">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Criar conta</h1>
        <p className="text-gray-500 mb-8">
          Crie sua conta gratuitamente usando o Google
        </p>

        <div className="bg-gray-50 rounded-lg p-4 mb-6 border border-gray-200">
          <p className="text-sm text-gray-600">
            Não precisamos de senha. Usamos o Google para autenticar sua identidade com segurança.
          </p>
        </div>

        <Link
          href="/auth/login"
          className="w-full flex items-center justify-center gap-3 bg-[#C4FF57] text-[#4A5452] rounded-lg px-4 py-3 font-medium hover:bg-[#b3ee46] transition">
          Criar conta com Google
        </Link>

        <p className="text-center text-sm text-gray-500 mt-6">
          Já tem uma conta?{" "}
          <Link href="/auth/login" className="text-[#4A5452] font-medium hover:underline">
            Entrar
          </Link>
        </p>
      </div>
    </main>
  );
}