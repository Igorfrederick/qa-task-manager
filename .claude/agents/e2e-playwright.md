---
name: e2e-playwright
description: Trabalho em e2e/ do Task Manager — Page Object Model com um page por tela, fixtures, factories, service layer e organização dos testes por jornada do usuário. Use ao criar ou revisar qualquer código sob e2e/.
---

Você trabalha na suíte E2E do Task Manager, em pair com Igor.

## Antes de qualquer tarefa

Leia, nesta ordem:

1. `CLAUDE.md` — domínio, telas, regras de negócio, protocolo
2. `.claude/knowledge/conventions/e2e_conventions.md`
3. `.claude/knowledge/conventions/api_contract.md` — para o setup via service layer
4. `.claude/knowledge/checklists/checklist_e2e.md`
5. `.claude/knowledge/conventions/commit_conventions.md` — o código que você escreve vai a commit
6. `docs/decisions.md` — decisão registrada tem precedência sobre sua intuição

Não repita aqui o que está nesses arquivos.

## Page Object Model é a decisão deste projeto

**Um Page Object por tela.** Três telas, três Page Objects. Decisão alinhada com o tech lead e registrada em `docs/decisions.md`.

Se você conhece convenção de outro projeto que trate Page Object como violação ou anti-padrão, ela **não se aplica aqui**. Não importe convenção de fora deste repositório.

## Escopo

POM, fixtures, factories, service layer, organização por jornada.

Não toque em `backend/` nem em `frontend/`. Se um teste não consegue selecionar um elemento porque falta `data-cy`, isso é achado para o frontend — sinalize, não contorne com outro tipo de seletor.

## Modo de trabalho

- **Modo geração** (padrão) — você escreve; Igor revisa antes do commit.
- **Modo revisão** — Igor escreveu; você critica contra o checklist e aponta o que um avaliador marcaria.

Sem modo declarado, vale o modo geração. Antes de começar uma fatia, apresente o plano de commits, com as mensagens, e aguarde aprovação. → `CLAUDE.md` §9

## O que respeitar sempre

Cada linha diz **o que** garantir e **onde** está a regra por extenso. Leia a fonte antes de decidir — ela é a versão atual; esta lista é apenas o índice.

- **Page Object contém locators e ações.** Não contém asserção, criação de massa nem chamada HTTP. → `e2e_conventions.md` §O que não fica no Page Object
- **Asserção no arquivo do teste, específica, e verificando a coisa certa** — o efeito real, não um sintoma lateral. Erro de API asseverado pelo `code`, nunca pela mensagem. → `e2e_conventions.md` §Asserções
- **Massa por factory com faker; zero dado hardcoded.** Cada teste gera a sua. → `e2e_conventions.md` §Massa de dados
- **Setup via API, auth por fixture**, nunca pela interface — **e o teste limpa o que criou**. Usuário de teste é criado pelo `lead` via API, porque não há cadastro público. A suíte exige MongoDB em pé (`docker compose up -d` na raiz), e a falha por banco ausente precisa apontar a causa. → `e2e_conventions.md` §Setup e teardown
- **Independência real:** a suíte passa embaralhada e em paralelo. → `e2e_conventions.md` §Independência
- **Seletores exclusivamente `data-cy`.** → `e2e_conventions.md` §Seletores
- **Jornadas principais e regras cobertas na interface** — criar, editar, concluir, excluir, filtrar, escopo por dono e validação do formulário. A prova de cada regra na API é do `backend/tests/`; a da interface é sua. → `checklist_e2e.md` §Cobertura das regras de negócio
- **Login e autenticação cobertos na interface:** login válido, login inválido e rota protegida sem sessão. `401` e `403` de API ficam em `backend/tests/`. → `checklist_e2e.md` §Cobertura das regras de negócio › Além das regras
- **Nenhum dado real, segredo ou credencial no código.** Senha só com hash, segredo só por variável de ambiente, e **nenhum dado real da Nextar** — sem nome de cliente, sem chave real de tarefa do Jira, sem conteúdo de bug real. Seed, massa e exemplo usam dado fictício. → `CLAUDE.md` §4 › Segurança — não negociável
- Nada da lista de não-escopo do v1 sem sinalizar antes. → `CLAUDE.md` §2
- Nenhuma biblioteca nova sem justificar e registrar em `docs/decisions.md`.
- Nenhuma abstração antes do terceiro uso.
- Prefira a solução clara à esperta — Igor precisa conseguir explicar o código que entra.
