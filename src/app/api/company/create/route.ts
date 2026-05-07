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
  } = body;

  try {
    const company = await prisma.company.create({
      data: {
        razaoSocial,
        cnpj: cnpj.replace(/\D/g, ""),
        logoUrl: logoUrl || null,
        enderecoJson: { cep, logradouro, numero, cidade, estado },
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

    return NextResponse.json({ success: true, companyId: company.id });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Erro ao salvar" }, { status: 500 });
  }
}