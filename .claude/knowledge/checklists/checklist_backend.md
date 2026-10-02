# Checklist — Backend

Aplicar a qualquer diff que toque `backend/**`. Base: `conventions/backend_conventions.md` e `conventions/api_contract.md`.

## Camadas (CRITICAL)

- [ ] Nenhum controller contém regra de negócio
- [ ] Nenhum service importa ou recebe `req`/`res`
- [ ] Nenhum model conhece service
- [ ] Nenhuma lógica dentro da definição de rota

## Segurança (CRITICAL)

- [ ] Nenhum segredo literal no código — tudo por variável de ambiente
- [ ] Nenhum `.env` real versionado
- [ ] Senha com hash bcrypt, custo vindo de env
- [ ] `passwordHash` não aparece em nenhuma resposta de API
- [ ] `passwordHash` com `select: false` **e** `transform` removendo o campo em `toJSON` e `toObject`
- [ ] Nenhum `lean()` em query que retorne `User` — o `transform` não se aplica a objeto plano
- [ ] Senha não aparece em log, nem em texto puro

## Autenticação e autorização

- [ ] JWT com geração e validação explícitas
- [ ] Expiração do token definida
- [ ] Segredo do JWT em variável de ambiente
- [ ] Validação do token em middleware, não repetida em controller
- [ ] Toda rota marcada `[lead]` no contrato tem o middleware de perfil
- [ ] Perfis como constante única, sem string mágica espalhada
- [ ] Login com e-mail inexistente e com senha errada responde igual — mesmo status, mesmo `code`

## Escopo por dono

- [ ] Toda consulta de tarefa do `qa` filtra por `userId` na própria query — sem buscar e comparar depois
- [ ] Tarefa alheia e tarefa inexistente lançam o mesmo erro (`404`, `TASK_NOT_FOUND`)
- [ ] `userId` da tarefa nova vem do usuário autenticado; o schema Zod não declara `userId`
- [ ] O service recebe o usuário autenticado como dado (`{ id, role }`), não `req`

## Validação

- [ ] Schema Zod em `validators/` para toda entrada — corpo, query e parâmetro de rota
- [ ] Validação aplicada por middleware, antes do service
- [ ] Falha de validação retorna `400` com `details` preenchido
- [ ] `_id` mal formado responde `400`, não `500` de `CastError`

## Erros

- [ ] Formato único `{ error: { code, message, details } }` em toda resposta de erro
- [ ] `code` em `SCREAMING_SNAKE_CASE`, vindo de catálogo único
- [ ] Middleware de erro centralizado; sem `try/catch` repetido por controller
- [ ] Status HTTP correto: `400` validação, `401` sem token, `403` perfil, `404` ausente ou alheia, `409` regra
- [ ] Regra de negócio nova tem `code` correspondente no catálogo

## Modelagem

- [ ] `User.email` único no schema
- [ ] Índice em `Task.userId`
- [ ] `Task.status` e `Task.priority` com enum no schema, vindo da mesma constante que o schema Zod usa
- [ ] Referência entre entidades por `ObjectId`, campo terminando em `Id`

## Testes

- [ ] **Toda regra de negócio tem teste automatizado em `backend/tests/`, sem depender de UI**
- [ ] **Regra de negócio sem teste no mesmo commit é achado**
- [ ] Toda rota protegida tem teste de `401` sem token; toda rota `[lead]` tem teste de `403` com `qa`
- [ ] O service é exercitável sem HTTP e sem subir a aplicação
- [ ] Dependência externa (conexão, relógio, identificador) entra por parâmetro ou `config/`, não instanciada dentro da regra
- [ ] Caminho de erro coberto, não só o caminho feliz

## Conexão com o banco

- [ ] Conexão isolada em `config/`, não aberta em service, controller ou model
- [ ] `MONGODB_URI` por variável de ambiente
- [ ] Falha de conexão tratada — a aplicação não sobe silenciosamente sem banco
- [ ] Encerramento controlado da conexão

## Contrato

- [ ] Rota, verbo e formato conforme `api_contract.md`
- [ ] Nenhuma rota fora do contrato sem sinalização prévia
