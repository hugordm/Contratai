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
- Motor próprio de 3 testes psicométricos (DISC + Eneagrama + 16 Personalidades) — zero custo recorrente por aplicação
- IA que analisa candidatos com contexto real da empresa, da vaga, do líder direto e da entrevista
- Match multidimensional: candidato × vaga × cultura × líder
- Portal white-label com perguntas de triagem antes dos testes
- Chat assistente com Markdown renderizado e histórico por vaga
- PDF automático com resultados enviado por e-mail ao candidato

**Usuários:**
- **RH / Gestor** — cadastra empresa, colaboradores e vagas, gerencia candidatos, visualiza relatórios
- **Colaborador** — faz os testes para compor o perfil de líder
- **Candidato** — acessa via link único, responde triagem, realiza os 3 testes, recebe PDF

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
  ├── Anthropic API (Haiku 4.5) → JD, match, chat, desafios, triagem
  ├── Resend → e-mails transacionais + PDF anexado
  └── ViaCEP → auto-preenchimento de endereço
```

**Multi-tenancy:** toda tabela tem `companyId`. Cada empresa é isolada por design.

**Autenticação JWT:** token contém `id`, `email` e `companyId` criptografados. Nenhuma consulta ao banco a cada request.

**Connection Pooler:** em produção usa Transaction Pooler do Supabase (porta 6543) para suportar múltiplas instâncias serverless sem estourar o limite de conexões.

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
│   │   ├── mbti/submit/route.ts                 # Calcular, salvar 16P + enviar PDF
│   │   ├── organograma/route.ts                 # Gerenciar organograma
│   │   ├── test-links/route.ts                  # Gerar link único
│   │   └── vagas/
│   │       ├── route.ts                         # GET lista / POST cria vaga
│   │       └── [id]/
│   │           ├── route.ts                     # PATCH edita / DELETE exclui
│   │           ├── candidatos/route.ts          # POST adiciona + cria TestLink
│   │           ├── candidatos/[candidateId]/route.ts  # DELETE + PATCH candidato
│   │           ├── chat/route.ts                # POST chat com streaming
│   │           ├── desafio/route.ts             # POST desafio técnico por IA
│   │           ├── gerar-jd/route.ts            # POST gera JD por IA
│   │           ├── gerar-perguntas/route.ts     # POST gera perguntas de triagem
│   │           └── match/route.ts               # POST match ranqueado por IA
│   │
│   ├── auth/login/                              # Tela de login com Google
│   ├── candidatura/[vagaId]/                    # Página pública — triagem + candidatura
│   ├── colaboradores/                           # Gestão de colaboradores
│   ├── dashboard/                               # Dashboard com vagas e métricas
│   ├── onboarding/                              # Wizard 4 etapas
│   │   └── components/
│   │       ├── StepOne.tsx                      # Dados + ViaCEP
│   │       ├── StepOrgChart.tsx                 # Organograma
│   │       ├── StepCollaboratorTests.tsx        # Links para colaboradores
│   │       ├── StepTwo.tsx                      # Endereço
│   │       └── StepThree.tsx                    # Contexto e cultura
│   ├── privacidade/                             # Política LGPD
│   ├── test/[token]/                            # Portal público do candidato
│   │   ├── DiscTestClient.tsx                   # DISC (28 perguntas)
│   │   ├── EnneagramClient.tsx                  # Eneagrama (36 perguntas)
│   │   ├── MBTIClient.tsx                       # 16P (60 perguntas)
│   │   ├── TriagemClient.tsx                    # Perguntas de triagem antes dos testes
│   │   ├── page.tsx                             # Triagem + orquestra os 3 testes
│   │   └── result/page.tsx                      # Resultado + PDF por e-mail
│   └── vagas/
│       ├── nova/page.tsx                        # Criar vaga + selecionar líder
│       └── [id]/
│           ├── page.tsx                         # Detalhes + candidatos
│           ├── VagaClient.tsx                   # Candidatos + currículo + transcrição
│           ├── editar/page.tsx                  # Editar vaga + trocar líder
│           └── match/
│               ├── page.tsx                     # Relatório de match
│               └── MatchClient.tsx              # Cards com análise completa
│
├── components/ui/
│   ├── button.tsx                               # Componente shadcn/ui
│   ├── ChatSidebar.tsx                          # Chat com streaming + Markdown
│   ├── NavBar.tsx                               # Navegação global responsiva
│   ├── Provider.tsx                             # SessionProvider do NextAuth
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
    ├── resend.ts                                # Client e-mail
    └── utils.ts                                 # Utilitários (cn)
```

---

## Banco de Dados

```
Company               User                Job
──────────────        ────────────        ──────────────────
id                    id                  id
razaoSocial           companyId           companyId
cnpj                  email               titulo, motivo
enderecoJson          nome                responsabilidades
logoUrl               role                metas, jdGerada
contextoEmpresa       createdAt           salaryMin/Max
perfilRitmo                               perfilIdealJson
valores[]                                 (perguntas de triagem)
contextoJson                              liderId
                                          status

Candidate             TestLink            PersonalityResult
──────────────        ────────────        ─────────────────
id                    id                  id
jobId                 companyId           companyId
companyId             token (único)       subjectId (String)
nome                  candidateId         subjectType
email                 expiresAt           (candidate/employee)
linkedinUrl           completedAt         discJson
cvUrl                 type                enneagramJson
respostasJson         (candidate/         mbtiJson
entrevistaTexto        employee)          createdAt
testLinkToken

MatchReport           ChatMessage         OrganogramaNode
────────────          ────────────        ───────────────
id                    id                  id
jobId                 companyId           companyId
candidateId           jobId               nome, cargo
rankingPosition       role                departamento
matchScore            content             email
relatorioJson         createdAt           testLinkToken
                                          parentId
```

---

## Módulos Implementados

### 1 — Autenticação e Multi-tenancy
Login com Google OAuth via NextAuth v4. Strategy JWT com `companyId` no token. Toda query filtra por `companyId` — isolamento total entre empresas.

### 2 — Onboarding (4 etapas)
- **Etapa 1:** dados cadastrais com ViaCEP automático
- **Etapa 2:** organograma — cadastro de colaboradores
- **Etapa 3:** geração de links de teste para colaboradores
- **Etapa 4:** contexto e cultura que alimenta a IA

### 3 — Gestão de Colaboradores
Página dedicada para adicionar, listar e excluir colaboradores. Geração de links individuais. Colaboradores com teste concluído ficam disponíveis como líderes nas vagas.

### 4 — Motor DISC
28 blocos de 4 palavras. Candidato escolhe mais e menos. Calcula D/I/S/C em percentual. Base open source — zero custo.

### 5 — Motor Eneagrama
36 afirmações com escala 1-5. Identifica tipo 1-9 e asa. Base MIT reescrita em TypeScript.

### 6 — Motor 16 Personalidades (MBTI via IPIP)
60 afirmações com escala 1-5. Mede E/I, S/N, T/F, J/P. Gera tipo de 4 letras. Base IPIP domínio público.

### 7 — Portal White-Label do Candidato
Link único sem criar conta. Logo da empresa. LGPD + SATEPSI. Perguntas de triagem antes dos testes. Três testes em sequência. PDF enviado por e-mail ao concluir.

### 8 — Candidatura Pública (Fluxo A)
Página pública com nome, email, LinkedIn e currículo PDF opcionais. Responde perguntas de triagem geradas pela IA. Sistema cria Candidate + TestLink automaticamente.

### 9 — Gestão de Vagas
Dashboard com vagas reais. Fluxo A e B. Seleção de líder direto. Upload de currículo PDF. Transcrição de entrevista. Editar candidato. Excluir com cascade.

### 10 — IA: Geração de JD
JD completa, salário com breakdown (INSS, FGTS, férias, 13º, VT, plano de saúde), perfil psicométrico ideal e 5-8 perguntas de triagem.

### 11 — IA: Match Ranqueado com Líder
Score 0-100 com DISC + Eneagrama + MBTI + currículo + transcrição + perfil do líder em paralelo. Pontos fortes, pontos de atenção, fit cultural, compatibilidade com líder, como delegar, como dar feedback, perguntas para entrevista.

### 12 — IA: Desafio Técnico
Desafio prático personalizado com tarefas, entregáveis, critérios e dica para o avaliador.

### 13 — Chat Assistente de RH
Sidebar com streaming real. Markdown renderizado. Contexto completo. Histórico por vaga.

### 14 — E-mails Automáticos + PDF
- E-mail de boas-vindas após cadastro
- E-mail com link do teste para candidato
- E-mail com PDF dos 3 resultados ao concluir
- Notificação para RH quando candidato conclui

---

## Fluxos Principais

### Fluxo A — Candidatura pública
```
RH cria vaga com IA + seleciona líder
→ Copia link público (/candidatura/[vagaId])
→ Candidato preenche nome, email, LinkedIn, currículo
→ Responde perguntas de triagem geradas pela IA
→ Faz DISC → Eneagrama → 16P
→ Recebe PDF por e-mail
→ RH executa match com IA
```

### Fluxo B — Candidatos manuais
```
RH cria vaga + seleciona líder
→ Adiciona candidatos com currículo e transcrição
→ Sistema cria TestLink automaticamente
→ RH envia link por e-mail
→ Candidato responde triagem + faz DISC → Eneagrama → 16P
→ RH executa match → usa chat para tirar dúvidas
```

### Fluxo do colaborador (líder)
```
RH cadastra colaborador em /colaboradores
→ Gera link de teste individual
→ Colaborador faz DISC → Eneagrama → 16P
→ Perfil disponível como líder nas vagas
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
# Banco de dados (Supabase)
# Local: Direct Connection (porta 5432)
# Produção: Transaction Pooler (porta 6543) com ?pgbouncer=true&connection_limit=1
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

---

## Deploy na Vercel

```bash
npm install -g vercel
vercel login
vercel --prod
```

**Configurações obrigatórias:**
1. Todas as variáveis de ambiente no painel da Vercel
2. `NEXTAUTH_URL` → URL de produção sem barra no final
3. `DATABASE_URL` → Transaction Pooler porta 6543 com `?pgbouncer=true&connection_limit=1`
4. Google Cloud Console → URL de produção nas origens e callbacks autorizados

---

## Decisões Técnicas

**Next.js App Router** — full-stack em um projeto. Server Components acessam o banco diretamente.

**JWT strategy** — token com `companyId` no cookie. Sem consulta ao banco a cada request.

**subjectId como String** — PersonalityResult usa `subjectId` sem FK, permitindo referenciar tanto `Candidate.id` quanto `OrganogramaNode.id`. O campo `subjectType` distingue o tipo.

**Open source para testes** — DISC (GitHub), Eneagrama (MIT), 16P via IPIP (domínio público). Zero custo recorrente.

**Claude Haiku 4.5** — modelo rápido e econômico. Ideal para análises em paralelo com limite de tokens controlado.

**maxDuration = 60** — configurado na API de match para evitar timeout na Vercel plano Hobby.

**Transaction Pooler** — resolve o limite de 15 conexões do Supabase gratuito em ambiente serverless.

**Streaming no chat** — ReadableStream + reader.read(). Resposta em tempo real.

**PDF nativo no Claude** — currículos em base64 são analisados nativamente pela API sem parser externo.

---

## Aviso Legal

Os testes disponibilizados nesta plataforma são ferramentas de autoconhecimento e suporte a processos de RH, não constituindo avaliações psicológicas clínicas oficiais. Não substituem avaliações realizadas por psicólogos habilitados conforme normas do CFP/SATEPSI.

---

## Próximos Passos

- [ ] Organograma drag-and-drop com hierarquia visual
- [ ] Lembrete por e-mail 24h antes do link expirar
- [ ] Resultados de testes manuais (importar DISC de outros sistemas)
- [ ] Endpoint de exclusão de dados pessoais (direito ao esquecimento LGPD)
- [ ] 2FA para admins
- [ ] Dashboard analytics: tempo médio de contratação, taxa de conversão
- [ ] App mobile para candidatos
- [ ] Integração com LinkedIn API para enriquecimento automático de perfil
- [ ] Relatório de onboarding do novo colaborador contratado
- [ ] Plano de desenvolvimento: livros + cursos + escala salarial por candidato
