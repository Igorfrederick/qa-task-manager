# Task Manager

Contexto base do projeto. Este arquivo é lido por todos os agentes antes de qualquer tarefa. Regras aqui valem sobre qualquer preferência padrão do agente.

---

## 1. O que é este projeto

Gerenciador de tarefas de um time de QA: cada pessoa mantém as próprias tarefas; o líder enxerga as de todo o time e cria as contas.

Este repositório é o entregável das **etapas 1, 2 e 3** de um PDI — frontend, backend e E2E. O domínio é deliberadamente pequeno: a aplicação é o veículo para demonstrar as competências técnicas, não um produto. As etapas 4 (análise de oportunidade) e 5 (aplicação da solução com IA) vivem fora daqui.

### Por que isso importa para quem escreve código aqui

O projeto é avaliado por **análise do código no GitHub**, não pelo produto rodando. Os critérios declarados são:

| Frente | Critérios de avaliação |
|---|---|
| Frontend | Estrutura de pastas, componentização e reutilização, boas práticas, interface responsiva (mobile e desktop), formulários com validação, tela de login integrada com o backend |
| Backend | API REST funcional, arquitetura em camadas, JWT correto (geração e validação), middleware de validação e autorização, conexão com MongoDB, hash de senhas, variáveis de ambiente, modelagem de dados |
| E2E | Suíte cobrindo login e autenticação, suíte cobrindo funcionalidades principais, testes isolados de backend, organização por feature ou jornada, qualidade dos seletores, asserções específicas, independência entre testes, setup e teardown apropriados |

Esta tabela é a transcrição da rubrica formal do PDI para as etapas 1 a 3. Onde ela divergir da rubrica, a rubrica vence e esta tabela é corrigida — ela é a fonte dos critérios por frente de `checklists/checklist_pdi.md`, que acrescenta a eles uma seção de entrega e uma de transversais próprias.

Além dos critérios por frente, o avaliador precisa conseguir subir e ler o projeto: código executável seguindo apenas o README, seed com dado fictício, organização coerente entre as três frentes.

---

## 2. Escopo

Escopo congelado para a entrega de **09/10/2026**. A régua é a aplicação mínima que produz evidência de cada critério da seção 1 — o que não gera evidência de critério não entra.

### v1 — o que entra

- Login com JWT e dois perfis (`qa` e `lead`), com autorização por rota e por dono do recurso
- Criação de conta restrita ao líder, sem cadastro público
- CRUD de tarefas, com conclusão e filtro por status e prioridade na listagem
- O líder enxerga e gerencia as tarefas de todo o time; o QA, só as próprias

### v1 — o que **não** entra

Não implementar, mesmo que pareça natural:

- Tela de cadastro ou cadastro público de usuário
- Recuperação de senha, OAuth, refresh token
- Atribuir tarefa a outra pessoa, comentários, subtarefas, anexos
- Data de vencimento, lembretes, notificações, e-mail, websockets, tempo real
- Paginação, ordenação configurável, busca textual
- Kanban, drag-and-drop, dashboard, gráficos
- Qualquer uso de LLM ou IA — a IA do PDI vive na etapa 5, fora deste repositório
- Multi-tenant, billing

Se uma tarefa exigir algo desta lista, pare e sinalize antes de implementar.

---

## 3. Domínio

### Entidades

```
User  1 ── n  Task
```

| Entidade | Campos principais |
|---|---|
| `User` | name, email (único), passwordHash, role (`qa` \| `lead`) |
| `Task` | title, description, status (`open` \| `done`), priority (`low` \| `medium` \| `high`), userId (dono), createdAt, updatedAt |

### Perfis e permissões

| Ação | QA | Líder |
|---|---|---|
| Entrar e consultar o próprio perfil | ✅ | ✅ |
| Criar, ler, editar, concluir e excluir as próprias tarefas | ✅ | ✅ |
| Ler, editar, concluir e excluir tarefas de outras pessoas | ❌ | ✅ |
| Criar conta de usuário | ❌ | ✅ |

### Regras de negócio

Toda regra que falha tem que falhar com erro claro e status HTTP adequado. A regra 3 é a exceção — não é violação, e se testa observando o comportamento.

**O critério de classificação é a dependência de estado**, registrado em `docs/decisions.md`. Invariante de entrada — o que se julga olhando apenas o payload — valida por schema no middleware e retorna `400`. Invariante de domínio — o que só se julga consultando o estado do sistema — valida no service: `409` quando o estado impede a operação, `404` quando o recurso não existe para quem pede.

| # | Regra | Camada | Status |
|---|---|---|---|
| 1 | `title` obrigatório; `status` e `priority` só aceitam os valores do domínio — no corpo e nos filtros da listagem | Validação | `400` |
| 2 | O `qa` só alcança as próprias tarefas: tarefa de outra pessoa responde como inexistente | Service | `404` |
| 3 | O dono de uma tarefa é quem a cria — `userId` vem do token, nunca do payload | Service | — (sem erro) |
| 4 | E-mail único entre usuários | Service | `409` |

Corpo do erro de validação:

```json
{ "error": { "code": "VALIDATION_ERROR", "message": "...", "details": [{ "field": "title", "issue": "..." }] } }
```

**Regras `400` asserem `VALIDATION_ERROR` mais o campo em `details`, não um `code` próprio. Regras `404` e `409` têm `code` específico da violação.**

A regra 3 não falha: um `userId` enviado no payload é descartado, e a tarefa nasce com o dono do token. Não tem `code` de catálogo, e se testa observando o dono da tarefa criada, não violando.

**Autenticação e autorização** são critério próprio da rubrica e ficam fora da tabela: token ausente ou inválido responde `401`; credencial inválida no login responde `401` sem revelar se errou o e-mail ou a senha; perfil autenticado sem permissão responde `403`. Os `code`s dessa família estão em `api_contract.md` §Catálogo de `code`s.

### Telas

| Tela | Rota | Observação |
|---|---|---|
| Login | `/login` | — |
| Lista de tarefas | `/tasks` | Filtro por status e prioridade; ações por linha: concluir ou reabrir, editar, excluir. O líder vê também o dono de cada tarefa. `/` redireciona para cá |
| Formulário de tarefa | `/tasks/new` e `/tasks/:id` | Mesma tela para criar e editar |

Três telas, três Page Objects. Não criar tela nova sem sinalizar.

---

## 4. Stack

- **Frontend:** React + Vite, React Router, React Hook Form + Zod
- **Backend:** Node.js + Express (ESM), MongoDB + Mongoose, JWT, bcrypt, Zod; testes com Vitest + supertest
- **E2E:** Playwright + TypeScript
- **Banco local:** MongoDB via `docker-compose.yml` na raiz
- **Idioma:** identificadores de código, entidades e campos em **inglês**; textos de interface em **português**. Sem mistura dentro de um mesmo identificador.

### Segurança — não negociável

- Senha sempre com hash (bcrypt). Nunca em texto puro, nunca em log, nunca em resposta de API.
- Segredos só via variável de ambiente. Nenhum valor real commitado; `.env.example` com chaves e valores fictícios.
- Nenhum dado real no repositório: sem nome de cliente, sem chave real de tarefa do Jira, sem conteúdo de bug real, nada copiado de repositório privado da Nextar. Seed usa dado fictício. Trate o repositório como público.

---

## 5. Convenções — base de conhecimento

As convenções detalhadas vivem em `.claude/knowledge/`, fonte única lida por todos os agentes. Este arquivo permanece como camada de contexto: domínio, escopo, telas, perfis, regras de negócio e protocolo de trabalho.

### Convenções

| Arquivo | Cobre |
|---|---|
| `conventions/backend_conventions.md` | Camadas, JWT, bcrypt, env, erros, modelagem |
| `conventions/frontend_conventions.md` | Estrutura, componentização, formulários, responsividade, `data-cy` |
| `conventions/e2e_conventions.md` | POM, fixtures, factories, service layer, independência |
| `conventions/api_contract.md` | Rotas, formato de erro, códigos, status HTTP |
| `conventions/commit_conventions.md` | Tipos, critério de corte, branches, `.gitkeep` |

### Checklists

| Arquivo | Usado por |
|---|---|
| `checklists/checklist_backend.md` | `backend-api`, `code-reviewer` |
| `checklists/checklist_frontend.md` | `frontend-react`, `code-reviewer` |
| `checklists/checklist_e2e.md` | `e2e-playwright`, `code-reviewer` |
| `checklists/checklist_pdi.md` | `revisor-pdi` |

Os checklists são a **forma executável** das convenções: a lista item a item que o reviewer percorre e marca no scorecard. Checklist que virar paráfrase da convenção é removido, não mantido.

**Regra de propagação:** alteração na rubrica do PDI, na tabela de critérios da seção 1 ou em `docs/decisions.md` exige verificar a propagação para `.claude/knowledge/` **e** `.claude/agents/`, no mesmo commit. Quem verifica é o `code-reviewer`, no BLOCO 9, e o `revisor-pdi`, na varredura do repositório.

### Dois pontos que não saem daqui

**Seletores.** Todo elemento com o qual o teste interage carrega `data-cy`, no padrão `contexto-elemento[-identificador]`, kebab-case. Componente novo sem `data-cy` está incompleto. Detalhe em `frontend_conventions.md`.

**Page Object Model, um Page Object por tela.** Decisão alinhada com o tech lead em 15/09/2026, registrada em `docs/decisions.md`. Três telas, três Page Objects. Convenção de outro projeto que trate Page Object como violação não se aplica aqui. Detalhe em `e2e_conventions.md`.

---

## 6. Estrutura de pastas

```
backend/
  src/
    config/          conexão, variáveis de ambiente
    models/          schemas Mongoose
    routes/          definição de rotas
    controllers/     entrada/saída HTTP, sem regra de negócio
    services/        regra de negócio
    middlewares/     auth, autorização por perfil, validação, erro
    validators/      schemas Zod de request
    utils/
    seed/            dado fictício para desenvolvimento e E2E (npm run seed)
  tests/             testes automatizados de service e API, sem UI

frontend/
  src/
    pages/           uma pasta por tela
    components/      componentes reutilizáveis, sem regra de negócio
    hooks/
    services/        cliente HTTP
    schemas/         schemas Zod de formulário
    contexts/        auth
    utils/

e2e/
  tests/             organizados por jornada do usuário
  pages/             Page Objects, um por tela
  fixtures/
  factories/
  services/
  support/

.claude/
  agents/            cinco agentes
  knowledge/         convenções e checklists

docs/
  decisions.md       log de decisões técnicas
  handoff.md         estado do projeto e ordem de execução
```

**Regra de camada no backend:** controller não contém regra de negócio; service não conhece `req`/`res`; model não conhece service. Violação disso é o erro mais visível na avaliação de "arquitetura em camadas".

---

## 7. Agentes

Cinco agentes em `.claude/agents/`. A divisão é por **unidade de análise e momento**, não por assunto.

| Agente | Analisa | Quando | Escreve código? |
|---|---|---|---|
| `backend-api` | Código em construção em `backend/` | Durante o trabalho, em pair | Sim |
| `frontend-react` | Código em construção em `frontend/` | Durante o trabalho, em pair | Sim |
| `e2e-playwright` | Código em construção em `e2e/` | Durante o trabalho, em pair | Sim |
| `code-reviewer` | O **diff** de um PR, nas três frentes e na documentação | Antes do merge | Não |
| `revisor-pdi` | O **repositório inteiro** contra a rubrica | Antes da entrega | Não |

Todos os agentes leem `.claude/knowledge/` como fonte única de convenção, cada um os arquivos da sua frente. O `code-reviewer` carrega adicionalmente seu próprio procedimento de revisão — os dez blocos —, que é comportamento do agente, não convenção do projeto.

---

## 8. Log de decisões

Toda decisão técnica relevante vai para `docs/decisions.md`, uma entrada curta:

```
## [data] Título da decisão
**Decisão:** o que foi decidido
**Motivo:** por quê
**Alternativa descartada:** o que não foi escolhido e por quê
**Substitui:** qual entrada anterior esta revisa — apenas quando for o caso
```

Decisão revista **nunca é apagada**: entra entrada nova declarando o que substitui. O erro e a correção são ambos parte do registro.

**Ordem cronológica inversa** — entrada mais recente no topo.

Quando a decisão foi alinhada com outra pessoa, registrar nome, papel e data do alinhamento.

---

## 9. Protocolo de trabalho com os agentes

Protocolo enxuto para o prazo de 09/10/2026 — motivo em `docs/decisions.md`.

- **Modo geração** (padrão) — o agente escreve; Igor revisa antes do commit.
- **Modo revisão** — Igor escreve; o agente critica contra os critérios da seção 1 e aponta o que um avaliador marcaria.

Sem modo declarado, vale o modo geração.

**Plano por fatia.** Antes de começar uma fatia, o agente apresenta o plano de commits, com as mensagens, e aguarda aprovação. Dentro da fatia aprovada, não pede nova aprovação a cada arquivo.

**Orçamento de revisão.** Uma passada do `code-reviewer` por PR; nova rodada só se houver achado CRITICAL ou HIGH. O `revisor-pdi` roda uma vez, antes da entrega.

**Orçamento de contexto.** Perto de 50% da janela de contexto, o agente para no próximo ponto seguro — entre commits, nunca no meio de um —, informa o consumo estimado e pede uma decisão: seguir na sessão, compactar com `/compact`, ou encerrar e retomar numa sessão nova. Antes de encerrar, atualiza `docs/handoff.md` com o estado do trabalho: branch, último commit, o que está em andamento e o próximo passo. Acima de 50%, cresce o risco de o agente perder ou inventar detalhe do que já foi decidido. O consumo exato aparece no comando `/context` do Claude Code; agente executado como subagente informa o consumo no próprio retorno, e quem o chamou leva a decisão ao usuário.

Regras permanentes para qualquer agente neste repositório:

1. Não implementar nada da lista de não-escopo (seção 2) sem sinalizar antes.
2. Não introduzir biblioteca nova sem justificar e registrar em `docs/decisions.md`.
3. Preferir a solução clara à solução esperta — Igor precisa conseguir explicar o código que entra.
4. Não criar abstração antes do terceiro uso.
5. Todo componente interativo nasce com `data-cy`.
6. Nenhum dado real, segredo ou credencial no código.

---

## 10. Decisões em aberto

Confirmar antes de implementar a parte correspondente:

- **Armazenamento do token no frontend** — `localStorage` exige entrada em `docs/decisions.md` (anti-padrão em `frontend_conventions.md`). Pesa na escolha que o `storageState` do Playwright, usado na autenticação por fixture, guarda `localStorage` mas não `sessionStorage`
- **Abordagem de estilo do frontend** — CSS Modules, nativo do Vite, dispensa biblioteca nova
