# Checklist — Critérios de avaliação do PDI

Usado pelo `revisor-pdi` para ler o repositório inteiro com os olhos de quem vai avaliar no GitHub.

Os itens abaixo derivam da tabela de critérios da seção 1 do `CLAUDE.md`, que é a transcrição da rubrica formal do PDI para as etapas 1 a 3.

> Se a rubrica formal divergir deste arquivo, a rubrica vence e este arquivo é corrigido.

## Convenção de marcação

| Marca | Significado |
|---|---|
| `- [ ]` | Deveria estar pronto e não está, ou não foi verificado |
| `- [x]` | Verificado e conforme |
| `[pendente: Passo N]` | Depende de etapa futura do projeto; **não é falha** |

Os passos estão em `docs/handoff.md`: 2 backend, 3 frontend, 4 E2E, 5 entrega. Quando um passo fecha, os marcadores dele saem, e o item passa a ser lido como pronto ou não — na entrega, nenhum item carrega marcador.

A distinção importa: item que depende de passo futuro não é a mesma coisa que item que deveria estar pronto e não está. Um report que não separa os dois vira ruído e deixa de ser lido.

---

## Frontend

Critério: estrutura de pastas, componentização e reutilização, boas práticas, interface responsiva (mobile e desktop), formulários com validação, tela de login integrada com o backend.

- [ ] Estrutura de pastas corresponde à seção 6 do `CLAUDE.md`
- [ ] Uma pasta por tela em `pages/` — três telas
- [ ] Componentes reutilizáveis existem e são de fato reutilizados
- [ ] Nenhuma duplicação de JSX que já exista como componente
- [ ] **Formulários com validação por schema** — login e tarefa
- [ ] **Tela de login integrada com o backend**, consumindo `POST /auth/login`
- [ ] **Interface responsiva: utilizável em mobile e desktop**, sem quebra de layout nem conteúdo inacessível
- [ ] Estados de carregamento e erro tratados
- [ ] Nenhum elemento interativo sem `data-cy`

## Backend

Critério: API REST funcional, arquitetura em camadas, JWT correto, middleware de validação e autorização, conexão com MongoDB, hash de senhas, variáveis de ambiente, modelagem de dados.

- [ ] **API REST funcional** — todas as rotas do contrato respondendo
- [ ] Separação de camadas visível na estrutura e respeitada no código
- [ ] Controller sem regra, service sem `req`/`res`, model sem service
- [ ] JWT com geração **e** validação corretas, expiração definida
- [ ] **Middleware de validação** aplicado antes do service — corpo, query e parâmetro
- [ ] **Middleware de autorização por perfil** em toda rota marcada `[lead]`
- [ ] **Escopo por dono** no service, com `404` para tarefa alheia
- [ ] **Conexão com MongoDB** isolada em `config/`, URI por env, falha tratada
- [ ] Senha com bcrypt; `passwordHash` nunca exposto; o login completa a verificação
- [x] Segredos exclusivamente por variável de ambiente
- [x] `.env.example` presente e completo, com valores fictícios
- [ ] Modelagem coerente com as regras — `User.email` único, índice em `Task.userId`, enums de status e prioridade
- [ ] Formato de erro único, com `code` e status HTTP adequado

## E2E

Critério: suíte cobrindo login e autenticação, suíte cobrindo funcionalidades principais, testes isolados de backend, organização por feature ou jornada, qualidade dos seletores, asserções específicas, independência entre testes, setup e teardown apropriados.

- [ ] **Suíte cobrindo login e autenticação**, incluindo acesso negado por perfil
- [ ] **Suíte cobrindo as funcionalidades principais:** CRUD de tarefas, conclusão, filtros, escopo por dono
- [ ] **Testes isolados de backend** em `backend/tests/` — service e API, sem navegador
- [ ] **Organização por feature ou jornada** do usuário
- [ ] Um Page Object por tela — três
- [ ] Seletores exclusivamente `data-cy`
- [ ] Asserções específicas, no arquivo do teste
- [ ] Cobertura das regras de negócio, na API e na interface, conforme `checklist_e2e.md`
- [ ] **Independência entre testes** — sem dependência de ordem ou de estado
- [ ] **Setup e teardown apropriados** — setup via API, teardown limpando o que criou

## Entrega

Não é linha da rubrica das etapas 1 a 3, mas é condição para o avaliador conseguir ler e subir o projeto.

- [ ] **Código executável** — o projeto sobe seguindo apenas o README
- [ ] README com setup, seed e execução das três frentes
- [ ] Seed com dado fictício — um `lead` e dois `qa`, com tarefas
- [ ] Tabela no README mapeando cada critério das etapas 1 a 3 ao lugar no repositório
- [ ] Organização geral coerente entre as três frentes

## Transversais

Verificáveis desde já, em qualquer estágio.

- [ ] Nenhum dado real da Nextar: nome de cliente, chave real de tarefa, conteúdo de bug real, código copiado de repositório privado
- [ ] Nenhum segredo commitado
- [ ] Identificadores de código em inglês, sem mistura de idioma dentro do identificador
- [ ] `docs/decisions.md` cobre as decisões relevantes, em ordem cronológica inversa
- [ ] Decisão alinhada com outra pessoa registra nome, papel e data
- [ ] Decisão revista tem entrada nova declarando o que substitui, em vez de edição da anterior
- [ ] Histórico de commits coerente com `conventions/commit_conventions.md`
- [ ] Nenhum `.gitkeep` remanescente em pasta que já tem arquivo real
- [ ] Nada da lista de não-escopo do v1 implementado
- [ ] Alteração na rubrica do PDI, na tabela de critérios da seção 1 ou em `docs/decisions.md` propagou para `.claude/knowledge/` **e** `.claude/agents/`
- [ ] Nenhum checklist virou paráfrase da convenção que verifica
