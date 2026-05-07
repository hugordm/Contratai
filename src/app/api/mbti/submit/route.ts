import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { calculateMBTI } from "@/lib/mbti/scoring";
import { resend } from "@/lib/resend";
import { renderToBuffer } from "@react-pdf/renderer";
import { ResultadoPDF } from "@/lib/pdf/resultadoPDF";
import React from "react";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { token, answers } = body as {
    token: string;
    answers: Record<number, number>;
  };

  if (!token || !answers) {
    return NextResponse.json({ error: "Dados inválidos" }, { status: 400 });
  }

  const testLink = await prisma.testLink.findUnique({
    where: { token },
    include: { candidate: true },
  });

  if (!testLink) {
    return NextResponse.json({ error: "Link inválido" }, { status: 404 });
  }

  if (testLink.completedAt) {
    return NextResponse.json({ error: "Teste já finalizado" }, { status: 409 });
  }

  if (testLink.expiresAt < new Date()) {
    return NextResponse.json({ error: "Link expirado" }, { status: 410 });
  }

  const answeredCount = Object.keys(answers).length;
  if (answeredCount < 60) {
    return NextResponse.json(
      { error: `Responda todas as perguntas (${answeredCount}/60)` },
      { status: 400 }
    );
  }

  let subjectId: string | undefined = testLink.candidateId ?? undefined;
  if (!subjectId && testLink.type === "employee") {
    const node = await prisma.organogramaNode.findFirst({
      where: { testLinkToken: token, companyId: testLink.companyId },
      select: { id: true },
    });
    if (node) subjectId = node.id;
  }

  if (!subjectId) {
    return NextResponse.json({ error: "Colaborador não identificado" }, { status: 400 });
  }

  const existing = await prisma.personalityResult.findFirst({
    where: { companyId: testLink.companyId, subjectId },
    orderBy: { createdAt: "desc" },
  });

  if (!existing || !existing.enneagramJson) {
    return NextResponse.json(
      { error: "Complete o Eneagrama antes das 16 Personalidades" },
      { status: 422 }
    );
  }

  const mbti = calculateMBTI(answers);

  const updated = await prisma.personalityResult.update({
    where: { id: existing.id },
    data: { mbtiJson: mbti as object },
  });

  await prisma.testLink.update({
    where: { id: testLink.id },
    data: { completedAt: new Date() },
  });

  if (testLink.candidateId) {
    try {
      const candidate = await prisma.candidate.findUnique({
        where: { id: testLink.candidateId },
        include: {
          job: true,
          company: { include: { users: { select: { email: true }, take: 1 } } },
        },
      });

      await prisma.candidate.update({
        where: { id: testLink.candidateId },
        data: { testCompletedAt: new Date() },
      });

      if (candidate) {
        const disc = existing.discJson as any;
        const enn = existing.enneagramJson as any;
        const baseUrl = process.env.NEXTAUTH_URL ?? "http://localhost:3000";
        const resultUrl = `${baseUrl}/test/${testLink.token}/result`;

        // Generate PDF
        let pdfBuffer: Buffer | null = null;
        try {
          pdfBuffer = await renderToBuffer(
            React.createElement(ResultadoPDF, {
              candidateName: candidate.nome,
              companyName: candidate.company.razaoSocial,
              disc: { dominant: disc.dominant, percentages: disc.percentages ?? {} },
              enneagram: enn ? { dominant: enn.dominant, wing: enn.wing, scores: enn.scores ?? {} } : null,
              mbti: { type: mbti.type, percentages: mbti.percentages },
              createdAt: new Date(),
            }) as any
          );
        } catch {
          // PDF failure is non-fatal
        }

        const hrEmail = candidate.company?.users?.[0]?.email;

        // Email to HR
        if (hrEmail) {
          await resend.emails.send({
            from: process.env.FROM_EMAIL ?? "onboarding@resend.dev",
            to: hrEmail,
            subject: `✅ Avaliação completa — ${candidate.nome} (DISC + Eneagrama + 16P)`,
            html: buildHrEmail(candidate.nome, candidate.job.titulo, resultUrl),
          }).catch(() => {});
        }

        // Email to candidate with PDF
        if (candidate.email) {
          const emailPayload: Parameters<typeof resend.emails.send>[0] = {
            from: process.env.FROM_EMAIL ?? "onboarding@resend.dev",
            to: candidate.email,
            subject: `Seu resultado de avaliação comportamental — ${candidate.job.titulo}`,
            html: buildCandidateEmail(candidate.nome, candidate.company.razaoSocial, resultUrl),
          };

          if (pdfBuffer) {
            emailPayload.attachments = [
              {
                filename: "resultado-comportamental.pdf",
                content: pdfBuffer,
              },
            ];
          }

          await resend.emails.send(emailPayload).catch(() => {});
        }
      }
    } catch {
      // Silently ignore to not break submission
    }
  }

  return NextResponse.json({ ok: true });
}

function buildHrEmail(nome: string, cargo: string, resultUrl: string) {
  return `<!DOCTYPE html>
<html lang="pt-BR"><head><meta charset="UTF-8"></head>
<body style="font-family:Arial,sans-serif;background:#f0f0f0;padding:32px 16px;">
  <table width="100%" cellpadding="0" cellspacing="0"><tr><td align="center">
    <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">
      <tr><td style="background:#4A5452;padding:24px 32px;border-radius:12px 12px 0 0;text-align:center;">
        <h1 style="margin:0;color:#C4FF57;font-size:20px;">Contratai</h1>
      </td></tr>
      <tr><td style="background:#F5F7F0;padding:32px;border:1px solid #dde0da;border-top:none;border-radius:0 0 12px 12px;">
        <p style="margin:0 0 12px;font-size:16px;color:#333;">
          <strong>${nome}</strong> concluiu a avaliação comportamental completa
          (DISC + Eneagrama + 16 Personalidades) para a vaga de <strong>${cargo}</strong>.
        </p>
        <table width="100%" cellpadding="0" cellspacing="0">
          <tr><td align="center" style="padding:20px 0;">
            <a href="${resultUrl}" style="display:inline-block;background:#C4FF57;color:#4A5452;padding:14px 32px;border-radius:10px;text-decoration:none;font-weight:bold;font-size:15px;">
              Ver resultado completo →
            </a>
          </td></tr>
        </table>
        <p style="margin:0;font-size:12px;color:#aaa;text-align:center;">Contratai — notificação automática</p>
      </td></tr>
    </table>
  </td></tr></table>
</body></html>`;
}

function buildCandidateEmail(nome: string, empresa: string, resultUrl: string) {
  return `<!DOCTYPE html>
<html lang="pt-BR"><head><meta charset="UTF-8"></head>
<body style="font-family:Arial,sans-serif;background:#f0f0f0;padding:32px 16px;">
  <table width="100%" cellpadding="0" cellspacing="0"><tr><td align="center">
    <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">
      <tr><td style="background:#4A5452;padding:24px 32px;border-radius:12px 12px 0 0;text-align:center;">
        <h1 style="margin:0;color:#C4FF57;font-size:20px;">Contratai</h1>
      </td></tr>
      <tr><td style="background:#F5F7F0;padding:32px;border:1px solid #dde0da;border-top:none;border-radius:0 0 12px 12px;">
        <p style="margin:0 0 8px;font-size:16px;color:#333;">Olá, <strong>${nome}</strong>!</p>
        <p style="margin:0 0 16px;font-size:14px;color:#555;">
          Sua avaliação comportamental solicitada por <strong>${empresa}</strong> foi concluída.
          Você pode acessar seu resultado completo pelo link abaixo — e o PDF com todos os seus perfis está anexado a este e-mail.
        </p>
        <table width="100%" cellpadding="0" cellspacing="0">
          <tr><td align="center" style="padding:16px 0;">
            <a href="${resultUrl}" style="display:inline-block;background:#C4FF57;color:#4A5452;padding:14px 32px;border-radius:10px;text-decoration:none;font-weight:bold;font-size:15px;">
              Ver meu resultado →
            </a>
          </td></tr>
        </table>
        <p style="margin:16px 0 0;font-size:11px;color:#aaa;text-align:center;">
          Os resultados são ferramentas de autoconhecimento e suporte a RH, não avaliações clínicas oficiais.
        </p>
      </td></tr>
    </table>
  </td></tr></table>
</body></html>`;
}
