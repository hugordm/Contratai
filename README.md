# Contratai

**SaaS B2B de RH com Psicometria e IA**

Plataforma que combina testes psicométricos aplicados in-house com inteligência artificial para análise, match e ranqueamento de candidatos — sem custo por aplicação de teste.

> Desenvolvido por **Hugo Melo** — Hackathon MakerStack 2026

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
- IA que analisa candidatos com contexto real da empresa e da vaga
- Portal white-label para candidatos sem criar conta
- Match multidimensional: candidato × vaga × cultura organizacional
- Chat assistente contextual com histórico por vaga
- PDF automático com resultados enviado por e-mail ao candidato

**Usuários:**
- **RH / Gestor** — cria vagas, gerencia candidatos, visualiza relatórios de match
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
| IA | Anthropic Claude API (claude-sonnet-4-5) | Melhor modelo para análise de texto em português |
| E-mail | Resend | API simples, alta entregabilidade, domínio verificado |
| PDF | @react-pdf/renderer | Geração de PDF no servidor com React |
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
      Prisma ORM
            ↓
      PostgreSQL (Supabase)

Serviços externos:
  ├── Anthropic API → geração de JD, match, chat, desafios
  ├── Resend → e-mails transacionais + PDF anexado
  └── ViaCEP → auto-preenchimento de endereço
```

**Multi-tenancy:** toda tabela tem `companyId`. Cada empresa é isolada por design.

**Autenticação JWT:** token contém `id`, `email` e `companyId` criptografados. Nenhuma consulta ao banco a cada request.

---

## Estrutura de Arquivos

```
src/
├── app/
│   ├── api/
│   │   ├── auth/[...nextauth]/route.ts      # NextAuth — Google OAuth + JWT
│   │   ├── candidatos/[id]/enviar-link/     # Enviar e-mail com link do teste
│   │   ├── candidatura/[vagaId]/route.ts    # Candidato se inscreve via link público
│   │   ├── company/create/route.ts          # Criar empresa no onboarding
│   │   ├── disc/submit/route.ts             # Receber + calcular + salvar DISC
│   │   ├── enneagram/submit/route.ts        # Receber + calcular + salvar Eneagrama
│   │   ├── mbti/submit/route.ts             # Receber + calcular + salvar 16P
│   │   ├── test-links/route.ts              # Gerar link único para candidato
│   │   └── vagas/[id]/
│   │       ├── route.ts                     # DELETE exclui vaga com cascade
│   │       ├── candidatos/route.ts          # POST adiciona candidato
│   │       ├── chat/route.ts                # POST chat com streaming
│   │       ├── desafio/route.ts             # POST gera desafio técnico por IA
│   │       ├── gerar-jd/route.ts            # POST gera JD completa por IA
│   │       └── match/route.ts               # POST match ranqueado por IA
│   │
│   ├── candidatura/[vagaId]/                # Página pública de candidatura
│   ├── dashboard/                           # Dashboard com vagas e métricas
│   ├── onboarding/                          # Wizard de cadastro (4 etapas)
│   │   └── components/
│   │       ├── StepOne.tsx                  # Dados cadastrais + ViaCEP
│   │       ├── StepTwo.tsx                  # Organograma da empresa
│   │       ├── StepThree.tsx                # Testes dos colaboradores
│   │       └── StepFour.tsx                 # Contexto e cultura
│   ├── test/[token]/                        # Portal público do candidato
│   │   ├── DiscTestClient.tsx               # Teste DISC (28 perguntas)
│   │   ├── EnneagramClient.tsx              # Eneagrama (36 perguntas)
│   │   ├── MBTIClient.tsx                   # 16 Personalidades (60 perguntas)
│   │   ├── page.tsx                         # Valida token + orquestra 3 testes
│   │   └── result/page.tsx                  # Resultado DISC + Eneagrama + MBTI
│   └── vagas/[id]/
│       ├── page.tsx                         # Detalhes + candidatos
│       └── match/page.tsx                   # Relatório de match com IA
│
├── components/ui/
│   ├── ChatSidebar.tsx                      # Chat assistente com streaming
│   ├── NavBar.tsx                           # Barra de navegação
│   └── Provider.tsx                         # SessionProvider do NextAuth
│
└── lib/
    ├── anthropic.ts                         # Client da Anthropic API
    ├── disc/questions.ts                    # 28 perguntas DISC (open source)
    ├── enneagram/questions.ts               # 36 perguntas Eneagrama (MIT)
    ├── enneagram/scoring.ts                 # Cálculo de tipos 1-9
    ├── mbti/questions.ts                    # 60 perguntas IPIP (domínio público)
    ├── mbti/scoring.ts                      # Cálculo E/I, S/N, T/F, J/P
    ├── pdf/resultadoPDF.tsx                 # PDF com resultados dos 3 testes
    ├── prisma.ts                            # Conexão única com o banco
    └── resend.ts                            # Client do Resend
```

---

## Banco de Dados

```
Company          User             Job
─────────        ────────         ──────────────
id               id               id
razaoSocial      companyId        companyId
cnpj             email            titulo, motivo
enderecoJson     nome             responsabilidades
logoUrl          role             jdGerada
contextoEmpresa  createdAt        salaryMin/Max
perfilRitmo                       perfilIdealJson
valores[]                         status

Candidate        TestLink         PersonalityResult
─────────────    ────────         ─────────────────
id               id               id
jobId            companyId        companyId
companyId        token (único)    subjectId
nome             candidateId      discJson
email            expiresAt        enneagramJson
linkedinUrl      completedAt      mbtiJson
                 type             createdAt

MatchReport      ChatMessage      OrganogramaNode
────────────     ────────────     ───────────────
id               id               id
jobId            companyId        companyId
candidateId      jobId            nome, cargo
rankingPosition  role             departamento
matchScore       content          email, parentId
relatorioJson    createdAt
```

---

## Módulos Implementados

### 1 — Autenticação e Multi-tenancy
Login com Google OAuth via NextAuth v4. Strategy JWT com `companyId` no token. Toda query filtra por `companyId` — isolamento total entre empresas.

### 2 — Onboarding (4 etapas)
Etapa 1: dados cadastrais com ViaCEP. Etapa 2: organograma da empresa. Etapa 3: testes dos colaboradores (envio de links individuais). Etapa 4: contexto e cultura que alimenta a IA.

### 3 — Motor DISC
28 blocos de 4 palavras. Candidato escolhe mais e menos. Calcula D/I/S/C em percentual. Base open source — zero custo por aplicação.

### 4 — Motor Eneagrama
36 afirmações com escala 1-5. Identifica tipo 1-9 e asa. Base MIT reescrita em TypeScript.

### 5 — Motor 16 Personalidades (MBTI via IPIP)
60 afirmações com escala 1-5. Mede E/I, S/N, T/F, J/P. Gera tipo de 4 letras (ex: INTJ, ENFP). Base IPIP domínio público — uso comercial irrestrito.

### 6 — Portal White-Label do Candidato
Link único sem criar conta. Logo da empresa. LGPD + SATEPSI. Três testes em sequência. PDF com resultados enviado por e-mail automaticamente.

### 7 — Gestão de Vagas
Dashboard com vagas reais. Fluxo A (candidatura pública) e Fluxo B (manual). Status do teste por candidato. Excluir com cascade.

### 8 — IA: Geração de JD
JD completa, estimativa salarial com breakdown de encargos brasileiros, perfil psicométrico ideal e perguntas de triagem.

### 9 — IA: Match Ranqueado
Score 0-100 por candidato com DISC + Eneagrama + MBTI em paralelo. Pontos fortes, pontos de atenção, fit cultural, como delegar, como dar feedback, perguntas para entrevista.

### 10 — IA: Desafio Técnico
Desafio prático personalizado com tarefas, entregáveis, critérios e dica para o avaliador baseada no perfil psicométrico.

### 11 — Chat Assistente de RH
Sidebar com streaming real. Contexto completo injetado. Histórico por vaga.

### 12 — E-mails + PDF
Link para candidato. PDF com resultados dos 3 testes ao concluir. Notificação para RH.

---

## Fluxos Principais

### Fluxo A — Candidatura pública
```
RH cria vaga com IA
→ Copia link público (/candidatura/[vagaId])
→ Candidato acessa, preenche nome + email
→ Sistema cria Candidate + TestLink automaticamente
→ Candidato faz DISC → Eneagrama → 16P
→ Candidato recebe PDF por e-mail
→ RH é notificado → executa match com IA
```

### Fluxo B — Candidatos manuais
```
RH cria vaga
→ Adiciona candidatos manualmente
→ Envia link por e-mail
→ Candidato faz DISC → Eneagrama → 16P
→ Candidato recebe PDF por e-mail
→ RH executa match → usa chat para tirar dúvidas
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
# Banco de dados (Supabase)
DATABASE_URL="postgresql://..."
DIRECT_URL="postgresql://..."

# NextAuth
NEXTAUTH_SECRET="sua-chave-secreta"
NEXTAUTH_URL="http://localhost:3000"

# Google OAuth
GOOGLE_CLIENT_ID="..."
GOOGLE_CLIENT_SECRET="..."

# Anthropic
ANTHROPIC_API_KEY="sk-ant-..."

# Resend
RESEND_API_KEY="re_..."
```

---

## Deploy na Vercel

```bash
npm install -g vercel
vercel login
vercel --prod
```

**Após o deploy:**
1. Adicionar todas as variáveis de ambiente no painel da Vercel
2. `NEXTAUTH_URL` → URL de produção (ex: `https://contratai.vercel.app`)
3. Google Cloud Console → adicionar URL de produção nas origens e callbacks autorizados

---

## Decisões Técnicas

**Next.js App Router** — full-stack em um projeto. Server Components acessam o banco diretamente sem API intermediária.

**JWT strategy** — token com `companyId` no cookie. Sem consulta ao banco a cada request. Mais rápido e escalável.

**Open source para testes** — DISC (GitHub), Eneagrama (MIT) e 16P via IPIP (domínio público). Zero custo recorrente. Propriedade total dos dados.

**Promise.all no match** — candidatos processados em paralelo. Com 5 candidatos, o tempo é o mesmo que para 1.

**Streaming no chat** — ReadableStream + reader.read(). Usuário vê o texto sendo gerado em tempo real.

**@react-pdf/renderer** — PDF gerado no servidor Next.js sem dependências externas.

---

## Aviso Legal

Os testes disponibilizados nesta plataforma são ferramentas de autoconhecimento e suporte a processos de RH, não constituindo avaliações psicológicas clínicas oficiais. Não substituem avaliações realizadas por psicólogos habilitados conforme normas do CFP/SATEPSI.

---

## Próximos Passos

- [ ] Upload de currículo PDF do candidato
- [ ] Organograma drag-and-drop com hierarquia visual
- [ ] Match com perfil do líder direto
- [ ] Lembrete por e-mail 24h antes do link expirar
- [ ] Dashboard analytics: tempo médio de contratação, taxa de conversão
- [ ] Endpoint de exclusão de dados pessoais (direito ao esquecimento LGPD)
- [ ] 2FA para admins
- [ ] App mobile para candidatos
- [ ] Integração com LinkedIn API
- [ ] Relatório de onboarding do novo colaborador contratado
