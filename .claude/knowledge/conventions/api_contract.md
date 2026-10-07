# Contrato da API

Fonte única do contrato. Consumido pelo backend (implementa), pelo frontend (chama) e pelo E2E (assere).

Base: `/api`. Autenticação via header `Authorization: Bearer <token>`.

## Rotas

```
GET    /health                         → { status }

POST   /auth/register      [lead]      → { user }
POST   /auth/login                     → { token, user }
GET    /auth/me                        → { user }

GET    /tasks                          → { tasks }   filtros opcionais: ?status=&priority=
POST   /tasks                          → { task }
GET    /tasks/:id                      → { task }
PATCH  /tasks/:id                      → { task }
DELETE /tasks/:id                      → sem corpo
```

Toda rota exige token, exceto `GET /health` e `POST /auth/login`.

`[lead]` exige middleware de autorização por perfil. Ausência é falha de segurança.

**Escopo por dono.** As rotas de `/tasks` operam sobre as tarefas do usuário autenticado; para o `lead`, sobre as de todo o time. Para o `qa`, tarefa de outra pessoa responde `404`, igual a tarefa inexistente (regra 2) — o filtro por dono entra na própria consulta, não numa comparação depois dela.

**Dono vem do token.** O dono de uma tarefa nova é quem a cria. `userId` enviado no payload é descartado, como qualquer campo fora do schema (regra 3).

`PATCH` é deliberado: a edição é parcial, e concluir ou reabrir uma tarefa envia só o `status`.

Login com e-mail inexistente e login com senha errada respondem igual — mesmo status, mesmo `code` —, para não revelar quais e-mails têm conta.

## Corpos

### `User`

```json
{ "_id": "…", "name": "…", "email": "…", "role": "qa", "createdAt": "…", "updatedAt": "…" }
```

`passwordHash` nunca aparece, em nenhuma rota.

### `Task`

```json
{
  "_id": "…",
  "title": "Revisar plano de testes da release",
  "description": "",
  "status": "open",
  "priority": "high",
  "owner": { "_id": "…", "name": "…" },
  "createdAt": "…",
  "updatedAt": "…"
}
```

| Campo | Entrada | Regra |
|---|---|---|
| `title` | obrigatório na criação | texto sem espaços nas pontas, de 1 a 120 caracteres |
| `description` | opcional | até 2000 caracteres; padrão `""` |
| `status` | opcional | `open` \| `done`; padrão `open` |
| `priority` | opcional | `low` \| `medium` \| `high`; padrão `medium` |

`owner` é saída: identifica o dono para a listagem do líder. Na entrada, o dono vem sempre do token.

Os filtros de `GET /tasks` aceitam os mesmos valores de `status` e `priority`; valor fora do domínio responde `400`.

## Formato de erro

Resposta única para todo erro:

```json
{ "error": { "code": "TASK_NOT_FOUND", "message": "Tarefa não encontrada", "details": [] } }
```

| Campo | Papel |
|---|---|
| `code` | Contrato. Estável, `SCREAMING_SNAKE_CASE`, catálogo único |
| `message` | Apresentação. Português, livre para mudar |
| `details` | Lista de falhas de validação; vazia quando não se aplica |

**O `code` é o que os testes E2E asseveram. Nunca a mensagem em português** — decisão registrada em `docs/decisions.md`.

## Status HTTP

| Status | Quando |
|---|---|
| `400` | Validação de payload, de filtro ou de parâmetro de rota (schema, no middleware) |
| `401` | Sem token, token inválido ou credencial inválida no login |
| `403` | Perfil autenticado sem permissão |
| `404` | Recurso inexistente — ou, para o `qa`, tarefa de outra pessoa |
| `409` | Violação de invariante de domínio (no service) |

A distinção entre `401` e `403` é verificada: token ausente ou inválido é `401`; token válido com perfil insuficiente é `403`.

### Status de sucesso

| Status | Quando |
|---|---|
| `201` | Criação de recurso |
| `200` | Leitura e atualização |
| `204` | Exclusão, sem corpo |

## Regras de negócio e seus erros

Cada regra que falha tem `code` próprio e status adequado, exceto as de validação, que usam `VALIDATION_ERROR`. A regra 3 não é violação, e por isso não tem `code`.

**Critério de classificação: a dependência de estado.** Invariante de entrada — julgável olhando apenas o payload — valida por schema no middleware e retorna `400`. Invariante de domínio — só julgável consultando o estado do sistema — valida no service.

| # | Regra | Camada | Status | `code` |
|---|---|---|---|---|
| 1 | `title` obrigatório; `status` e `priority` dentro do domínio, no corpo e nos filtros | Validação | `400` | `VALIDATION_ERROR` |
| 2 | O `qa` só alcança as próprias tarefas | Service | `404` | `TASK_NOT_FOUND` |
| 3 | `userId` vem do token, nunca do payload | Service | — (sem erro) | — |
| 4 | E-mail único entre usuários | Service | `409` | `EMAIL_TAKEN` |

Corpo do erro de validação:

```json
{ "error": { "code": "VALIDATION_ERROR", "message": "...", "details": [{ "field": "title", "issue": "..." }] } }
```

**Regras `400` asserem `VALIDATION_ERROR` mais o campo em `details`, não um `code` próprio. Regras `404` e `409` têm `code` específico da violação.**

`TASK_NOT_FOUND` vale também para `_id` que não existe — é o mesmo caminho no código e no teste. `_id` em formato inválido é outro caso: julga-se olhando só a entrada, então é invariante de entrada — `400` com `VALIDATION_ERROR` e `id` em `details`, nunca o `500` de um `CastError` vazando do Mongoose.

A tabela cataloga as invariantes de domínio numeradas e não é a lista completa dos `code`s da API — `NOT_FOUND` (rota inexistente), `INTERNAL_ERROR` e a família de autenticação também são `code`s. A lista completa está em §Catálogo de `code`s.

## Catálogo de `code`s

Todos os `code`s da API. Cada `code` tem um único status. No backend, o catálogo vive em `backend/src/utils/errors.js` e associa cada `code` ao seu status e à sua mensagem — decisões de 01/10/2026 em `docs/decisions.md`.

| `code` | Status | Quando |
|---|---|---|
| `VALIDATION_ERROR` | `400` | Corpo, filtro ou parâmetro de rota fora do schema; JSON malformado |
| `INVALID_CREDENTIALS` | `401` | Login com e-mail inexistente ou com senha errada — mesma resposta para os dois |
| `TOKEN_MISSING` | `401` | Requisição sem `Authorization: Bearer <token>` |
| `TOKEN_INVALID` | `401` | Assinatura, formato ou algoritmo inválido, ou token de usuário que não existe mais |
| `TOKEN_EXPIRED` | `401` | `exp` vencido |
| `FORBIDDEN` | `403` | Perfil autenticado sem permissão para a rota |
| `NOT_FOUND` | `404` | Rota inexistente |
| `TASK_NOT_FOUND` | `404` | Tarefa inexistente ou, para o `qa`, de outra pessoa (regra 2) |
| `EMAIL_TAKEN` | `409` | E-mail já cadastrado (regra 4) |
| `INTERNAL_ERROR` | `500` | Erro não previsto; a mensagem original não vai ao cliente |

Esta tabela é o contrato e o catálogo do backend a implementa: `code` novo entra aqui antes ou junto do código que o lança, nunca depois.

## Perfis

| Ação | `qa` | `lead` |
|---|---|---|
| Entrar e consultar o próprio perfil | ✅ | ✅ |
| CRUD das próprias tarefas | ✅ | ✅ |
| CRUD de tarefas de outras pessoas | ❌ (`404`) | ✅ |
| Criar conta (`POST /auth/register`) | ❌ (`403`) | ✅ |
