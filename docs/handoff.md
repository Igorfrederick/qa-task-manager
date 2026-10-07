# Handoff — Task Manager

Documento de retomada para começar o trabalho neste repositório numa sessão nova do Claude Code, sem o contexto das sessões anteriores.

**Como usar:** abra o Claude Code na raiz do repositório e comece com algo assim:

> Leia `CLAUDE.md`, `docs/handoff.md` e `docs/decisions.md`. Vamos seguir o Passo 2 pela fatia 2.3, de seed. Apresente o plano de commits da fatia antes de escrever.

---

## 1. Onde o projeto está

| Passo | Entrega | Situação |
|---|---|---|
| 1 | Fundação — base do backend, convenções, agentes, decisões | Concluído em 01/10/2026 |
| **2** | **Backend completo, contrato estável** | **Em andamento** — 2.1 mergeada em 06/10/2026 (PR #1); 2.2 concluída em 06/10/2026, em PR, aguardando a passada do `code-reviewer`; falta 2.3 |
| 3 | Frontend — três telas | Não iniciado |
| 4 | E2E | Não iniciado |
| 5 | Entrega — README final, `revisor-pdi`, limpeza | Não iniciado |

**Prazo: 09/10/2026** — 12/10 é feriado. Avaliador: Murilo Morato, tech lead.

### O que já funciona

Backend, com testes:

- `POST /auth/login` — emite JWT só com o id, em `sub`; e-mail inexistente e senha errada respondem igual, inclusive no tempo
- `GET /auth/me` — usuário do token; `requireAuth` responde `TOKEN_MISSING`, `TOKEN_INVALID` ou `TOKEN_EXPIRED`, e confirma no banco que o usuário existe, lendo de lá o perfil; `sub` fora do formato de id também é `TOKEN_INVALID`, nunca `500`
- `POST /auth/register` — exclusivo do `lead` (`requireRole`, `403 FORBIDDEN`); hash bcrypt e dupla barreira no `passwordHash` (`select: false` e `transform`)
- `GET /tasks` e `POST /tasks`, `GET`, `PATCH` e `DELETE /tasks/:id` — o escopo por dono entra na própria consulta: o `qa` alcança só as próprias tarefas, o `lead` as do time inteiro; para o `qa`, tarefa de outra pessoa responde `404 TASK_NOT_FOUND` com o mesmo corpo da inexistente
- Dono da tarefa sempre do token: `userId` no payload é descartado na criação e não transfere a tarefa na edição; na resposta, o dono sai como `owner: { _id, name }`
- Filtros `status` e `priority` na listagem, validados como o corpo; id fora do formato responde `400` com `id` em `details`, nunca `500`
- `GET /api/health`
- Catálogo de `code`s em `utils/errors.js`, com um teste que falha se ele divergir de `api_contract.md` §Catálogo de `code`s
- Validação das variáveis de ambiente na importação de `config/env.js`
- Middleware de erro centralizado, no formato do contrato, e middleware de validação Zod para corpo, query e parâmetro de rota (`validateBody`, `validateQuery`, `validateParams`)
- Suíte Vitest + supertest, com `globalSetup` que aborta rápido, apontando a causa, quando o MongoDB não responde

Sem cadastro público, uma base vazia não tem como criar o primeiro usuário pela API: o primeiro `lead` vem do seed, na fatia 2.3. Até lá, os testes criam usuários pelo service — nos testes de API, por `tests/helpers/users.js`, que devolve o usuário e o token.

---

## 2. Plano por fatias

Uma branch por fatia, PR para a `main`, uma passada do `code-reviewer` por PR. A sequência backend → frontend → E2E continua valendo.

### Passo 2 — Backend

| Fatia | Entrega | Inclui |
|---|---|---|
| 2.1 Autenticação | Login, token e perfis funcionando | `POST /auth/login`, middleware de token (`401`), middleware de perfil (`403`), `GET /auth/me`, `POST /auth/register` passa a `[lead]`, catálogo de `code`s |
| 2.2 Tarefas | CRUD com escopo por dono | Model `Task`, validators de corpo, query e parâmetro, service com o filtro por dono na consulta, rotas, testes das regras 1 a 3 |
| 2.3 Seed | Dado fictício para desenvolvimento e E2E | Um `lead` e dois `qa` com as credenciais do `e2e/.env.example`, tarefas dos três |

A fatia 2.1 fechou as duas decisões em aberto do backend: o `code` carrega o status num catálogo único, e a família `401`/`403` tem cinco `code`s — entradas de 01/10 em `docs/decisions.md`.

Para a 2.3: `e2e/.env.example` declara credenciais de um `lead` e de **um** `qa`, mas o plano prevê dois `qa` — o segundo existe para o E2E provar que o primeiro não vê as tarefas dele. Decidir no plano da fatia se ele ganha credencial no `.env.example` ou se o seed o cria sem login. A senha do seed não pode ser literal no código: vem de variável de ambiente, com valor fictício no `.env.example`. Os padrões de `Task` estão no model, e valem também para o seed.

### Passo 3 — Frontend

| Fatia | Entrega |
|---|---|
| 3.1 Base e login | App Vite, rotas, contexto de auth, cliente HTTP, tela de login, rota protegida |
| 3.2 Tarefas | Lista com filtros e ações por linha, formulário de criar e editar |

### Passo 4 — E2E

| Fatia | Entrega |
|---|---|
| 4.1 Base e autenticação | Config do Playwright, fixtures por perfil, service layer, factories, três Page Objects, jornadas de login |
| 4.2 Tarefas | Jornadas de criar, editar, concluir, excluir, filtrar e escopo por dono |

### Passo 5 — Entrega

README final com a tabela critério → lugar no repositório, passada única do `revisor-pdi`, remoção dos `.gitkeep` restantes.

---

## 3. Cronograma

| Quando | Entrega |
|---|---|
| Qui 01/10 | Passo 1 — este repositório |
| Sex 02 – Seg 05/10 | Passo 2 — backend |
| Ter 06 – Qua 07/10 | Passo 3 — frontend |
| Qui 08/10 | Passo 4 — E2E |
| Sex 09/10 | Passo 5 — entrega |
| 10 – 12/10 | Folga |

**Se atrasar, corte nesta ordem:** filtros da lista; coluna de dono na lista do líder (a API mantém o campo); rodadas extras de revisão.

**Não corte:** login integrado, validação de formulário, responsividade, `data-cy`, setup e teardown, testes de backend.

---

## 4. Pendências

| # | Pendência | Por que importa |
|---|---|---|
| 1 | **Alinhamento com o Murilo** sobre o domínio do projeto | A entrada de 01/10 sobre o domínio, em `docs/decisions.md`, espera a data e a resposta |
| 2 | **Decisões em aberto do frontend** — armazenamento do token e abordagem de estilo | `CLAUDE.md` §10; decidir no início do Passo 3 |
| 3 | **Caminho do `docker compose` não verificado** — a máquina de desenvolvimento não tem Docker; o MongoDB 7 roda de um zip, fora do repositório, em `%USERPROFILE%\mongodb`, e sobe com `start-mongod.cmd` | O README manda o avaliador pelo compose: antes da entrega, alguém com Docker roda `docker compose up -d` e a suíte uma vez |
| 4 | **Limite da senha em caracteres, não em bytes** — `validators/auth.js` usa `max(72)`, mas o bcrypt trunca em 72 bytes: senha longa com acentos pode ser cortada em silêncio | Sugestão do `code-reviewer` na 2.1, anterior a ela; ajuste pequeno, cabe numa fatia seguinte |

---

## 5. Primeiros comandos

```bash
git clone https://github.com/Igorfrederick/qa-task-manager.git
cd qa-task-manager

docker compose up -d
cd backend
npm ci
npm test
```

Para subir a API em desenvolvimento: `cp .env.example .env` em `backend/`, gerar um `JWT_SECRET` próprio (`openssl rand -base64 32`) e rodar `npm run dev`.

---

## 6. Protocolo

Modo geração por padrão; plano de commits aprovado por fatia; uma passada do `code-reviewer` por PR, com nova rodada só para CRITICAL ou HIGH; `revisor-pdi` uma vez, no Passo 5; perto de 50% da janela de contexto, parada no próximo ponto seguro para decisão do usuário. Detalhe no `CLAUDE.md` §9.
