# Convenções — E2E

Fonte única para qualquer trabalho em `e2e/`.

> **Page Object Model, um Page Object por tela.** Decisão registrada em `docs/decisions.md`, alinhada com o tech lead. Convenção de outro projeto que trate Page Object como violação **não se aplica aqui**.

## Estrutura

```
tests/      organizados por jornada do usuário — tests/auth/, tests/tasks/
pages/      Page Objects, um por tela — três telas, três pages
fixtures/   estendem o test base: auth por perfil, pages injetados, cliente de API
factories/  massa com faker e overrides
services/   CRUD HTTP da API
support/
```

## O que fica no Page Object

- Locators, sempre por `data-cy`
- Ações de baixo nível: `fillCredentials()`, `completeTask()`, `clickSave()`
- Navegação para a própria tela
- Aceitar o diálogo nativo de confirmação dentro da ação que o abre: `deleteTask()` registra a aceitação antes do clique. Sem ouvinte, o Playwright descarta o diálogo e nada é excluído — decisão de 07/10/2026

## O que não fica no Page Object

| Preocupação | Onde fica | Motivo |
|---|---|---|
| Asserções | No arquivo do teste | Arrange-Act-Assert precisa estar legível onde o teste está |
| Criação de massa | Factory + service layer | Setup por UI é lento e frágil |
| Autenticação e estado inicial | Fixture | Injeção de dependência, não herança de BasePage |
| Chamadas HTTP | Service layer | Page Object fala com a tela, não com a API |

Page Object que assere, crie massa ou chame a API é quebra de camada — mesma gravidade que controller com regra de negócio no backend.

## Asserções

- Vivem no arquivo do teste, nunca no Page Object
- **Específicas:** verificam o valor esperado, não a mera presença. `toBeVisible()` onde caberia o valor é achado
- Verificam **a coisa certa**: teste de criação confirma o item na lista, não o fechamento do formulário; teste de exclusão confirma pela API que a tarefa não existe mais
- Todo fluxo termina em asserção
- Sobre erro da API, asseveram o `code` — nunca a mensagem em português
- Erro de validação do formulário nasce no frontend e não tem `code`: é asseverado pelo texto do campo, que é o que distingue um erro de outro no mesmo `data-cy`
- **Ausência só depois de uma presença que prove a lista certa na tela.** Ao abrir a lista, ela ainda não chegou; ao trocar de filtro ou agir numa linha, a anterior fica na tela até a resposta. Nos dois casos, um `toHaveCount(0)` sozinho passaria sem provar nada. Abrindo a tela, a presença de uma tarefa do próprio teste vem antes da ausência; depois de trocar de filtro, o sumiço de uma tarefa que o filtro exclui vem antes da presença das que ficam

## Massa de dados

- Gerada por factory com faker (`@faker-js/faker`), com overrides para o que o teste precisa fixar
- **Zero dado hardcoded**
- Cada teste gera a própria massa
- Identificador que precisa ser único carrega entropia — nome fixo colide entre workers em paralelo
- Massa gerada dentro do teste, nunca no título nem no corpo do `describe`: o Playwright carrega o arquivo de novo em cada worker, e título com valor aleatório falha com "Test not found in the worker process"

## Setup e teardown

- Setup via service layer (API), nunca pela interface
- Autenticação por fixture, por perfil: `test.use({ role: 'qa' })` põe no `storageState` o token que a fixture de worker obteve pela API, com as contas do seed — decisão de 07/10/2026
- O teste limpa o que criou, pela fixture `taskApi`: a tarefa criada por ela, ou anotada com `taskApi.track` depois de criada pela tela, sai no teardown, pela API, com o token do perfil que a criou — sem `afterEach` em cada arquivo. Decisão de 07/10/2026
- A suíte não cria usuário: a API não tem rota para excluí-lo, e o teste não teria como limpar o que criou. Quando um teste precisa de "outra pessoa", ela é a outra conta com credencial no `e2e/.env` — para o `qa`, o `lead`
- As contas do seed são compartilhadas entre testes em paralelo: nenhuma asserção conta as linhas da lista inteira, cada uma olha as tarefas do próprio teste, pelo `_id`

**Pré-requisito de ambiente:** a suíte exercita a aplicação real, que exige MongoDB em pé. O caminho padrão é `docker compose up -d` na raiz do repositório; MongoDB local com `MONGODB_URI` ajustado é a alternativa. Registrado em `docs/decisions.md` e documentado no README. Quando o banco não responde, a falha precisa apontar a causa e o comando que resolve — ambiente ausente lido como código quebrado custa o tempo de quem depura o lugar errado.

**Execução:** o `webServer` da config sobe a API e o frontend, ou reaproveita os que estiverem no ar; o `globalSetup` confere que as contas do seed entram na API e, se não entram, diz o comando que resolve. O seed não roda pela suíte — ele apaga a base. Cada teste roda nos projetos `desktop` e `mobile`, sem nova tentativa — decisão de 07/10/2026.

## Independência

Nenhum teste depende de outro, da ordem de execução, ou de estado deixado por um anterior. Dado compartilhado entre dois testes é bug de arquitetura de teste, não conveniência — com uma exceção: as contas do seed, que todos usam e nenhum teste altera, porque cada um só cria e exclui as próprias tarefas. Decisão de 07/10/2026

Consequência prática: a suíte passa em paralelo e em qualquer ordem. Se não passa, há acoplamento escondido. O Playwright não tem `--shuffle`; a prova é `--repeat-each` com `fullyParallel`, que mistura a ordem entre os workers, mais uma rodada com `--workers=1`.

## Seletores

Exclusivamente `data-cy`. Nunca classe CSS, texto visível, posição no DOM ou hierarquia de tags — todos quebram por mudança cosmética.

A config define `testIdAttribute: 'data-cy'`: o Page Object localiza por `getByTestId('login-email-input')`, sem repetir `[data-cy=…]` como string — decisão de 07/10/2026.

## Cobertura

Caminho de erro tem o mesmo peso do caminho feliz. A divisão entre as duas suítes:

- **`backend/tests/`** prova cada regra de negócio e cada status de autenticação na API — é onde a regra nasce, no mesmo commit
- **`e2e/`** prova as jornadas da interface, incluindo os caminhos de erro que o usuário vê

A lista item a item está em `checklists/checklist_e2e.md`.

## Anti-padrões

| Anti-padrão | Por quê |
|---|---|
| `waitForTimeout` | Espera arbitrária; lenta quando passa, instável quando falha |
| Seletor por texto ou classe | Quebra com mudança de copy ou de estilo |
| Teste que depende do anterior | Falha isolado e mascara a causa real |
| Asserção do tipo "algo apareceu" | Passa mesmo quando o comportamento está errado |
| BasePage com herança | Fixture resolve com injeção, sem acoplar a hierarquia |
| Massa hardcoded | Colide em paralelo e cria dependência de estado |
