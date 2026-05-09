import NextAuth, { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import { prisma } from "@/lib/prisma";
import { resend } from "@/lib/resend";

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  secret: process.env.NEXTAUTH_SECRET,
  pages: {
    signIn: "/auth/login",
  },
  session: {
    strategy: "jwt",
  },
  cookies: {
    sessionToken: {
      name: process.env.NODE_ENV === "production"
        ? "__Secure-next-auth.session-token"
        : "next-auth.session-token",
      options: {
        httpOnly: true,
        sameSite: "lax" as const,
        path: "/",
        secure: process.env.NODE_ENV === "production",
      },
    },
    callbackUrl: {
      name: process.env.NODE_ENV === "production"
        ? "__Secure-next-auth.callback-url"
        : "next-auth.callback-url",
      options: {
        sameSite: "lax" as const,
        path: "/",
        secure: process.env.NODE_ENV === "production",
      },
    },
    csrfToken: {
      name: process.env.NODE_ENV === "production"
        ? "__Host-next-auth.csrf-token"
        : "next-auth.csrf-token",
      options: {
        httpOnly: true,
        sameSite: "lax" as const,
        path: "/",
        secure: process.env.NODE_ENV === "production",
      },
    },
  },
  callbacks: {
    async jwt({ token, user, trigger }) {
      if (user) {
        token.id = user.id;
      }
      if (user || trigger === "update") {
        const userId = (user?.id ?? token.id ?? token.sub) as string | undefined;
        if (userId) {
          const dbUser = await prisma.user.findUnique({
            where: { id: userId },
            select: { companyId: true },
          });
          token.companyId = dbUser?.companyId ?? null;
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.companyId = token.companyId as string | null;
      }
      return session;
    },
  },
  events: {
    async createUser({ user }) {
      if (!user.email) return;
      const name = user.name ?? "usuário";
      const baseUrl = process.env.NEXTAUTH_URL ?? "http://localhost:3000";
      try {
        await resend.emails.send({
          from: "Contratai <noreply@pirulitodocorte.xyz>",
          to: user.email,
          subject: "Bem-vindo ao Contratai! 🎉",
          html: buildWelcomeEmail(name, baseUrl),
        });
      } catch {
        // Non-fatal
      }
    },
  },
};

function buildWelcomeEmail(name: string, baseUrl: string) {
  return `<!DOCTYPE html>
<html lang="pt-BR">
<head><meta charset="UTF-8"></head>
<body style="font-family:Arial,sans-serif;background:#f0f0f0;padding:32px 16px;margin:0;">
  <table width="100%" cellpadding="0" cellspacing="0">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">
        <tr>
          <td style="background:#4A5452;padding:28px 32px;border-radius:12px 12px 0 0;text-align:center;">
            <h1 style="margin:0;color:#C4FF57;font-size:24px;font-weight:bold;letter-spacing:-0.5px;">Contratai</h1>
            <p style="margin:4px 0 0;color:#C4FF57;opacity:0.7;font-size:12px;">Psicometria + IA para RH</p>
          </td>
        </tr>
        <tr>
          <td style="background:#F5F7F0;padding:36px 32px;border:1px solid #dde0da;border-top:none;border-radius:0 0 12px 12px;">
            <h2 style="margin:0 0 12px;font-size:20px;color:#4A5452;">Olá, ${name}! 👋</h2>
            <p style="margin:0 0 16px;font-size:15px;color:#444;line-height:1.6;">
              Seja bem-vindo ao <strong>Contratai</strong>. Agora você tem acesso a uma plataforma completa para contratar com mais inteligência — combinando testes comportamentais (DISC, Eneagrama e 16 Personalidades) com análise por IA.
            </p>
            <p style="margin:0 0 24px;font-size:15px;color:#444;line-height:1.6;">
              O próximo passo é completar o cadastro da sua empresa. Leva menos de 5 minutos.
            </p>
            <table width="100%" cellpadding="0" cellspacing="0">
              <tr><td align="center" style="padding:8px 0 24px;">
                <a href="${baseUrl}/dashboard"
                   style="display:inline-block;background:#C4FF57;color:#4A5452;padding:14px 36px;
                          border-radius:10px;text-decoration:none;font-weight:bold;font-size:15px;">
                  Ir para o dashboard →
                </a>
              </td></tr>
            </table>
            <hr style="border:none;border-top:1px solid #dde0da;margin:0 0 20px;">
            <p style="margin:0;font-size:12px;color:#aaa;text-align:center;">
              Contratai · Você recebeu este e-mail porque criou uma conta.
            </p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
