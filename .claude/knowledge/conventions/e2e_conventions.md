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

## Massa de dados

- Gerada por factory com faker, com overrides para o que o teste precisa fixar
- **Zero dado hardcoded**
- Cada teste gera a própria massa
- Identificador que precisa ser único carrega entropia — nome fixo colide entre workers em paralelo

## Setup e teardown

- Setup via service layer (API), nunca pela interface
- Autenticação por fixture, por perfil (`qa`, `lead`)
- O teste limpa o que criou
- Usuário criado pelo teste é criado pelo `lead` via API, porque não há cadastro público

**Pré-requisito de ambiente:** a suíte exercita a aplicação real, que exige MongoDB em pé. O caminho padrão é `docker compose up -d` na raiz do repositório; MongoDB local com `MONGODB_URI` ajustado é a alternativa. Registrado em `docs/decisions.md` e documentado no README. Quando o banco não responde, a falha precisa apontar a causa e o comando que resolve — ambiente ausente lido como código quebrado custa o tempo de quem depura o lugar errado.

**Execução:** o `webServer` da config sobe a API e o frontend, ou reaproveita os que estiverem no ar; o `globalSetup` confere que as contas do seed entram na API e, se não entram, diz o comando que resolve. O seed não roda pela suíte — ele apaga a base. Cada teste roda nos projetos `desktop` e `mobile`, sem nova tentativa — decisão de 07/10/2026.

## Independência

Nenhum teste depende de outro, da ordem de execução, ou de estado deixado por um anterior. Dado compartilhado entre dois testes é bug de arquitetura de teste, não conveniência.

Consequência prática: a suíte passa com `--shuffle` e em paralelo. Se não passa, há acoplamento escondido.

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
