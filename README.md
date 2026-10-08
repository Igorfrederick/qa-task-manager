# Task Manager

Gerenciador de tarefas de um time de QA. Cada pessoa mantém as próprias tarefas; o líder enxerga as de todo o time e cria as contas.

Entregável das etapas 1, 2 e 3 de um PDI de QA — frontend, backend e E2E; as etapas 4 e 5 vivem fora daqui. O domínio é pequeno de propósito: a aplicação é o veículo para as competências técnicas avaliadas, mapeadas em [Critérios de avaliação](#critérios-de-avaliação).

---

## Stack

| Frente | Tecnologias |
|---|---|
| Frontend | React, Vite, React Router, React Hook Form, Zod, CSS Modules |
| Backend | Node.js, Express, MongoDB, Mongoose, JWT, bcrypt, Zod, Vitest, supertest |
| E2E | Playwright, TypeScript, faker |

## Estrutura

```
backend/     API REST em camadas (routes → controllers → services → models), com testes em tests/
frontend/    SPA React, uma pasta por tela em src/pages
e2e/         Suíte Playwright com Page Object Model, um page por tela, testes por jornada
docs/        Log de decisões técnicas e documento de retomada
.claude/     Agentes e base de conhecimento — convenções e checklists — usados na construção
```

## O que a aplicação faz

- Login com JWT, com dois perfis: `qa` e `lead`
- Tarefas: criar, editar, concluir e reabrir, excluir, filtrar por status e prioridade
- O `qa` alcança só as próprias tarefas — a de outra pessoa responde como inexistente; o `lead` enxerga e gerencia as do time inteiro, com o dono de cada uma
- Contas criadas só pelo `lead`, pela API: não há cadastro público

Fora do escopo, por decisão: tela de cadastro, recuperação de senha, atribuição de tarefa a outra pessoa, data de vencimento, paginação e busca textual — a lista completa está no [CLAUDE.md](CLAUDE.md), §2.

## Critérios de avaliação

Cada critério da rubrica das etapas 1 a 3, e onde ele aparece no repositório. O porquê de cada escolha, com a alternativa descartada, está em [docs/decisions.md](docs/decisions.md).

### Critérios de frontend

| Critério | Onde ver |
|---|---|
| Estrutura de pastas | `frontend/src/` — `pages/`, uma pasta por tela; `components/`, `hooks/`, `services/`, `schemas/`, `contexts/`, `utils/` |
| Componentização e reutilização | `frontend/src/components/` — `Button`, `ErrorMessage`, `LoadingMessage` e `FormField`, base de `TextField` e `SelectField`, usados pelas três telas; `ProtectedRoute` e `AppLayout` envolvem as rotas com sessão |
| Boas práticas | `services/api.js`, a única porta para a API, devolve o erro do contrato como `ApiError`; `data-cy` em todo elemento interativo; CSS Modules, com os tokens em `src/index.css` |
| Interface responsiva | `@media` em `pages/TaskListPage/TaskListPage.module.css` — linhas no desktop, cartões no celular —, `LoginPage.module.css` e `AppLayout.module.css`; cada teste E2E roda também no projeto `mobile` (Pixel 7) |
| Formulários com validação | `schemas/loginSchema.js` e `schemas/taskSchema.js`, em Zod, ligados ao React Hook Form; o erro de validação da API vai para o campo, em `pages/TaskFormPage/TaskForm.jsx` |
| Tela de login integrada com o backend | `pages/LoginPage/LoginPage.jsx` e `contexts/AuthContext.jsx` — `POST /auth/login`, sessão restaurada por `GET /auth/me` ao recarregar, token em `utils/tokenStorage.js` |

### Critérios de backend

| Critério | Onde ver |
|---|---|
| API REST funcional | `backend/src/routes/`, conforme o [contrato da API](.claude/knowledge/conventions/api_contract.md); `backend/tests/api/` exercita cada rota |
| Arquitetura em camadas | `routes/` → `controllers/` → `services/` → `models/`: o controller só traduz HTTP, a regra de negócio fica no service, que não conhece `req` nem `res` |
| JWT — geração e validação | `utils/token.js` — `signToken` e `verifyToken`, algoritmo fixo e expiração em `JWT_EXPIRES_IN`; `middlewares/auth.js` — `requireAuth` responde `401` com `TOKEN_MISSING`, `TOKEN_INVALID` ou `TOKEN_EXPIRED` |
| Middleware de validação e autorização | `middlewares/validate.js`, com os schemas de `validators/` — corpo, query e parâmetro de rota, `400`; `middlewares/authorize.js` — `requireRole`, `403`; o escopo por dono entra na própria consulta, em `services/taskService.js` |
| Conexão com MongoDB | `config/database.js`, com a URI de `MONGODB_URI`; `docker-compose.yml` na raiz |
| Hash de senhas | `services/userService.js` — bcrypt no cadastro; `services/authService.js` — e-mail inexistente e senha errada respondem igual, inclusive no tempo; `passwordHash` fora de toda resposta, em `models/User.js` |
| Variáveis de ambiente | `config/env.js` valida na importação e falha dizendo o que falta; `.env.example` em cada frente, com valores fictícios |
| Modelagem de dados | `models/User.js` — e-mail único, perfil por enum; `models/Task.js` — status e prioridade por enum, índice no dono |

### Critérios de E2E

| Critério | Onde ver |
|---|---|
| Suíte cobrindo login e autenticação | `e2e/tests/auth/` — login válido nos dois perfis, credencial inválida conferida pelo `code`, validação do formulário, sessão restaurada, sair e rotas protegidas; o `401` e o `403` por perfil, na API, em `backend/tests/api/` |
| Suíte cobrindo funcionalidades principais | `e2e/tests/tasks/` — criar, validar, editar, concluir, reabrir, excluir e filtrar, com a sessão do `qa`; escopo por dono nos dois perfis: o `qa` não vê nem abre a tarefa do `lead`, e o `lead` vê a do `qa`, com o dono, e a conclui |
| Testes isolados de backend | `backend/tests/` — services e API, com Vitest e supertest, sem navegador, contra um MongoDB real |
| Organização por feature ou jornada | `e2e/tests/auth/` e `e2e/tests/tasks/`, um arquivo por jornada; um Page Object por tela em `e2e/pages/` |
| Qualidade dos seletores | Só `data-cy`, por `getByTestId` — `testIdAttribute: 'data-cy'` em `e2e/playwright.config.ts` |
| Asserções específicas | O valor esperado, não a presença: o texto da linha, o `code` do erro da API, o efeito conferido pela API em `e2e/services/TaskService.ts`; asserção só no arquivo do teste, nunca no Page Object |
| Independência entre testes | Cada teste cria a própria massa, com entropia, e se ancora no `_id` dela; com `fullyParallel`, a suíte passa com `--repeat-each=5` e com `--workers=1` |
| Setup e teardown apropriados | `e2e/fixtures/test.ts` — autenticação por fixture de perfil, com o token da API; massa criada pela API e excluída no teardown, mesmo quando o teste falha |

## Do clone à suíte verde

Com Node.js e Docker instalados — o detalhe de cada passo está nas seções seguintes:

```bash
git clone https://github.com/Igorfrederick/qa-task-manager.git
cd qa-task-manager
docker compose up -d

cp backend/.env.example backend/.env    # gere o JWT_SECRET e escolha as duas senhas do seed
cp e2e/.env.example e2e/.env            # repita as mesmas senhas do seed

cd backend
npm ci
npm test                                # testes de service e API
npm run seed                            # um lead, dois qa e tarefas dos três
cd ../frontend
npm ci
cd ../e2e
npm ci
npx playwright install chromium         # no Linux: npx playwright install --with-deps chromium
npm test                                # sobe API e frontend, e roda a suíte no desktop e no celular
```

## Requisitos

- Node.js 20.19+, 22.13+ ou 24+ — o que as três frentes aceitam juntas: o E2E pede 20.19+, 22.13+ ou 23.5+, pelo faker, e o backend, 20, 22 ou 24+, pelo Vitest 4
- MongoDB 7, pelo `docker compose` da seção seguinte ou instalado localmente

## Banco de dados

A aplicação e a suíte de teste do backend exercitam um MongoDB real. O caminho principal é o `docker-compose.yml` da raiz:

```bash
docker compose up -d      # sobe o banco em 127.0.0.1:27017
docker compose down       # encerra, preservando os dados
```

**Alternativa sem Docker:** instale o MongoDB localmente e ajuste `MONGODB_URI` no `backend/.env` para apontar para a sua instância.

Sem banco em pé, `npm test` no `backend/` falha em poucos segundos com uma mensagem apontando a causa e o comando que resolve — é ambiente ausente, não código quebrado.

## Configuração

Cada frente tem seu próprio `.env.example`. Copie e preencha com valores locais — o do frontend é opcional, e só muda o endereço do backend:

```bash
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
cp e2e/.env.example e2e/.env
```

Nenhum valor real de segredo é versionado. `JWT_SECRET` deve ser gerado localmente:

```bash
openssl rand -base64 32
```

As senhas do seed, `SEED_LEAD_PASSWORD` e `SEED_QA_PASSWORD`, têm ao menos 8 caracteres e se repetem no `e2e/.env`, em `E2E_LEAD_PASSWORD` e `E2E_QA_PASSWORD`.

## Backend

```bash
cd backend
npm ci
npm test        # suíte de service e API, sem navegador; exige o banco em pé
npm run seed    # recria a base com dado fictício: um lead, dois qa e tarefas dos três
npm run dev     # sobe a API em http://localhost:3000
```

### Seed

`npm run seed` apaga usuários e tarefas e recria um conjunto fictício, sempre o mesmo — por isso recusa rodar com `NODE_ENV=production`. As senhas vêm de `SEED_LEAD_PASSWORD` e `SEED_QA_PASSWORD` no `backend/.env`; as de `e2e/.env` têm de ser as mesmas.

| Perfil | E-mail | Senha |
|---|---|---|
| `lead` | `lead@exemplo.test` | `SEED_LEAD_PASSWORD` |
| `qa` | `qa@exemplo.test` | `SEED_QA_PASSWORD` |
| `qa` | `qa2@exemplo.test` | `SEED_QA_PASSWORD` |

Não há cadastro público: o seed é a origem do primeiro `lead`, e as demais contas o líder cria por `POST /api/auth/register`.

## Frontend

Com a API em pé (seção anterior):

```bash
cd frontend
npm ci
npm run dev     # sobe a interface em http://localhost:5173
```

Entre com uma das contas do seed: o `qa` vê e gerencia as próprias tarefas; o `lead`, as do time inteiro, com o dono de cada uma. O frontend chama `/api` no próprio endereço, e o servidor do Vite repassa ao backend em `API_PROXY_TARGET` (padrão `http://localhost:3000`) — por isso o backend não precisa de CORS. A porta 5173 é fixa: ocupada, o Vite falha em vez de subir em outra, porque a suíte E2E aponta para ela.

## E2E

Com o banco em pé, o `backend/.env` preenchido e o seed rodado — com `SEED_LEAD_PASSWORD` e `SEED_QA_PASSWORD` iguais a `E2E_LEAD_PASSWORD` e `E2E_QA_PASSWORD` no `e2e/.env`:

```bash
cd e2e
npm ci
npx playwright install chromium   # no Linux, --with-deps instala também as bibliotecas do sistema
npm test            # sobe API e frontend se não estiverem no ar, e roda cada teste no desktop e no celular
npm run report      # relatório HTML da última execução
npm run typecheck   # TypeScript estrito, sem emitir
```

A suíte não roda o seed — ele apaga a base. Antes do primeiro teste, ela confere que as contas do seed entram na API e, se não entram, diz o comando que resolve. Os testes começam autenticados por fixture de perfil (`test.use({ role: 'qa' })`), com o token obtido pela API; só os testes de login passam pela tela de login. Cada teste cria a própria massa pela API e a exclui no teardown, pela fixture `taskApi`, mesmo quando falha. As contas do seed são compartilhadas entre testes em paralelo: as asserções olham as tarefas do próprio teste, pelo `_id`, e nunca contam a lista inteira.

| Pasta | Conteúdo |
|---|---|
| `tests/` | Testes por jornada: `auth/` (login, sessão, rotas protegidas) e `tasks/` (criar, editar, ações da lista, filtros, escopo por dono) |
| `pages/` | Page Objects, um por tela, com locators por `data-cy` e ações, sem asserção |
| `fixtures/` | Test base: perfil, Page Objects e service layer injetados |
| `services/` | Chamadas à API para setup e conferência |
| `factories/` | Massa com faker |
| `support/` | Variáveis de ambiente, conferência inicial e rótulos que a lista mostra |

## Documentação

| Documento | Conteúdo |
|---|---|
| [CLAUDE.md](CLAUDE.md) | Domínio, escopo, regras de negócio, telas, protocolo de trabalho |
| [Contrato da API](.claude/knowledge/conventions/api_contract.md) | Rotas, corpos, formato de erro, status HTTP |
| [docs/decisions.md](docs/decisions.md) | Log de decisões técnicas, com motivo e alternativa descartada |
| [docs/handoff.md](docs/handoff.md) | Estado do projeto e ordem de execução |
