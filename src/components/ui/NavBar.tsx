"use client";

import { useSession } from "next-auth/react";
import Link from "next/link";
import SignOutButton from "./SignOutButton";

export default function Navbar() {
  const { data: session } = useSession();

  return (
    <header className="bg-[#4A5452]">
      <div className="max-w-6xl mx-auto px-8 py-4 flex items-center justify-between">
        <div className="flex items-center gap-8">
          <Link href="/dashboard" className="font-bold text-[#C4FF57] text-lg">
            Contratai
          </Link>
          <nav className="flex items-center gap-6">
            <Link href="/dashboard" className="text-sm text-white/70 hover:text-white transition">
              Dashboard
            </Link>
            <Link href="/colaboradores" className="text-sm text-white/70 hover:text-white transition">
              Colaboradores
            </Link>
          </nav>
        </div>
        <div className="flex items-center gap-4">
          {session?.user?.name && (
            <span className="text-sm text-white/60">{session.user.name}</span>
          )}
          <SignOutButton />
        </div>
      </div>
    </header>
  );
}
