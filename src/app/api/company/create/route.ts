import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";
import { resend } from "@/lib/resend";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.email) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  try {
    let body: Record<string, unknown>;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: "Corpo da requisição inválido (JSON malformado)" }, { status: 400 });
    }

    const {
      razaoSocial,
      cnpj,
      logoUrl,
      urlEmpresa,
      cep,
      logradouro,
      numero,
      cidade,
      estado,
      perfilRitmo,
      contextoEmpresa,
      desafiosInternos,
      estiloLideranca,
      valores,
      colaboradores = [],
      testOption = "",
    } = body as {
      razaoSocial?: string;
      cnpj?: string;
      logoUrl?: string;
      urlEmpresa?: string;
      cep?: string;
      logradouro?: string;
      numero?: string;
      cidade?: string;
      estado?: string;
      perfilRitmo?: string;
      contextoEmpresa?: string;
      desafiosInternos?: string;
      estiloLideranca?: string;
      valores?: string[];
      colaboradores?: Array<{
        id: string;
        nome: string;
        cargo: string;
        departamento?: string;
        email?: string;
        token: string;
        resultados?: string;
      }>;
      testOption?: string;
    };

    if (!razaoSocial?.trim()) {
      return NextResponse.json({ error: "Razão social é obrigatória" }, { status: 400 });
    }
    if (!cnpj?.trim()) {
      return NextResponse.json({ error: "CNPJ é obrigatório" }, { status: 400 });
    }

    const cleanedCnpj = cnpj.replace(/\D/g, "");

    const existingCompany = await prisma.company.findUnique({
      where: { cnpj: cleanedCnpj },
    });

    if (existingCompany) {
      const currentUser = await prisma.user.findUnique({
        where: { email: session.user.email },
      });
      if (currentUser?.companyId === existingCompany.id) {
        return NextResponse.json({ redirect: "/dashboard", companyId: existingCompany.id });
      }
      return NextResponse.json(
        { error: "Este CNPJ já está cadastrado por outro usuário." },
        { status: 409 }
      );
    }

    const company = await prisma.company.create({
      data: {
        razaoSocial,
        cnpj: cleanedCnpj,
        logoUrl: logoUrl || null,
        enderecoJson: cep ? { cep, logradouro, numero, cidade, estado } : undefined,
        perfilRitmo,
        contextoEmpresa,
        valores: valores || [],
        contextoJson: {
          desafiosInternos,
          estiloLideranca,
          urlEmpresa,
        },
      },
    });

    const existingUser = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (existingUser) {
      await prisma.user.update({
        where: { email: session.user.email },
        data: { companyId: company.id },
      });
    } else {
      await prisma.user.create({
        data: {
          email: session.user.email,
          nome: session.user.name || "",
          name: session.user.name || "",
          companyId: company.id,
        },
      });
    }

    // Welcome email after onboarding is complete
    try {
      const userName = session.user.name ?? "usuário";
      const baseUrl = process.env.NEXTAUTH_URL ?? "http://localhost:3000";
      await resend.emails.send({
        from: "Contratai <noreply@pirulitodocorte.xyz>",
        to: session.user.email,
        subject: "Bem-vindo ao Contratai! 🎉",
        html: buildWelcomeEmail(userName, razaoSocial!, baseUrl),
      });
    } catch {
      // Non-fatal
    }

    // Save organograma nodes and generate test links
    if ((colaboradores as unknown[]).length > 0) {
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 60);

      for (const c of colaboradores) {
        const testLinkToken = testOption === "nao_tenho" ? c.token : null;

        await prisma.organogramaNode.create({
          data: {
            companyId: company.id,
            nome: c.nome,
            cargo: c.cargo,
            departamento: c.departamento || null,
            email: c.email || null,
            testLinkToken,
            resultados: testOption === "ja_tenho" ? (c.resultados || null) : null,
          },
        });

        if (testOption === "nao_tenho" && c.token) {
          await prisma.testLink.create({
            data: {
              companyId: company.id,
              token: c.token,
              expiresAt,
              type: "employee",
            },
          });
        }
      }
    }

    return NextResponse.json({ success: true, companyId: company.id });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("[company/create] Erro:", message, error);
    return NextResponse.json(
      { error: "Erro ao criar empresa", detail: message },
      { status: 500 }
    );
  }
}

function buildWelcomeEmail(name: string, companyName: string, baseUrl: string) {
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
              Seja bem-vindo ao <strong>Contratai</strong>. A empresa <strong>${companyName}</strong> foi cadastrada com sucesso. Agora você tem acesso a uma plataforma completa para contratar com mais inteligência — combinando testes comportamentais (DISC, Eneagrama e 16 Personalidades) com análise por IA.
            </p>
            <p style="margin:0 0 24px;font-size:15px;color:#444;line-height:1.6;">
              Acesse o seu dashboard e comece a usar a plataforma agora mesmo.
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
              Contratai · Você recebeu este e-mail porque concluiu o cadastro da sua empresa.
            </p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}
