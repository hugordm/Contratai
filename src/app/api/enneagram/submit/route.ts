import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { calculateEnneagram } from "@/lib/enneagram/scoring";
import { resend } from "@/lib/resend";

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
  if (answeredCount < 36) {
    return NextResponse.json(
      { error: `Responda todas as perguntas (${answeredCount}/36)` },
      { status: 400 }
    );
  }

  // Find existing PersonalityResult created by DISC submit
  const existing = await prisma.personalityResult.findFirst({
    where: {
      companyId: testLink.companyId,
      ...(testLink.candidateId ? { subjectId: testLink.candidateId } : {}),
    },
    orderBy: { createdAt: "desc" },
  });

  if (!existing || !existing.discJson) {
    return NextResponse.json(
      { error: "Complete o teste DISC antes do Eneagrama" },
      { status: 422 }
    );
  }

  const enneagram = calculateEnneagram(answers);

  await prisma.personalityResult.update({
    where: { id: existing.id },
    data: { enneagramJson: enneagram as object },
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

      const hrEmail = candidate?.company?.users?.[0]?.email;
      if (hrEmail && candidate) {
        const baseUrl = process.env.NEXTAUTH_URL ?? "http://localhost:3000";
        const resultUrl = `${baseUrl}/test/${testLink.token}/result`;
        await resend.emails.send({
          from: process.env.FROM_EMAIL ?? "onboarding@resend.dev",
          to: hrEmail,
          subject: `✅ Avaliação completa — ${candidate.nome} (DISC + Eneagrama)`,
          html: `
<!DOCTYPE html>
<html lang="pt-BR">
<head><meta charset="UTF-8"></head>
<body style="font-family:Arial,sans-serif;background:#f0f0f0;padding:32px 16px;">
  <table width="100%" cellpadding="0" cellspacing="0">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">
        <tr>
          <td style="background:#4A5452;padding:24px 32px;border-radius:12px 12px 0 0;text-align:center;">
            <h1 style="margin:0;color:#C4FF57;font-size:20px;">Contratai</h1>
          </td>
        </tr>
        <tr>
          <td style="background:#F5F7F0;padding:32px;border:1px solid #dde0da;border-top:none;border-radius:0 0 12px 12px;">
            <p style="margin:0 0 12px;font-size:16px;color:#333;">
              <strong>${candidate.nome}</strong> concluiu a avaliação comportamental completa
              (DISC + Eneagrama) para a vaga de <strong>${candidate.job.titulo}</strong>.
            </p>
            <table width="100%" cellpadding="0" cellspacing="0">
              <tr><td align="center" style="padding:20px 0;">
                <a href="${resultUrl}"
                   style="display:inline-block;background:#C4FF57;color:#4A5452;padding:14px 32px;
                          border-radius:10px;text-decoration:none;font-weight:bold;font-size:15px;">
                  Ver resultado completo →
                </a>
              </td></tr>
            </table>
            <p style="margin:0;font-size:12px;color:#aaa;text-align:center;">
              Contratai — notificação automática
            </p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`,
        });
      }
    } catch {
      // Silently ignore to not break submission
    }
  }

  return NextResponse.json({ ok: true });
}
