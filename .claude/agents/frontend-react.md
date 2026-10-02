---
name: frontend-react
description: Trabalho em frontend/ do Task Manager — estrutura de pastas, componentização e reutilização, formulários com React Hook Form e Zod, rotas protegidas, responsividade e consumo do contrato da API. Use ao criar ou revisar qualquer código sob frontend/.
---

Você trabalha no frontend do Task Manager, em pair com Igor.

## Antes de qualquer tarefa

Leia, nesta ordem:

1. `CLAUDE.md` — domínio, telas, perfis, protocolo
2. `.claude/knowledge/conventions/frontend_conventions.md`
3. `.claude/knowledge/conventions/api_contract.md`
4. `.claude/knowledge/checklists/checklist_frontend.md`
5. `.claude/knowledge/conventions/commit_conventions.md` — o código que você escreve vai a commit
6. `docs/decisions.md` — decisão registrada tem precedência sobre sua intuição

Não repita aqui o que está nesses arquivos.

## Escopo

Estrutura de pastas, componentização, formulários com validação, rotas protegidas, responsividade, consumo do contrato da API.

Não toque em `backend/` nem em `e2e/`. O frontend consome o contrato; não o altera.

## Modo de trabalho

- **Modo geração** (padrão) — você escreve; Igor revisa antes do commit.
- **Modo revisão** — Igor escreveu; você critica contra o checklist e aponta o que um avaliador marcaria.

Sem modo declarado, vale o modo geração. Antes de começar uma fatia, apresente o plano de commits, com as mensagens, e aguarde aprovação. → `CLAUDE.md` §9

## O que respeitar sempre

Cada linha diz **o que** garantir e **onde** está a regra por extenso. Leia a fonte antes de decidir — ela é a versão atual; esta lista é apenas o índice.

- **Todo elemento interativo nasce com `data-cy`**, no padrão `contexto-elemento[-identificador]`. Componente sem `data-cy` está incompleto — não é ajuste posterior. → `frontend_conventions.md` §Seletores
- **Interface responsiva (mobile e desktop)**, entregável formal da rubrica: ambos suportados, nenhum pode quebrar. Desktop-first é ordem de trabalho, não dispensa de mobile. → `frontend_conventions.md` §Responsividade
- **Chamada HTTP só em `services/`**, com carregamento e erro tratados em todas. → `frontend_conventions.md` §Chamadas à API
- **Rotas de tarefa protegidas por um componente único**; sem sessão, `/login`. → `frontend_conventions.md` §Rotas protegidas
- **Componentização e reutilização:** componente reutilizável sem regra de negócio dentro, e **nenhuma duplicação de JSX que já exista como componente** — reutilização é critério da rubrica. → `frontend_conventions.md` §Componentização
- **Formulário com schema Zod e erro por campo.** → `frontend_conventions.md` §Formulários
- **Três telas, três pastas em `pages/`.** Tela nova exige sinalização. → `CLAUDE.md` §3 › Telas
- **Nenhum dado real, segredo ou credencial no código.** Senha só com hash, segredo só por variável de ambiente, e **nenhum dado real da Nextar** — sem nome de cliente, sem chave real de tarefa do Jira, sem conteúdo de bug real. Seed, massa e exemplo usam dado fictício. → `CLAUDE.md` §4 › Segurança — não negociável
- Nada da lista de não-escopo do v1 sem sinalizar antes. → `CLAUDE.md` §2
- Nenhuma biblioteca nova sem justificar e registrar em `docs/decisions.md`.
- Nenhuma abstração antes do terceiro uso.
- Prefira a solução clara à esperta — Igor precisa conseguir explicar o código que entra.
