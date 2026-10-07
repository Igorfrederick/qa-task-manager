# Checklist — E2E

Aplicar a qualquer diff que toque `e2e/**`. Base: `conventions/e2e_conventions.md`.

> Page Object Model é a decisão deste projeto, registrada em `docs/decisions.md`. Page Object **não** é violação aqui.

## Camadas (CRITICAL)

- [ ] Nenhum Page Object contém asserção
- [ ] Nenhum Page Object cria massa de dados
- [ ] Nenhum Page Object faz chamada HTTP
- [ ] Um Page Object por tela — sem page de componente nem de fluxo
- [ ] Setup por API (service layer), nunca pela interface

## Seletores

- [ ] Exclusivamente `data-cy`, por `getByTestId` — a config aponta o test id para `data-cy`
- [ ] Nenhum seletor por classe CSS, texto visível, posição no DOM ou hierarquia de tags

## Asserções

- [ ] Vivem no arquivo do teste, não no Page Object
- [ ] **Verificam a coisa certa** — o efeito real, não um sintoma lateral
- [ ] Específicas: valor esperado, não `toBeVisible()` genérico
- [ ] Todo fluxo termina em asserção
- [ ] Erro de API asseverado por `code`, nunca por mensagem em português

## Massa de dados

- [ ] Gerada por factory com faker
- [ ] **Zero dado hardcoded**
- [ ] Cada teste gera a própria massa
- [ ] Identificador que precisa ser único carrega entropia — sem nome fixo que colida entre workers

## Independência

- [ ] Nenhum teste depende de outro
- [ ] Nenhum teste depende da ordem de execução
- [ ] Nenhum dado compartilhado entre testes
- [ ] A suíte passa com `--repeat-each` em paralelo e com `--workers=1` — o Playwright não tem `--shuffle`
- [ ] Nenhuma asserção conta as linhas da lista inteira: as contas do seed são compartilhadas entre testes em paralelo

## Setup e teardown

- [ ] Autenticação por fixture, por perfil — `test.use({ role })`, sem login pela tela fora dos testes de login
- [ ] Nenhum usuário criado pelo teste
- [ ] Page objects injetados por fixture, sem herança de BasePage
- [ ] O teste limpa o que criou

## Determinismo

- [ ] Nenhum `waitForTimeout`
- [ ] Sem `if/else` no caminho principal do teste
- [ ] Sem dependência de dado pré-existente no ambiente, além das contas do seed, que o `globalSetup` confere
- [ ] Exclusão pela tela aceita o diálogo de confirmação dentro da ação do Page Object, registrado antes do clique

## Cobertura das regras de negócio

Caminho de erro tem o mesmo peso do caminho feliz. Cada regra tem prova na API, em `backend/tests/`, no mesmo commit da regra; a suíte E2E prova o que o usuário vê.

| # | Regra | Prova na API (`backend/tests/`) | Prova na interface (`e2e/`) |
|---|---|---|---|
| 1 | Validação de tarefa | Criar sem `title`, ou com `status`/`priority` fora do domínio → `400` com `VALIDATION_ERROR` e o campo em `details`; filtro inválido → `400` | Salvar com título vazio exibe o erro no campo, e a API confirma que nada foi criado |
| 2 | Escopo por dono | `qa` lê, edita e exclui tarefa de outra pessoa → `404` com `TASK_NOT_FOUND`, e a tarefa permanece intacta; `lead` faz o mesmo → sucesso | `qa` abrindo `/tasks/:id` de outra pessoa vê "tarefa não encontrada"; a lista do `qa` não mostra tarefa alheia |
| 3 | Dono vem do token | Criar com `userId` de outra pessoa no payload → a tarefa nasce com o dono do token | — |
| 4 | E-mail único | Cadastrar e-mail já existente → `409` com `EMAIL_TAKEN`, e nenhum usuário a mais | — |

A regra 3 não é violação: o que se verifica é o dono da tarefa criada, não um erro.

### Jornadas — funcionalidades principais

- [ ] Criar tarefa — aparece na lista com título, prioridade e status
- [ ] Editar tarefa — a lista mostra o valor novo
- [ ] Concluir e reabrir tarefa — o status da linha muda, e a API confirma
- [ ] Excluir tarefa — some da lista, e a API responde `404` para ela
- [ ] Filtrar por status e por prioridade — só as tarefas do filtro aparecem
- [ ] O `lead` vê na lista a tarefa criada por um `qa`, com o nome do dono

### Além das regras

Autenticação e autorização são critério próprio da rubrica e ficam fora da tabela.

- [ ] Login com credenciais válidas leva a `/tasks` (E2E)
- [ ] Login com credencial inválida permanece em `/login` com o erro exibido (E2E); na API, e-mail inexistente e senha errada respondem igual (`backend/tests/`)
- [ ] Rota protegida sem sessão redireciona para `/login` (E2E)
- [ ] Token ausente ou inválido responde `401`, distinto do `403` (`backend/tests/`)
- [ ] `qa` tentando criar conta responde `403` (`backend/tests/`)
- [ ] Erro da API asseverado pelo `code`, nunca pela mensagem em português; erro de validação do formulário, sem `code`, pelo texto do campo
