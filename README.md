# Task Manager

Gerenciador de tarefas de um time de QA. Cada pessoa mantém as próprias tarefas; o líder enxerga as de todo o time e cria as contas.

> **Estado:** em construção. Backend pronto — login com JWT, perfis `qa` e `lead`, criação de conta restrita ao líder, CRUD de tarefas com escopo por dono e filtros por status e prioridade, e seed com dado fictício. Frontend pronto — login integrado, rotas protegidas, lista com filtros e ações por linha, e formulário de criar e editar; E2E com autenticação pronta — login, sessão por perfil e rotas protegidas, no desktop e no celular; jornadas de tarefa em andamento — ver [docs/handoff.md](docs/handoff.md).

---

## Stack

| Frente | Tecnologias |
|---|---|
| Frontend | React, Vite, React Router, React Hook Form, Zod |
| Backend | Node.js, Express, MongoDB, Mongoose, JWT, bcrypt, Zod, Vitest |
| E2E | Playwright, TypeScript |

## Estrutura

```
backend/     API REST em camadas (routes → controllers → services → models)
frontend/    SPA React, uma pasta por tela em src/pages
e2e/         Suíte Playwright com Page Object Model, um page por tela
docs/        Log de decisões técnicas e documento de retomada
```

## Documentação

| Documento | Conteúdo |
|---|---|
| [CLAUDE.md](CLAUDE.md) | Domínio, escopo, regras de negócio, telas, protocolo de trabalho |
| [Contrato da API](.claude/knowledge/conventions/api_contract.md) | Rotas, corpos, formato de erro, status HTTP |
| [docs/decisions.md](docs/decisions.md) | Log de decisões técnicas, com motivo e alternativa descartada |
| [docs/handoff.md](docs/handoff.md) | Estado do projeto e ordem de execução |

## Requisitos

- Node.js 20.19+, 22.13+ ou 23.5+ — o mínimo do E2E, pelo faker. O frontend aceita também a 22.12, pelo Vite 8, e o backend, qualquer 20+
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

## Backend

```bash
cd backend
npm install
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
npm install
npm run dev     # sobe a interface em http://localhost:5173
```

Entre com uma das contas do seed: o `qa` vê e gerencia as próprias tarefas; o `lead`, as do time inteiro, com o dono de cada uma. O frontend chama `/api` no próprio endereço, e o servidor do Vite repassa ao backend em `API_PROXY_TARGET` (padrão `http://localhost:3000`) — por isso o backend não precisa de CORS. A porta 5173 é fixa: ocupada, o Vite falha em vez de subir em outra, porque a suíte E2E aponta para ela.

## E2E

Com o banco em pé, o `backend/.env` preenchido e o seed rodado — com `SEED_LEAD_PASSWORD` e `SEED_QA_PASSWORD` iguais a `E2E_LEAD_PASSWORD` e `E2E_QA_PASSWORD` no `e2e/.env`:

```bash
cd e2e
npm install
npx playwright install chromium
npm test            # sobe API e frontend se não estiverem no ar, e roda cada teste no desktop e no celular
npm run report      # relatório HTML da última execução
npm run typecheck   # TypeScript estrito, sem emitir
```

A suíte não roda o seed — ele apaga a base. Antes do primeiro teste, ela confere que as contas do seed entram na API e, se não entram, diz o comando que resolve. Os testes começam autenticados por fixture de perfil (`test.use({ role: 'qa' })`), com o token obtido pela API; só os testes de login passam pela tela de login.

| Pasta | Conteúdo |
|---|---|
| `tests/` | Testes por jornada: `auth/` (login, sessão, rotas protegidas) |
| `pages/` | Page Objects, um por tela, com locators por `data-cy` e ações, sem asserção |
| `fixtures/` | Test base: perfil, Page Objects e service layer injetados |
| `services/` | Chamadas à API para setup e conferência |
| `factories/` | Massa com faker |
| `support/` | Variáveis de ambiente e conferência inicial |

## Contexto

Este repositório é o entregável das etapas 1, 2 e 3 de um PDI de QA — frontend, backend e E2E. As etapas 4 e 5 vivem fora daqui.
