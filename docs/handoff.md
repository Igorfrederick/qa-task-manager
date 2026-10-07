# Handoff — Task Manager

Documento de retomada para começar o trabalho neste repositório numa sessão nova do Claude Code, sem o contexto das sessões anteriores.

**Como usar:** abra o Claude Code na raiz do repositório e comece com algo assim:

> Leia `CLAUDE.md`, `docs/handoff.md` e `docs/decisions.md`. Vamos seguir o Passo 5, entrega. Confira antes se o PR da 4.2 foi mergeado, e apresente o plano de commits antes de escrever.

---

## 1. Onde o projeto está

| Passo | Entrega | Situação |
|---|---|---|
| 1 | Fundação — base do backend, convenções, agentes, decisões | Concluído em 01/10/2026 |
| 2 | Backend completo, contrato estável | Concluído em 07/10/2026 — 2.1 (PR #1), 2.2 (PR #2) e 2.3 (PR #3) mergeadas |
| 3 | Frontend — três telas | Concluído em 07/10/2026 — 3.1 (PR #4) e 3.2 (PR #5) mergeadas |
| **4** | **E2E** | **Em revisão** — 4.1 (PR #6) mergeada; 4.2 concluída em 07/10/2026 na branch `feat/e2e-tarefas`, aguarda a passada do `code-reviewer`, PR e merge |
| 5 | Entrega — README final, `revisor-pdi`, limpeza | Não iniciado — é o próximo |

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

Frontend, fatia 3.1:

- Vite + React, React Router, React Hook Form com Zod por `@hookform/resolvers`, CSS Modules com tokens em `src/index.css`
- Tela `/login` com erro por campo e, na falha da API, o `message` do contrato em `login-error-message`
- `services/api.js` é a única porta para a API: chama `/api` relativo, pelo proxy do Vite, e devolve o erro do contrato como `ApiError` (`status`, `code`, `message`, `details`)
- Token no `localStorage`, só ele, por `utils/tokenStorage.js`; a sessão é restaurada por `GET /auth/me` quando a página recarrega
- `ProtectedRoute` único para as telas com sessão; sem sessão, `/login`, guardando o destino; `401` encerra a sessão, menos no login e na resposta atrasada de um token já trocado; chamada sem token, de uma aba aberta depois que outra saiu, também encerra. A restauração que falha por outro motivo, como servidor fora, não apaga o token
- O `/login` espera a restauração da sessão antes de mostrar o formulário; "Sair" não guarda destino, porque o `BrowserRouter` roda com `useTransitions={false}`
- `AppLayout` com o nome do usuário e o botão "Sair"
- Verificado em navegador, em 1280 e em 375 px de largura: validação, credencial inválida, login, recarga, sair, token adulterado e ausência de rolagem horizontal; depois da revisão, também sair sem destino guardado, login com restauração lenta, `401` de token trocado e saída em outra aba

Frontend, fatia 3.2:

- Componentes compartilhados: `Button` (`primary`, `secondary`, `danger`), `FormField` — rótulo, erro, `aria` e estilo do controle, que chega por função —, `TextField` e `SelectField` sobre ele, `ErrorMessage` e `LoadingMessage`
- `/tasks`: lista na ordem da API, com filtros de status e prioridade na URL — "Todos" omite o parâmetro, valor inválido digitado vale como todos —, estados de carregamento, erro e vazio, e o dono de cada tarefa para o `lead`; linhas no desktop, cartões no celular
- Ações por linha: concluir ou reabrir, editar e excluir, com confirmação por `window.confirm`; cada ação trava as linhas até a lista voltar da API, e a lista recarrega mantendo-se na tela, com `aria-busy` enquanto recarrega; trocar de filtro limpa o erro da ação
- O formulário volta à lista com os filtros de onde foi aberto, e recomeça a cada tarefa: `TaskFormPage` monta `TaskForm` com a `key` do id, porque o React Router reaproveita o componente entre `/tasks/new` e `/tasks/:id`
- `/tasks/new` e `/tasks/:id`: mesmo formulário, schema com os limites e mensagens da API, erro de validação da API levado ao campo; `404` e id fora do formato mostram "tarefa não encontrada", sem revelar se a tarefa é de outra pessoa
- Verificado em navegador, contra a API, nos dois perfis e em 1280 e 375 px: lista igual à da API em cada filtro, dono para o `lead`, concluir, reabrir, excluir com e sem confirmação, ação sobre tarefa excluída por fora, criar com dono do token, editar, cancelar, validação por campo, `qa` abrindo tarefa do `lead` e `lead` editando tarefa do `qa` — 60 verificações, contando a regressão da 3.1; depois da revisão, mais 6: formulário que recomeça pelo histórico, filtros preservados na volta do formulário, seletores de erro distintos e botões que não reabilitam antes da recarga

---

E2E, fatia 4.1:

- Playwright + TypeScript estrito (`npm run typecheck`); `testIdAttribute: 'data-cy'`, e os Page Objects localizam por `getByTestId`
- Cada teste roda em `desktop` (Desktop Chrome) e `mobile` (Pixel 7), sem nova tentativa
- `webServer` sobe a API (`npm start`) e o frontend (`npm run dev`), ou reaproveita os que estão no ar; o seed nunca roda pela suíte
- `globalSetup` confere que as contas do seed entram na API: `401` pede o seed; outra falha pede para conferir `API_URL`. A service layer lança `ApiCallError`, com o status
- `fixtures/test.ts`: `test.use({ role: 'qa' | 'lead' })` põe no `storageState` o token obtido pela API uma vez por worker; `sessions` dá o token e o usuário de cada perfil; `loginPage` e `taskListPage` injetados
- `LoginPage` e `TaskListPage` (cabeçalho: nome e "Sair"); `TaskFormPage` nasce na 4.2, com o primeiro uso
- `factories/credentialsFactory.ts` e `factories/taskFactory.ts` (por ora, só um id de tarefa inexistente) com `@faker-js/faker` 10
- Testes em `tests/auth/`: quatro rotas protegidas sem sessão, `/tasks/:id` incluída; login válido dos dois perfis; sessão aberta pela tela que sobrevive à recarga — o que liga a tela ao atalho das fixtures; volta à rota pedida, com filtros, depois do login; senha errada e e-mail inexistente, conferindo `INVALID_CREDENTIALS` e mostrando o `message` da resposta; campos vazios e e-mail fora do formato sem chamada à API; sessão guardada restaurada pela API; sair — 16 testes, 32 execuções
- Estabilidade: 160 de 160 com `--repeat-each=5` em paralelo, e 32 de 32 com `--workers=1`

E2E, fatia 4.2:

- `services/TaskService.ts`: listar, criar, ler e excluir pela API, com o token de uma sessão; `ApiCallError` leva também o `code` do contrato, e a tarefa excluída se confere por `TASK_NOT_FOUND`
- Fixture `taskApi`: um `TaskService` por perfil, `taskApi.qa` e `taskApi.lead`. Toda tarefa criada por ele é anotada com o perfil que a criou; a criada pela tela entra por `taskApi.track`, com o `_id` da resposta. No teardown, que roda também na falha, cada uma sai pela API com o token de quem a criou, e o `404` da que o teste já excluiu é ignorado — entrada de 07/10 em `docs/decisions.md`
- `buildTask()` com faker: título e descrição com entropia, prioridade sorteada; override fixa status, prioridade ou título vazio
- `TaskFormPage` nasce: campos, erro do título, salvar e "tarefa não encontrada". O `TaskListPage` ganha filtros, as partes de cada linha pelo `_id`, inclusive o dono, e as ações — `deleteTask()` aceita o diálogo antes do clique. Os rótulos que a lista mostra ficam em `support/taskLabels.ts`
- Testes em `tests/tasks/`: criar pela tela, com o dono da sessão conferido na API; título vazio sem chamada à API; editar pela lista, com o formulário preenchido; concluir, reabrir e excluir, com a API confirmando; filtro por status, por prioridade e pelos dois no endereço; escopo por dono — o `qa` não vê nem abre a tarefa do `lead`, e o `lead` vê a do `qa`, com o dono, e a conclui. O teste de login com a rota pedida confere também os filtros na tela — 29 testes, 58 execuções
- Asserção de ausência só depois de uma presença que prove a lista certa na tela: ao trocar de filtro, a lista anterior fica até a resposta
- Provas de mutação: sem aceitar o diálogo, a exclusão falha; com a sessão do `lead`, o teste do escopo do `qa` falha
- Estabilidade: 290 de 290 com `--repeat-each=5` em paralelo, e 58 de 58 com `--workers=1`; depois das 348 execuções, a base voltou às 8 tarefas do seed

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

A fatia 3.1 fechou as decisões do frontend — token no `localStorage`, CSS Modules, proxy do Vite em vez de CORS e `@hookform/resolvers` —, entradas de 07/10 em `docs/decisions.md`; o `CLAUDE.md` §10 fica sem decisões em aberto.

A fatia 3.2 decidiu que a exclusão pede confirmação pelo diálogo nativo do navegador — entrada de 07/10 em `docs/decisions.md`, propagada às convenções e aos checklists de frontend e de E2E e aos dois agentes.

Para o Passo 4:

- Seletores da 3.2: `task-list-new-button`, `task-filter-status-select`, `task-filter-priority-select`, `task-list`, `task-list-empty`, `task-list-error-message` (falha ao carregar), `task-list-action-error-message` (falha de uma ação); por tarefa, `task-list-row-`, `-title-`, `-description-`, `-status-`, `-priority-`, `-owner-`, `-complete-button-`, `-reopen-button-`, `-edit-button-` e `-delete-button-`, seguidos do `_id`; no formulário, `task-form-title-input`, `-description-input`, `-priority-select`, os `-error` de cada campo, `-save-button`, `-cancel-button`, `-error-message` (falha ao salvar), `-load-error-message` (falha ao carregar), `-not-found` e `-back-button`
- `deleteTask()` do Page Object aceita o diálogo antes do clique; sem isso, o Playwright o descarta e nada é excluído
- Depois de uma ação ou de uma troca de filtro, as linhas antigas ficam na tela até a resposta, com `aria-busy="true"` em `task-list`. Asserção de valor final — texto, contagem — já espera sozinha; asserção de presença precisa antes esperar `task-list` com `aria-busy="false"`, ou `task-list-empty`, para não passar sobre a lista antiga
- Os filtros estão na URL: um teste pode abrir `/tasks?status=done` direto
- Sugestões da revisão da 3.1 ainda não aplicadas: com backend fora, a restauração não abre sessão e o `/login` não diz por quê; e, pelo proxy, backend fora responde `502` sem corpo, que hoje aparece como `UNEXPECTED_RESPONSE` em vez de `NETWORK_ERROR`
- Sugestões da revisão da 3.2 não aplicadas: `TaskListItem` com módulo CSS próprio, em vez de dividir o da página; e entradas no log para a recarga depois de cada ação e para os filtros na URL — o motivo de cada uma está no corpo dos commits
- Fora do v1, registrado: se outra aba entra como outro usuário, a aba já aberta segue mostrando o usuário antigo até recarregar; ouvir o evento `storage` no `AuthProvider` resolveria

### Passo 4 — E2E

| Fatia | Entrega |
|---|---|
| 4.1 Base e autenticação | Config do Playwright, fixtures por perfil, service layer, factory de credenciais, `LoginPage` e `TaskListPage`, jornadas de login e sessão |
| 4.2 Tarefas | Jornadas de criar, editar, concluir, excluir, filtrar e escopo por dono |

A fatia 4.1 decidiu a configuração da suíte, a massa com `@faker-js/faker` 10 e a autenticação por fixture de perfil, sem usuário criado por teste — três entradas de 07/10 em `docs/decisions.md`, propagadas às convenções, ao checklist e ao agente de E2E.

A fatia 4.2 decidiu a limpeza da massa pela fixture `taskApi`, com o token do perfil que criou cada tarefa — entrada de 07/10 em `docs/decisions.md`, propagada à convenção e ao checklist de E2E.

### Passo 5 — Entrega

README final com a tabela critério → lugar no repositório e passada única do `revisor-pdi`. Não restam `.gitkeep` no repositório.

Para o Passo 5:

- O `checklist_pdi.md` pede, na suíte de autenticação, "acesso negado por perfil". A interface não tem tela exclusiva do `lead` — o cadastro não tem tela, fora do v1 —, e o `403` está provado na API, em `backend/tests/`. A tabela critério → lugar do README deve apontar para lá
- A suíte E2E roda contra o seed: antes da execução de entrega, `npm run seed` e depois `npm test` em `e2e/`, sem rodar o seed no meio — ele invalida os tokens dos workers
- Sugestão da revisão da 4.1 ainda não aplicada: conferir no `globalSetup` que o `API_PROXY_TARGET` do frontend aponta para a mesma API de `API_URL`

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

**Real:** o Passo 2 fechou em 07/10, dois dias depois do previsto; o Passo 3 também fechou em 07/10, e o Passo 4 fecha no mesmo dia, com o merge da 4.2; o Passo 5 fica entre 08 e 09/10.

**Se atrasar, corte nesta ordem:** filtros da lista; coluna de dono na lista do líder (a API mantém o campo); rodadas extras de revisão.

**Não corte:** login integrado, validação de formulário, responsividade, `data-cy`, setup e teardown, testes de backend.

---

## 4. Pendências

| # | Pendência | Por que importa |
|---|---|---|
| 1 | **Caminho do `docker compose` não verificado** — a máquina de desenvolvimento ainda não tem Docker nem WSL; o MongoDB 7 roda de um zip, fora do repositório, em `%USERPROFILE%\mongodb`, e sobe com `start-mongod.cmd`. Decidido em 07/10: verificar nesta máquina, instalando o Docker | O README manda o avaliador pelo compose: antes da entrega, `docker compose up -d` e a suíte rodam uma vez num clone limpo |

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
