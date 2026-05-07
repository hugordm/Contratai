"use client";

import { signOut } from "next-auth/react";

export default function SignOutButton() {
  return (
    <button
      onClick={() => signOut({ callbackUrl: "/auth/login" })}
      className="text-sm border border-white/30 px-4 py-2 rounded-lg text-white/80 hover:bg-white/10 transition">
      Sair
    </button>
  );
}