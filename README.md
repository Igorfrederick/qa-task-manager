# Task Manager

Gerenciador de tarefas de um time de QA. Cada pessoa mantém as próprias tarefas; o líder enxerga as de todo o time e cria as contas.

> **Estado:** em construção. Backend pronto — login com JWT, perfis `qa` e `lead`, criação de conta restrita ao líder, CRUD de tarefas com escopo por dono e filtros por status e prioridade, e seed com dado fictício. Frontend e E2E em andamento — ver [docs/handoff.md](docs/handoff.md).

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

## Banco de dados

A aplicação e a suíte de teste do backend exercitam um MongoDB real. O caminho principal é o `docker-compose.yml` da raiz:

```bash
docker compose up -d      # sobe o banco em 127.0.0.1:27017
docker compose down       # encerra, preservando os dados
```

**Alternativa sem Docker:** instale o MongoDB localmente e ajuste `MONGODB_URI` no `backend/.env` para apontar para a sua instância.

Sem banco em pé, `npm test` no `backend/` falha em poucos segundos com uma mensagem apontando a causa e o comando que resolve — é ambiente ausente, não código quebrado.

## Configuração

Cada frente tem seu próprio `.env.example`. Copie e preencha com valores locais:

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

## Contexto

Este repositório é o entregável das etapas 1, 2 e 3 de um PDI de QA — frontend, backend e E2E. As etapas 4 e 5 vivem fora daqui.

Instruções de frontend e E2E serão adicionadas conforme cada frente for implementada.
