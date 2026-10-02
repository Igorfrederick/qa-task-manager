# Convenções — Backend

Fonte única para qualquer trabalho em `backend/`.

## Arquitetura em camadas

```
routes/       define rota e middleware; nenhuma lógica
controllers/  entrada e saída HTTP; nenhuma regra de negócio
services/     regra de negócio; não conhece req/res
models/       schema Mongoose; não conhece service
middlewares/  auth, autorização por perfil, validação, erro
validators/   schemas Zod de request
config/       conexão e variáveis de ambiente
```

`backend/tests/` acompanha essas camadas: testes automatizados de service e de API, sem navegador.

Três invariantes, nesta ordem de gravidade:

1. **Controller não contém regra de negócio.** Extrai da requisição, chama o service, devolve a resposta.
2. **Service não conhece `req` nem `res`.** Recebe dados e devolve dados ou lança erro de domínio. Se um service precisa de `req`, o controller não extraiu o suficiente.
3. **Model não conhece service.** O schema descreve a forma do dado e suas restrições. Regra que dependa de outra entidade vive no service.

Violação desses três é o erro mais visível na avaliação de "arquitetura em camadas".

## Testabilidade

A separação de camadas existe também para isto: **o service tem de ser exercitável sem HTTP e sem subir a aplicação.** Recebe dados, devolve dados ou lança erro de domínio — nada nele exige requisição, resposta ou servidor em pé.

Consequências práticas:

- Service que importa `req`/`res` não é testável isoladamente. A invariante de camada e o requisito de testabilidade são a mesma regra vista de dois lados.
- Dependência externa (conexão, relógio, gerador de identificador) entra por parâmetro ou por módulo de `config/`, nunca instanciada dentro da regra.
- **Regra de negócio nasce com teste automatizado em `backend/tests/`, sem depender de UI**, e os dois viajam no mesmo commit.

A ferramenta é **Vitest com supertest** — decisão de 01/10/2026 em `docs/decisions.md`. Teste de service chama a função direto, sem `app.js`; teste de API exercita a rota com `supertest`, sem abrir porta.

## Conexão com o banco

- Conexão isolada em `config/`, nunca aberta dentro de service, controller ou model
- URI exclusivamente por variável de ambiente (`MONGODB_URI`)
- Falha de conexão tratada de forma explícita: a aplicação não sobe silenciosamente sem banco
- Encerramento controlado da conexão, para que a suíte de teste não fique pendurada

## Autenticação

- JWT com geração e validação explícitas, expiração definida
- Segredo exclusivamente em variável de ambiente; nunca literal no código
- Validação do token em middleware, não repetida em controller
- O payload do token carrega o mínimo para autorizar: identificador e perfil

## Senhas

- Sempre com hash bcrypt, custo vindo de variável de ambiente
- Nunca em texto puro, nunca em log, nunca em resposta de API
- `passwordHash` jamais retorna ao cliente — remover na serialização, não confiar em o controller lembrar

**Duas barreiras, porque elas falham em situações diferentes:** `select: false` no campo, que impede a query de trazer o hash; e `transform` removendo o campo em `toJSON` **e** em `toObject`, que protege o caminho que a primeira barreira abre de propósito — `.select('+passwordHash')`, de que o login precisa. `toObject` também, e não só `toJSON`: `res.json()` chama `toJSON`, mas espalhar o documento ou logá-lo não chama.

**`lean()` é proibido em query que retorne `User`.** `lean()` devolve objeto plano, não documento Mongoose, e o `transform` não se aplica a ele — a segunda barreira desaparece sem erro e sem aviso. Quando a leitura precisar do ganho de `lean()`, projetar os campos explicitamente em vez de confiar na serialização.

## Autorização por perfil

- Middleware dedicado, aplicado na definição da rota
- Perfis (`qa`, `lead`) como constante única; string mágica espalhada pelo código é achado
- Rotas marcadas `[lead]` no contrato exigem o middleware; ausência é falha de segurança, não esquecimento
- **A tabela de perfis e permissões é do `api_contract.md`.** Não reproduzir aqui.

## Escopo por dono

O escopo por dono é regra de negócio (regras 2 e 3 do `api_contract.md`) e vive no service:

- O controller extrai o usuário autenticado do token e o passa ao service — o service recebe `{ id, role }`, não `req`
- O filtro por dono entra **na própria consulta** (`{ _id, userId }` para o `qa`), não numa comparação feita depois de buscar a tarefa: comparação posterior é um passo que dá para esquecer em uma das rotas
- Tarefa alheia e tarefa inexistente percorrem o mesmo caminho e lançam o mesmo erro (`404`)
- Na criação, `userId` vem do usuário autenticado; o schema Zod não declara `userId`, e o campo é descartado se vier no payload

## Validação de entrada

- Schema Zod em `validators/`, aplicado por middleware antes de chegar ao service — corpo, filtros de query e parâmetros de rota
- O service pode assumir que recebeu dado com a forma correta
- Falha de validação retorna `400` com `details` preenchido

## Erros

**Fonte do formato e dos status: `api_contract.md`.** O formato único de erro, a semântica de `code`/`message`/`details` e o mapa de status HTTP vivem lá e não são repetidos aqui — cópia diverge em silêncio.

O que cabe ao backend garantir:

- Middleware de erro centralizado; `try/catch` repetido em cada controller é achado
- `code` nascido de um catálogo único, nunca montado ad hoc no controller
- Regra de negócio nova exige `code` novo no catálogo
- O status devolvido corresponde à camada que detectou a falha: validação de payload no middleware, violação de domínio no service

## Modelagem

- Unicidade declarada no schema quando a regra de negócio exige: `User.email`
- Índice em `Task.userId` — toda listagem do `qa` filtra por dono
- Enum declarado no schema para `Task.status` e `Task.priority`, com os mesmos valores do schema Zod, vindos de uma constante única — como `ROLES`
- Referência entre entidades por `ObjectId`, com o nome do campo terminando em `Id`

## Anti-padrões

| Anti-padrão | Por quê |
|---|---|
| Lógica dentro da definição de rota | Rota é roteamento; regra não é testável ali |
| `try/catch` repetido em vez de middleware de erro | Formato de erro diverge entre rotas |
| Retorno de documento Mongoose cru | Vaza `passwordHash` e campos internos |
| String de perfil espalhada pelo código | Erro de digitação vira falha de autorização silenciosa |
| Service importando `req`/`res` | Quebra a camada e impede teste sem HTTP |
| Buscar a tarefa e comparar o dono depois | Um esquecimento em uma rota vira acesso a tarefa alheia |
| `userId` aceito no payload de tarefa | Qualquer pessoa cria tarefa em nome de outra |
