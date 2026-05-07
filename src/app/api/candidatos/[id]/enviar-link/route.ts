import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";
import { resend } from "@/lib/resend";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  const user = session?.user as any;

  if (!user?.email || !user?.companyId) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const { id: candidateId } = await params;

  const candidate = await prisma.candidate.findFirst({
    where: { id: candidateId, companyId: user.companyId },
    include: { job: true, company: true },
  });

  if (!candidate) {
    return NextResponse.json({ error: "Candidato não encontrado" }, { status: 404 });
  }

  let testLink = await prisma.testLink.findFirst({
    where: { candidateId, completedAt: null },
    orderBy: { createdAt: "desc" },
  });

  if (!testLink) {
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);
    testLink = await prisma.testLink.create({
      data: {
        companyId: user.companyId,
        candidateId,
        expiresAt,
        type: "candidate",
      },
    });
  }

  const baseUrl = process.env.NEXTAUTH_URL ?? "http://localhost:3000";
  const testUrl = `${baseUrl}/test/${testLink.token}`;
  const expiresDate = testLink.expiresAt.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });

  const { error } = await resend.emails.send({
    from: "Contratai <noreply@pirulitodocorte.xyz>",
    to: candidate.email,
    subject: `${candidate.company.razaoSocial} — Avaliação de perfil comportamental`,
    html: `
<!DOCTYPE html>
<html lang="pt-BR">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f0f0f0;font-family:Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f0f0f0;padding:32px 16px;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">
        <tr>
          <td style="background:#4A5452;padding:28px 32px;border-radius:12px 12px 0 0;text-align:center;">
            <h1 style="margin:0;color:#C4FF57;font-size:22px;font-weight:bold;">Contratai</h1>
            <p style="margin:6px 0 0;color:#a0b0ae;font-size:13px;">${candidate.company.razaoSocial}</p>
          </td>
        </tr>
        <tr>
          <td style="background:#F5F7F0;padding:36px 32px;border:1px solid #dde0da;border-top:none;border-radius:0 0 12px 12px;">
            <p style="margin:0 0 16px;font-size:16px;color:#333;">Olá, <strong>${candidate.nome}</strong>!</p>
            <p style="margin:0 0 16px;font-size:15px;color:#444;line-height:1.6;">
              A empresa <strong>${candidate.company.razaoSocial}</strong> está te convidando para realizar
              uma breve avaliação de perfil comportamental como parte do processo seletivo para a vaga de
              <strong>${candidate.job.titulo}</strong>.
            </p>
            <p style="margin:0 0 28px;font-size:14px;color:#666;line-height:1.5;">
              O teste leva aproximadamente <strong>10 minutos</strong>.
              Não há respostas certas ou erradas — responda com honestidade para obter o resultado mais preciso.
            </p>
            <table width="100%" cellpadding="0" cellspacing="0">
              <tr><td align="center" style="padding:8px 0 28px;">
                <a href="${testUrl}"
                   style="display:inline-block;background:#C4FF57;color:#4A5452;padding:16px 40px;
                          border-radius:10px;text-decoration:none;font-weight:bold;font-size:16px;">
                  Realizar avaliação →
                </a>
              </td></tr>
            </table>
            <p style="margin:0 0 24px;font-size:13px;color:#888;text-align:center;">
              ⏰ Este link expira em <strong>${expiresDate}</strong>
            </p>
            <hr style="border:none;border-top:1px solid #d8dbd5;margin:0 0 20px;">
            <p style="margin:0;font-size:11px;color:#aaa;text-align:center;line-height:1.5;">
              ⚖️ <strong>Aviso LGPD:</strong> Seus dados serão utilizados exclusivamente para este processo
              seletivo e tratados em conformidade com a Lei Geral de Proteção de Dados Pessoais
              (LGPD — Lei nº 13.709/2018).
            </p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`,
  });

  if (error) {
    return NextResponse.json({ error: "Erro ao enviar e-mail" }, { status: 500 });
  }

  return NextResponse.json({ success: true, testUrl });
}
