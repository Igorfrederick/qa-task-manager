# Handoff — Task Manager

Documento de retomada para começar o trabalho neste repositório numa sessão nova do Claude Code, sem o contexto das sessões anteriores.

**Como usar:** abra o Claude Code na raiz do repositório e comece com algo assim:

> Leia `CLAUDE.md`, `docs/handoff.md` e `docs/decisions.md`. Vamos seguir o Passo 3 pela fatia 3.1, base e login. Feche antes as duas decisões em aberto do frontend (`CLAUDE.md` §10) e apresente o plano de commits da fatia antes de escrever.

---

## 1. Onde o projeto está

| Passo | Entrega | Situação |
|---|---|---|
| 1 | Fundação — base do backend, convenções, agentes, decisões | Concluído em 01/10/2026 |
| 2 | Backend completo, contrato estável | Concluído em 07/10/2026 — 2.1 (PR #1), 2.2 (PR #2) e 2.3 (PR #3) mergeadas |
| **3** | **Frontend — três telas** | **Próximo** |
| 4 | E2E | Não iniciado |
| 5 | Entrega — README final, `revisor-pdi`, limpeza | Não iniciado |

**Prazo: 09/10/2026** — 12/10 é feriado. Avaliador: Murilo Morato, tech lead.

### O que já funciona

Backend, com testes:

- `POST /auth/login` — emite JWT só com o id, em `sub`; e-mail inexistente e senha errada respondem igual, inclusive no tempo
- `GET /auth/me` — usuário do token; `requireAuth` responde `TOKEN_MISSING`, `TOKEN_INVALID` ou `TOKEN_EXPIRED`, e confirma no banco que o usuário existe, lendo de lá o perfil; `sub` fora do formato de id também é `TOKEN_INVALID`, nunca `500`
- `POST /auth/register` — exclusivo do `lead` (`requireRole`, `403 FORBIDDEN`); hash bcrypt e dupla barreira no `passwordHash` (`select: false` e `transform`); senha limitada a 72 bytes, o limite do bcrypt
- `GET /tasks` e `POST /tasks`, `GET`, `PATCH` e `DELETE /tasks/:id` — o escopo por dono entra na própria consulta: o `qa` alcança só as próprias tarefas, o `lead` as do time inteiro; para o `qa`, tarefa de outra pessoa responde `404 TASK_NOT_FOUND` com o mesmo corpo da inexistente
- Dono da tarefa sempre do token: `userId` no payload é descartado na criação e não transfere a tarefa na edição; na resposta, o dono sai como `owner: { _id, name }`
- Filtros `status` e `priority` na listagem, validados como o corpo; campo fora do schema na query é descartado antes da consulta; id fora do formato responde `400` com `id` em `details`, nunca `500`
- Respostas de `User` e `Task` na forma do contrato, sem `__v`: os testes de forma listam as chaves permitidas, não as proibidas
- `GET /api/health`
- Catálogo de `code`s em `utils/errors.js`, com um teste que falha se ele divergir de `api_contract.md` §Catálogo de `code`s
- Validação das variáveis de ambiente na importação de `config/env.js`
- Middleware de erro centralizado, no formato do contrato, e middleware de validação Zod para corpo, query e parâmetro de rota (`validateBody`, `validateQuery`, `validateParams`)
- Suíte Vitest + supertest, com `globalSetup` que aborta rápido, apontando a causa, quando o MongoDB não responde
- `npm run seed` — recria a base com um `lead` e dois `qa` (`lead@`, `qa@` e `qa2@exemplo.test`) e 8 tarefas, pelos mesmos services da API; senhas de `SEED_LEAD_PASSWORD` e `SEED_QA_PASSWORD`, iguais às do `e2e/.env`; recusa `NODE_ENV=production`

Sem cadastro público, o primeiro `lead` vem do seed. Os testes do backend não dependem dele: criam usuários pelo service — nos testes de API, por `tests/helpers/users.js`, que devolve o usuário e o token.

---

## 2. Plano por fatias

Uma branch por fatia, PR para a `main`, uma passada do `code-reviewer` por PR. A sequência backend → frontend → E2E continua valendo.

### Passo 2 — Backend

| Fatia | Entrega | Inclui |
|---|---|---|
| 2.1 Autenticação | Login, token e perfis funcionando | `POST /auth/login`, middleware de token (`401`), middleware de perfil (`403`), `GET /auth/me`, `POST /auth/register` passa a `[lead]`, catálogo de `code`s |
| 2.2 Tarefas | CRUD com escopo por dono | Model `Task`, validators de corpo, query e parâmetro, service com o filtro por dono na consulta, rotas, testes das regras 1 a 3 |
| 2.3 Seed | Dado fictício para desenvolvimento e E2E | Um `lead` e dois `qa`, tarefas dos três; credenciais do `lead` e do primeiro `qa` no `e2e/.env.example` |

A fatia 2.1 fechou as duas decisões em aberto do backend: o `code` carrega o status num catálogo único, e a família `401`/`403` tem cinco `code`s — entradas de 01/10 em `docs/decisions.md`.

A fatia 2.3 decidiu que o seed recria a base a cada execução, que as senhas dele ficam fora das variáveis obrigatórias e que o segundo `qa` não tem credencial no `e2e/.env` — entrada de 07/10 em `docs/decisions.md`.

Para o Passo 3: o contrato declara o que a lista consome — ordem fixa, da mais recente para a mais antiga; filtro "Todos" **omite** o parâmetro, porque filtro vazio responde `400`; o dono sai em `owner: { _id, name }`. Para exercitar o login, use as credenciais do seed, no README.

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

**Real:** o Passo 2 fechou em 07/10, dois dias depois do previsto; os Passos 3 a 5 ficam entre 07 e 09/10.

**Se atrasar, corte nesta ordem:** filtros da lista; coluna de dono na lista do líder (a API mantém o campo); rodadas extras de revisão.

**Não corte:** login integrado, validação de formulário, responsividade, `data-cy`, setup e teardown, testes de backend.

---

## 4. Pendências

| # | Pendência | Por que importa |
|---|---|---|
| 1 | **Decisões em aberto do frontend** — armazenamento do token e abordagem de estilo | `CLAUDE.md` §10; decidir no início do Passo 3 |
| 2 | **Caminho do `docker compose` não verificado** — a máquina de desenvolvimento ainda não tem Docker nem WSL; o MongoDB 7 roda de um zip, fora do repositório, em `%USERPROFILE%\mongodb`, e sobe com `start-mongod.cmd`. Decidido em 07/10: verificar nesta máquina, instalando o Docker | O README manda o avaliador pelo compose: antes da entrega, `docker compose up -d` e a suíte rodam uma vez num clone limpo |

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

Para subir a API em desenvolvimento: `cp .env.example .env` em `backend/`, gerar um `JWT_SECRET` próprio (`openssl rand -base64 32`), rodar `npm run seed` e `npm run dev`.

---

## 6. Protocolo

Modo geração por padrão; plano de commits aprovado por fatia; uma passada do `code-reviewer` por PR, com nova rodada só para CRITICAL ou HIGH; `revisor-pdi` uma vez, no Passo 5; perto de 50% da janela de contexto, parada no próximo ponto seguro para decisão do usuário. Detalhe no `CLAUDE.md` §9.
