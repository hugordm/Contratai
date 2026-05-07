import { Suspense } from "react";
import LoginInner from "./LoginInner";

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen flex items-center justify-center bg-[#F5F7F0]">
          <p className="text-gray-500">Redirecionando para o Google...</p>
        </main>
      }
    >
      <LoginInner />
    </Suspense>
  );
}
