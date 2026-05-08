import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";

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
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("[company/create] Erro:", message, error);
    return NextResponse.json(
      { error: "Erro ao criar empresa", detail: message },
      { status: 500 }
    );
  }
}
