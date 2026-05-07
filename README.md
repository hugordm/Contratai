# Contratai

**SaaS B2B de RH com Psicometria e IA**

Plataforma que combina testes psicométricos aplicados in-house com inteligência artificial para análise, match e ranqueamento de candidatos — sem custo por aplicação de teste.

> Desenvolvido por **Hugo Melo** — Hackathon MakerStack 2026  
> 🌐 **Demo:** https://contratai-five.vercel.app  
> 📁 **Repositório:** https://github.com/hugordm/Contratai

---

## Índice

1. [Visão geral](#visão-geral)
2. [Stack tecnológica](#stack)
3. [Arquitetura](#arquitetura)
4. [Estrutura de arquivos](#estrutura-de-arquivos)
5. [Banco de dados](#banco-de-dados)
6. [Módulos implementados](#módulos-implementados)
7. [Fluxos principais](#fluxos-principais)
8. [Como rodar localmente](#como-rodar-localmente)
9. [Variáveis de ambiente](#variáveis-de-ambiente)
10. [Deploy na Vercel](#deploy-na-vercel)
11. [Decisões técnicas](#decisões-técnicas)
12. [Próximos passos](#próximos-passos)

---

## Visão Geral

O Contratai resolve um problema real de empresas em crescimento: contratar bem e rápido sem depender de ferramentas caras por teste aplicado.

**Diferenciais:**
- Motor próprio de testes psicométricos (DISC + Eneagrama + 16 Personalidades) — zero custo recorrente por aplicação
- IA que analisa candidatos com contexto real da empresa, da vaga e do líder direto
- Match multidimensional: candidato × vaga × cultura × líder
- Portal white-label para candidatos sem criar conta
- Chat assistente contextual com Markdown renderizado e histórico por vaga
- PDF automático com resultados enviado por e-mail ao candidato

**Usuários:**
- **RH / Gestor** — cadastra empresa, colaboradores e vagas, gerencia candidatos, visualiza relatórios de match
- **Colaborador** — faz os testes para compor o perfil de líder
- **Candidato** — acessa via link único, realiza os 3 testes, recebe PDF com resultados

---

## Stack

| Camada | Tecnologia | Motivo da escolha |
|--------|------------|-------------------|
| Framework | Next.js 16 (App Router) | Full-stack em um lugar, SSR + API Routes |
| Linguagem | TypeScript | Reduz bugs em produção, tipagem forte |
| Estilo | Tailwind CSS + shadcn/ui | Velocidade de desenvolvimento + componentes acessíveis |
| Banco de dados | PostgreSQL (Supabase) | Managed, gratuito para MVP, suporta JSON nativo |
| ORM | Prisma 5 | Type-safe, migrations automáticas, DX excelente |
| Autenticação | NextAuth v4 | Google OAuth pronto, JWT strategy, PrismaAdapter |
| IA | Anthropic Claude API (claude-haiku-4-5) | Rápido, eficiente e econômico para análise de texto |
| E-mail | Resend | API simples, alta entregabilidade, domínio verificado |
| PDF | @react-pdf/renderer | Geração de PDF no servidor com React |
| Markdown | react-markdown + remark-gfm | Renderização de Markdown no chat assistente |
| Testes psicométricos | Open Source (GitHub/IPIP) | Zero custo por teste, licença livre para uso comercial |

---

## Arquitetura

```
Browser (usuário)
      ↓
Next.js App Router (frontend + backend juntos)
      ├── Server Components → lógica de negócio + banco
      ├── Client Components → interatividade + estado local
      └── API Routes → endpoints REST
            ↓
      Prisma ORM + Transaction Pooler
            ↓
      PostgreSQL (Supabase)

Serviços externos:
  ├── Anthropic API (Haiku 4.5) → JD, match, chat, desafios
  ├── Resend → e-mails transacionais + PDF anexado
  └── ViaCEP → auto-preenchimento de endereço
```

**Multi-tenancy:** toda tabela tem `companyId`. Cada empresa é isolada por design — impossível vazar dados entre tenants.

**Autenticação JWT:** token contém `id`, `email` e `companyId` criptografados. Nenhuma consulta ao banco a cada request.

**Connection Pooler:** em produção usa o Transaction Pooler do Supabase (porta 6543) para suportar múltiplas instâncias serverless da Vercel sem estourar o limite de conexões.

---

## Estrutura de Arquivos

```
src/
├── app/
│   ├── api/
│   │   ├── auth/[...nextauth]/route.ts          # Google OAuth + JWT
│   │   ├── colaboradores/
│   │   │   ├── route.ts                         # GET lista / POST cria colaborador
│   │   │   └── [id]/
│   │   │       ├── route.ts                     # DELETE exclui colaborador
│   │   │       └── gerar-link/route.ts          # POST gera TestLink para colaborador
│   │   ├── candidatos/[id]/enviar-link/         # Enviar e-mail com link do teste
│   │   ├── candidatura/[vagaId]/route.ts        # POST público — Fluxo A
│   │   ├── company/create/route.ts              # Criar empresa no onboarding
│   │   ├── disc/submit/route.ts                 # Calcular e salvar DISC
│   │   ├── enneagram/submit/route.ts            # Calcular e salvar Eneagrama
│   │   ├── mbti/submit/route.ts                 # Calcular e salvar 16P + enviar PDF
│   │   ├── organograma/route.ts                 # Gerenciar organograma
│   │   ├── test-links/route.ts                  # Gerar link único
│   │   └── vagas/
│   │       ├── route.ts                         # GET lista / POST cria vaga
│   │       └── [id]/
│   │           ├── route.ts                     # PATCH edita / DELETE exclui
│   │           ├── candidatos/route.ts          # POST adiciona candidato
│   │           ├── candidatos/[id]/route.ts     # DELETE exclui candidato
│   │           ├── chat/route.ts                # POST chat com streaming
│   │           ├── desafio/route.ts             # POST desafio técnico por IA
│   │           ├── gerar-jd/route.ts            # POST gera JD por IA
│   │           └── match/route.ts               # POST match ranqueado por IA
│   │
│   ├── auth/login/                              # Tela de login com Google
│   ├── candidatura/[vagaId]/                    # Página pública de candidatura
│   ├── colaboradores/                           # Gestão de colaboradores
│   ├── dashboard/                               # Dashboard com vagas e métricas
│   ├── onboarding/                              # Wizard 4 etapas
│   │   └── components/
│   │       ├── StepOne.tsx                      # Dados + ViaCEP
│   │       ├── StepOrgChart.tsx                 # Organograma
│   │       ├── StepCollaboratorTests.tsx        # Links para colaboradores
│   │       └── StepThree.tsx                    # Contexto e cultura
│   ├── privacidade/                             # Política LGPD
│   ├── test/[token]/                            # Portal público do candidato
│   │   ├── DiscTestClient.tsx                   # DISC (28 perguntas)
│   │   ├── EnneagramClient.tsx                  # Eneagrama (36 perguntas)
│   │   ├── MBTIClient.tsx                       # 16P (60 perguntas)
│   │   ├── page.tsx                             # Orquestra os 3 testes
│   │   └── result/page.tsx                      # Resultado + PDF por e-mail
│   └── vagas/
│       ├── nova/page.tsx                        # Criar vaga + selecionar líder
│       └── [id]/
│           ├── page.tsx                         # Detalhes + candidatos
│           ├── VagaClient.tsx                   # Interações client-side
│           ├── editar/page.tsx                  # Editar vaga + trocar líder
│           └── match/
│               ├── page.tsx                     # Relatório de match
│               └── MatchClient.tsx              # UI com cards expansíveis
│
├── components/ui/
│   ├── ChatSidebar.tsx                          # Chat com streaming + Markdown
│   ├── NavBar.tsx                               # Navegação global
│   ├── Provider.tsx                             # SessionProvider
│   └── SignOutButton.tsx                        # Botão logout
│
└── lib/
    ├── anthropic.ts                             # Client Anthropic (Haiku 4.5)
    ├── disc/questions.ts                        # 28 perguntas DISC
    ├── enneagram/questions.ts                   # 36 perguntas Eneagrama
    ├── enneagram/scoring.ts                     # Scoring tipos 1-9
    ├── mbti/questions.ts                        # 60 perguntas IPIP
    ├── mbti/scoring.ts                          # Scoring E/I, S/N, T/F, J/P
    ├── pdf/resultadoPDF.tsx                     # PDF com os 3 resultados
    ├── prisma.ts                                # Conexão com banco
    └── resend.ts                               # Client e-mail
```

---

## Banco de Dados

```
Company          User             Job
─────────        ────────         ──────────────────
id               id               id
razaoSocial      companyId        companyId
cnpj             email            titulo, motivo
enderecoJson     nome             responsabilidades
logoUrl          role             metas, jdGerada
contextoEmpresa  createdAt        salaryMin/Max
perfilRitmo                       perfilIdealJson
valores[]                         liderId → OrganogramaNode
contextoJson                      status

Candidate        TestLink         PersonalityResult
─────────────    ────────         ─────────────────
id               id               id
jobId            companyId        companyId
companyId        token (único)    subjectId
nome             candidateId      subjectType (candidate/employee)
email            expiresAt        discJson
linkedinUrl      completedAt      enneagramJson
                 type             mbtiJson
                 (candidate/      createdAt
                  employee)

MatchReport      ChatMessage      OrganogramaNode
────────────     ────────────     ───────────────
id               id               id
jobId            companyId        companyId
candidateId      jobId            nome, cargo
rankingPosition  role             departamento
matchScore       content          email
relatorioJson    createdAt        parentId
```

---

## Módulos Implementados

### 1 — Autenticação e Multi-tenancy
Login com Google OAuth via NextAuth v4. Strategy JWT com `companyId` no token. Toda query filtra por `companyId` — isolamento total entre empresas.

### 2 — Onboarding (4 etapas)
- **Etapa 1:** dados cadastrais com ViaCEP automático
- **Etapa 2:** organograma — cadastro de colaboradores
- **Etapa 3:** envio de links de teste para colaboradores
- **Etapa 4:** contexto e cultura que alimenta a IA

### 3 — Gestão de Colaboradores
Página dedicada para adicionar, listar e excluir colaboradores após o onboarding. Geração de links de teste individuais. Colaboradores com teste concluído ficam disponíveis como líderes nas vagas.

### 4 — Motor DISC
28 blocos de 4 palavras. Candidato escolhe mais e menos. Calcula D/I/S/C em percentual. Base open source — zero custo por aplicação.

### 5 — Motor Eneagrama
36 afirmações com escala 1-5. Identifica tipo 1-9 e asa. Base MIT reescrita em TypeScript.

### 6 — Motor 16 Personalidades (MBTI via IPIP)
60 afirmações com escala 1-5. Mede E/I, S/N, T/F, J/P. Gera tipo de 4 letras. Base IPIP domínio público.

### 7 — Portal White-Label do Candidato
Link único sem criar conta. Logo da empresa. LGPD + SATEPSI. Três testes em sequência com bolinhas de progresso coloridas. PDF enviado por e-mail automaticamente.

### 8 — Gestão de Vagas
Dashboard com vagas reais. Fluxo A (candidatura pública) e Fluxo B (manual). Seleção de líder direto na criação e edição. Excluir com cascade.

### 9 — IA: Geração de JD
JD completa, estimativa salarial com breakdown de encargos brasileiros (INSS, FGTS, férias, 13º, VT, plano de saúde), perfil psicométrico ideal e perguntas de triagem.

### 10 — IA: Match Ranqueado com Líder
Score 0-100 por candidato com DISC + Eneagrama + MBTI em paralelo. Inclui perfil do líder direto no contexto. Gera: pontos fortes, pontos de atenção, fit cultural, compatibilidade com líder, como delegar, como dar feedback, perguntas para entrevista.

### 11 — IA: Desafio Técnico
Desafio prático personalizado com tarefas, entregáveis, critérios e dica para o avaliador baseada no perfil do candidato.

### 12 — Chat Assistente de RH
Sidebar colapsável com streaming real. Markdown renderizado. Contexto completo injetado (empresa + vaga + candidatos + líder). Histórico por vaga.

### 13 — E-mails + PDF Automático
Link para candidato. PDF com DISC + Eneagrama + MBTI ao concluir. Notificação para RH. Domínio verificado no Resend.

---

## Fluxos Principais

### Fluxo A — Candidatura pública
```
RH cria vaga + seleciona líder
→ Copia link público (/candidatura/[vagaId])
→ Candidato acessa, preenche nome + email
→ Sistema cria Candidate + TestLink automaticamente
→ Candidato faz DISC → Eneagrama → 16P
→ Candidato recebe PDF por e-mail
→ RH é notificado → executa match com IA
```

### Fluxo B — Candidatos manuais
```
RH cria vaga + seleciona líder
→ Adiciona candidatos manualmente
→ Envia link por e-mail
→ Candidato faz DISC → Eneagrama → 16P
→ RH executa match → usa chat para tirar dúvidas
```

### Fluxo do colaborador (líder)
```
RH cadastra colaborador em /colaboradores
→ Gera link de teste
→ Colaborador faz DISC → Eneagrama → 16P
→ Perfil fica disponível para seleção como líder nas vagas
→ IA usa perfil do líder no match com candidatos
```

---

## Como Rodar Localmente

```bash
# 1. Clonar
git clone https://github.com/hugordm/Contratai.git
cd Contratai

# 2. Instalar dependências
npm install

# 3. Configurar variáveis de ambiente
cp .env.example .env
# Preencher as variáveis

# 4. Gerar Prisma Client
npx prisma generate

# 5. Rodar migrations
npx prisma migrate dev

# 6. Iniciar
npm run dev
```

Acesse `http://localhost:3000`

---

## Variáveis de Ambiente

```env
# Banco de dados (Supabase — usar Direct Connection localmente)
DATABASE_URL="postgresql://postgres:[PASSWORD]@db.xxx.supabase.co:5432/postgres"
DIRECT_URL="postgresql://postgres:[PASSWORD]@db.xxx.supabase.co:5432/postgres"

# NextAuth
NEXTAUTH_SECRET="sua-chave-secreta"
NEXTAUTH_URL="http://localhost:3000"

# Google OAuth (console.cloud.google.com)
GOOGLE_CLIENT_ID="..."
GOOGLE_CLIENT_SECRET="..."

# Anthropic (console.anthropic.com)
ANTHROPIC_API_KEY="sk-ant-..."

# Resend (resend.com)
RESEND_API_KEY="re_..."
```

> **Produção:** usar Transaction Pooler do Supabase na `DATABASE_URL` (porta 6543) com `?pgbouncer=true&connection_limit=1`

---

## Deploy na Vercel

```bash
npm install -g vercel
vercel login
vercel --prod
```

**Configurações obrigatórias:**
1. Adicionar todas as variáveis de ambiente no painel da Vercel
2. `NEXTAUTH_URL` → URL de produção
3. `DATABASE_URL` → Transaction Pooler (porta 6543)
4. Google Cloud Console → adicionar URL de produção nas origens e callbacks

---

## Decisões Técnicas

**Next.js App Router** — full-stack em um projeto. Server Components acessam o banco diretamente.

**JWT strategy** — token com `companyId` no cookie. Sem consulta ao banco a cada request.

**Open source para testes** — DISC (GitHub), Eneagrama (MIT), 16P via IPIP (domínio público). Zero custo recorrente.

**Claude Haiku 4.5** — modelo mais rápido e econômico da Anthropic. Ideal para múltiplas análises em paralelo.

**Promise.all no match** — candidatos processados em paralelo. Com 5 candidatos, o tempo é o mesmo que para 1.

**Transaction Pooler** — resolve o limite de 15 conexões do Supabase gratuito em ambiente serverless.

**Streaming no chat** — ReadableStream + reader.read(). Resposta em tempo real sem timeout.

**react-markdown** — renderiza Markdown das respostas da IA no chat para melhor legibilidade.

---

## Aviso Legal

Os testes disponibilizados nesta plataforma são ferramentas de autoconhecimento e suporte a processos de RH, não constituindo avaliações psicológicas clínicas oficiais. Não substituem avaliações realizadas por psicólogos habilitados conforme normas do CFP/SATEPSI.

---

## Próximos Passos

- [ ] Upload de currículo PDF do candidato na vaga
- [ ] Organograma drag-and-drop com hierarquia visual
- [ ] Lembrete por e-mail 24h antes do link expirar
- [ ] Endpoint de exclusão de dados pessoais (direito ao esquecimento LGPD)
- [ ] 2FA para admins
- [ ] Dashboard analytics: tempo médio de contratação, taxa de conversão
- [ ] App mobile para candidatos
- [ ] Integração com LinkedIn API para enriquecimento automático de perfil
- [ ] Relatório de onboarding do novo colaborador contratado
- [ ] Plano de desenvolvimento: livros + cursos + escala salarial por candidato selecionado
