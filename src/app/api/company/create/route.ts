import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.email) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const body = await req.json();

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
  } = body;

  try {
    const company = await prisma.company.create({
      data: {
        razaoSocial,
        cnpj: cnpj.replace(/\D/g, ""),
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

    // Save organograma nodes and generate test links
    if (colaboradores.length > 0) {
      const baseUrl = process.env.NEXTAUTH_URL ?? "http://localhost:3000";
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 60); // 60 days for team links

      for (const c of colaboradores as Array<{
        id: string;
        nome: string;
        cargo: string;
        departamento?: string;
        email?: string;
        token: string;
        resultados?: string;
      }>) {
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
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Erro ao salvar" }, { status: 500 });
  }
}
