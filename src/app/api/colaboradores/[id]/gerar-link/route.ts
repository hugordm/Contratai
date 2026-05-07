import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";
import { resend } from "@/lib/resend";

interface SessionUser {
  email?: string | null;
  companyId?: string | null;
}

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function POST(_request: NextRequest, context: RouteContext) {
  const session = await getServerSession(authOptions);
  const user = session?.user as SessionUser | undefined;

  if (!user?.email || !user?.companyId) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const companyId = user.companyId;
  const { id: nodeId } = await context.params;

  const node = await prisma.organogramaNode.findFirst({
    where: { id: nodeId, companyId },
  });

  if (!node) {
    return NextResponse.json({ error: "Colaborador não encontrado" }, { status: 404 });
  }

  const company = await prisma.company.findUnique({
    where: { id: companyId },
    select: { razaoSocial: true },
  });

  // If there's already a token that hasn't been completed, reuse it
  let token: string;
  const baseUrl = process.env.NEXTAUTH_URL ?? "http://localhost:3000";

  if (node.testLinkToken) {
    const existingLink = await prisma.testLink.findUnique({
      where: { token: node.testLinkToken },
    });
    if (existingLink && !existingLink.completedAt) {
      token = existingLink.token;
    } else {
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 60);
      const newLink = await prisma.testLink.create({
        data: { companyId, expiresAt, type: "employee" },
      });
      await prisma.organogramaNode.update({
        where: { id: nodeId },
        data: { testLinkToken: newLink.token },
      });
      token = newLink.token;
    }
  } else {
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 60);
    const newLink = await prisma.testLink.create({
      data: { companyId, expiresAt, type: "employee" },
    });
    await prisma.organogramaNode.update({
      where: { id: nodeId },
      data: { testLinkToken: newLink.token },
    });
    token = newLink.token;
  }

  const url = `${baseUrl}/test/${token}`;

  if (node.email) {
    try {
      const result = await resend.emails.send({
        from: "Contratai <noreply@pirulitodocorte.xyz>",
        to: node.email,
        subject: `Avaliação comportamental — ${company?.razaoSocial ?? "sua empresa"}`,
        html: buildEmail(node.nome, company?.razaoSocial ?? "", url),
      });
      console.log("E-mail enviado para colaborador:", node.email, result);
    } catch (err) {
      console.error("Erro ao enviar e-mail para colaborador:", node.email, err);
    }
  }

  return NextResponse.json({ token, url });
}

function buildEmail(nome: string, empresa: string, url: string) {
  return `<!DOCTYPE html>
<html lang="pt-BR"><head><meta charset="UTF-8"></head>
<body style="font-family:Arial,sans-serif;background:#f0f0f0;padding:32px 16px;">
  <table width="100%" cellpadding="0" cellspacing="0"><tr><td align="center">
    <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">
      <tr><td style="background:#4A5452;padding:24px 32px;border-radius:12px 12px 0 0;text-align:center;">
        <h1 style="margin:0;color:#C4FF57;font-size:20px;">Contratai</h1>
      </td></tr>
      <tr><td style="background:#F5F7F0;padding:32px;border:1px solid #dde0da;border-top:none;border-radius:0 0 12px 12px;">
        <p style="margin:0 0 12px;font-size:16px;color:#333;">Olá, <strong>${nome}</strong>!</p>
        <p style="margin:0 0 20px;font-size:14px;color:#555;">
          <strong>${empresa}</strong> solicitou que você realize uma avaliação comportamental.
          Clique no botão abaixo para começar — leva aproximadamente 15 minutos.
        </p>
        <table width="100%" cellpadding="0" cellspacing="0">
          <tr><td align="center" style="padding:8px 0 24px;">
            <a href="${url}" style="display:inline-block;background:#C4FF57;color:#4A5452;padding:14px 32px;border-radius:10px;text-decoration:none;font-weight:bold;font-size:15px;">
              Iniciar avaliação →
            </a>
          </td></tr>
        </table>
        <p style="margin:0;font-size:11px;color:#aaa;text-align:center;">Contratai — notificação automática</p>
      </td></tr>
    </table>
  </td></tr></table>
</body></html>`;
}
