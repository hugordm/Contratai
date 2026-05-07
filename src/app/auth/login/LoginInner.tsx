"use client";

import { signIn } from "next-auth/react";
import { useSearchParams } from "next/navigation";
import { useEffect } from "react";

export default function LoginInner() {
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/dashboard";

  useEffect(() => {
    signIn("google", { callbackUrl });
  }, []);

  return (
    <main className="min-h-screen flex items-center justify-center bg-[#F5F7F0]">
      <div className="text-center">
        <p className="text-gray-500">Redirecionando para o Google...</p>
      </div>
    </main>
  );
}
