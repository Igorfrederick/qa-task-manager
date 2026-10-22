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
package.json        Só scripts: sobe API e frontend com um comando; cada frente mantém as próprias dependências
docker-compose.yml  MongoDB de desenvolvimento e teste
backend/            API REST em camadas (routes → controllers → services → models), com testes em tests/
frontend/           SPA React, uma pasta por tela em src/pages
e2e/                Suíte Playwright com Page Object Model, um page por tela, testes por jornada
docs/               Log de decisões técnicas, documento de retomada e coleção do Postman da API
.claude/            Agentes e base de conhecimento — convenções e checklists — usados na construção
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

## Do clone à aplicação no ar

Com Node.js e Docker instalados, todos os comandos rodam na raiz do repositório. O detalhe de cada passo está nas seções seguintes.

1. **Conferir os pré-requisitos** — `node -v` responde 20.19+, 22.13+ ou 24+, e `docker -v` responde. Sem Docker, veja [Banco de dados](#banco-de-dados).

2. **Clonar**

   ```bash
   git clone https://github.com/Igorfrederick/qa-task-manager.git
   cd qa-task-manager
   ```

3. **Subir o banco** — `npm run db:up`, que roda `docker compose up -d`.

4. **Configurar**

   ```bash
   cp backend/.env.example backend/.env
   cp e2e/.env.example e2e/.env
   ```

   No `backend/.env`, troque `JWT_SECRET` por um segredo gerado — `node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"` — e escolha `SEED_LEAD_PASSWORD` e `SEED_QA_PASSWORD`, com ao menos 8 caracteres. No `e2e/.env`, repita as duas senhas em `E2E_LEAD_PASSWORD` e `E2E_QA_PASSWORD`.

5. **Instalar** — `npm run setup` roda o `npm ci` da raiz e das três frentes, cada uma com o próprio lockfile.

6. **Popular a base** — `npm run seed` apaga usuários e tarefas e recria o conjunto fictício: um `lead`, dois `qa` e as tarefas dos três. Mudou uma senha do seed no `backend/.env`? Rode de novo, ou as contas seguem com a senha antiga.

7. **Subir a aplicação** — `npm run dev` sobe a API em `http://localhost:3000` e a interface em `http://localhost:5173`, no mesmo terminal, com o log de cada uma prefixado por `[api]` e `[web]`.

8. **Entrar** — em `http://localhost:5173`, com uma das [contas do seed](#seed).

9. **Criar contas** — pela API, com o token do `lead`: [Criar contas](#criar-contas).

10. **Encerrar** — `Ctrl+C` encerra a API e a interface juntas; `npm run db:down` para o banco, preservando os dados.

Cada frente também sobe sozinha, de dentro da própria pasta — o `package.json` da raiz só reúne os comandos, e as seções [Backend](#backend) e [Frontend](#frontend) mostram o caminho por frente.

## Do clone à suíte verde

Depois dos passos 1 a 6 acima:

```bash
npm test --prefix backend               # testes de service e API, sem navegador
cd e2e
npx playwright install chromium         # no Linux: npx playwright install --with-deps chromium
npm test                                # sobe API e frontend, e roda a suíte no desktop e no celular
```

## Requisitos

- Node.js 20.19+, 22.13+ ou 24+ — o que as três frentes aceitam juntas: o E2E pede 20.19+, 22.13+ ou 23.5+, pelo faker, e o backend, 20, 22 ou 24+, pelo Vitest 4
- MongoDB 7, pelo `docker compose` da seção seguinte ou instalado localmente

## Banco de dados

A aplicação e a suíte de teste do backend exercitam um MongoDB real. O caminho principal é o `docker-compose.yml` da raiz:

```bash
npm run db:up      # docker compose up -d: sobe o banco em 127.0.0.1:27017
npm run db:down    # docker compose down: encerra, preservando os dados
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

Nenhum valor real de segredo é versionado. `JWT_SECRET` deve ser gerado localmente — pelo Node, que funciona em qualquer sistema, ou pelo `openssl rand -base64 32`, onde houver `openssl`:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

As senhas do seed, `SEED_LEAD_PASSWORD` e `SEED_QA_PASSWORD`, têm ao menos 8 caracteres e se repetem no `e2e/.env`, em `E2E_LEAD_PASSWORD` e `E2E_QA_PASSWORD`.

## Backend

```bash
cd backend
npm ci
npm test        # suíte de service e API, sem navegador; exige o banco em pé, em base própria
npm run seed    # recria a base com dado fictício: um lead, dois qa e tarefas dos três
npm run dev     # sobe a API em http://localhost:3000
```

Da raiz, `npm test --prefix backend` e `npm run seed` fazem o mesmo que os dois primeiros, e `npm run dev` sobe a API junto com a interface.

A suíte do backend roda na base `task-manager-test`, e não na do `backend/.env`: rodar os testes não apaga nem altera o que o seed criou. A base de teste só muda quando `MONGODB_URI` está definida no próprio terminal — `tests/setup.js` a fixa antes de ler o `.env`.

### Seed

`npm run seed` apaga usuários e tarefas e recria um conjunto fictício, sempre o mesmo — por isso recusa rodar com `NODE_ENV=production`. As senhas vêm de `SEED_LEAD_PASSWORD` e `SEED_QA_PASSWORD` no `backend/.env`; as de `e2e/.env` têm de ser as mesmas.

| Perfil | E-mail | Senha |
|---|---|---|
| `lead` | `lead@exemplo.test` | `SEED_LEAD_PASSWORD` |
| `qa` | `qa@exemplo.test` | `SEED_QA_PASSWORD` |
| `qa` | `qa2@exemplo.test` | `SEED_QA_PASSWORD` |

Não há cadastro público: o seed é a origem do primeiro `lead`, e as demais contas o líder cria por `POST /api/auth/register`.

### Criar contas

Não há tela de cadastro, por escopo: a conta nova entra pela API, com o token de um `lead`. Com a API no ar, entre como `lead` e cadastre:

```bash
TOKEN=$(curl -s http://localhost:3000/api/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"email":"lead@exemplo.test","password":"SENHA_DO_LEAD"}' \
  | node -p "JSON.parse(require('fs').readFileSync(0, 'utf8')).token")

curl -s http://localhost:3000/api/auth/register \
  -H 'Content-Type: application/json' \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"name":"Nova Pessoa","email":"nova.pessoa@exemplo.test","password":"senha-de-teste","role":"qa"}'
```

`SENHA_DO_LEAD` é o `SEED_LEAD_PASSWORD` do `backend/.env`. No Windows, rode no Git Bash: no PowerShell, `curl` é outro comando, e as aspas do JSON não chegam inteiras ao `curl.exe`. Ou use a [coleção do Postman](docs/postman/task-manager.postman_collection.json), que faz os dois passos e guarda o token sozinha.

| Campo | Regra |
|---|---|
| `name` | De 2 a 120 caracteres |
| `email` | Formato de e-mail, único entre os usuários |
| `password` | De 8 caracteres a 72 bytes — o limite do bcrypt; letra acentuada conta dois |
| `role` | `qa` ou `lead`; omitido, a conta nasce `qa` |

A resposta é `201` com o usuário, sem a senha. Fora disso: `400 VALIDATION_ERROR`, com o campo em `details`; `401` sem token, ou com ele vencido — e `401 TOKEN_INVALID` quando o login falhou e o `TOKEN` ficou `undefined`: confira a senha do lead; `403 FORBIDDEN` com o token de um `qa`; `409 EMAIL_TAKEN` com um e-mail que já tem conta.

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

## Problemas comuns

| Sintoma | Causa | O que fazer |
|---|---|---|
| Conexão recusada na porta 3000 (`ECONNREFUSED`) | API fora do ar | `npm run dev` na raiz |
| No `npm run dev`, o log `[api]` mostra um erro e `Waiting for file changes`, e a interface segue no ar sem conseguir entrar | A API caiu — banco fora, `.env` incompleto — e o `node --watch` fica esperando uma alteração de arquivo em vez de encerrar, por isso a interface não cai junto | Corrigir a causa que o log `[api]` aponta, `Ctrl+C` e `npm run dev` de novo |
| No `npm run dev`, o log `[api]` mostra `EADDRINUSE` | Outra API já ocupa a porta 3000 — e a interface passa a falar com ela, sem aviso | Encerrar o processo da porta, como no caso da 5173, e `npm run dev` de novo |
| `npm test` do backend aborta apontando o banco | MongoDB fora do ar | `npm run db:up` |
| `INVALID_CREDENTIALS` com uma conta do seed | Senha do seed alterada no `backend/.env` depois do último seed: o banco guarda o hash da senha antiga | `npm run seed` de novo — ele apaga e recria a base |
| A suíte E2E para antes do primeiro teste, pedindo o seed | Senhas do `e2e/.env` diferentes das do `backend/.env`, ou seed não rodado | Igualar as senhas e rodar `npm run seed` |
| `Port 5173 is already in use`, e o `npm run dev` encerra a API junto | Outro Vite no ar | Encerrar o processo da porta — `netstat -ano \| findstr :5173` no Windows, `lsof -i :5173` no Linux e no Mac |

## Documentação

| Documento | Conteúdo |
|---|---|
| [CLAUDE.md](CLAUDE.md) | Domínio, escopo, regras de negócio, telas, protocolo de trabalho |
| [Contrato da API](.claude/knowledge/conventions/api_contract.md) | Rotas, corpos, formato de erro, status HTTP |
| [docs/decisions.md](docs/decisions.md) | Log de decisões técnicas, com motivo e alternativa descartada |
| [docs/handoff.md](docs/handoff.md) | Estado do projeto e ordem de execução |
| [docs/postman/](docs/postman/task-manager.postman_collection.json) | Coleção do Postman com todas as rotas: importe, preencha as senhas do seed e rode o login |
