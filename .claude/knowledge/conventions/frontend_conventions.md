# Convenções — Frontend

Fonte única para qualquer trabalho em `frontend/`.

## Estrutura

```
pages/        uma pasta por tela
components/   componentes reutilizáveis, sem regra de negócio
hooks/
services/     cliente HTTP; única camada que fala com a API
schemas/      schemas Zod de formulário
contexts/     auth
utils/
```

São três telas, três pastas em `pages/`. Tela nova exige sinalização antes.

## Componentização

- Componente em `components/` é reutilizável e **não** carrega regra de negócio
- Regra de negócio vive na página ou em hook, nunca dentro do componente genérico
- JSX que já existe como componente não é reescrito — duplicação de marcação é achado
- **Abstração só no terceiro uso.** Dois lugares parecidos não justificam componente genérico

## Formulários

- React Hook Form com schema Zod de `schemas/`
- Erro exibido por campo, não em bloco único no topo
- O schema é a fonte da validação; validação manual paralela ao schema é achado

## Chamadas à API

- Exclusivamente por `services/`. `fetch` ou cliente HTTP dentro de componente é quebra de camada
- Toda chamada trata **carregamento** e **erro**, não só o caminho feliz
- O erro exibido ao usuário vem do `message` da API; o `code` é o que a lógica consome
- `401` em qualquer chamada encerra a sessão e leva ao `/login`

## Rotas protegidas

- `/tasks`, `/tasks/new` e `/tasks/:id` exigem sessão; sem ela, redirecionam para `/login`
- A proteção é um componente de rota único, não uma verificação repetida em cada página
- `404` da API na tela de edição exibe "tarefa não encontrada" — é o que o `qa` vê ao abrir a tarefa de outra pessoa

## Responsividade

- **Interface responsiva (mobile e desktop) é entregável formal da rubrica do PDI.** Ambos os alvos são suportados e nenhum dos dois pode quebrar.
- **Desktop-first na ordem de trabalho.** É ordem de design, não dispensa de suporte a mobile.
- Responsividade real, com layout que reflui; `overflow` escondendo conteúdo é achado
- A lista de tarefas não pode exigir rolagem horizontal em mobile para chegar a uma ação: a tabela reflui para cartões, ou as colunas secundárias saem

## Seletores

Todo elemento interativo nasce com `data-cy`. Componente novo sem `data-cy` está incompleto.

Padrão: `contexto-elemento[-identificador]`, kebab-case.

```
login-email-input
login-submit-button
task-list-new-button
task-list-row-{taskId}
task-list-complete-button-{taskId}
task-list-delete-button-{taskId}
task-filter-status-select
task-form-title-input
task-form-save-button
error-toast
```

O identificador dinâmico usa o `_id` da tarefa, não índice de posição — índice muda quando a ordenação ou o filtro mudam.

## Idioma

Identificadores, componentes e campos em inglês; texto de interface em português. Sem mistura dentro de um mesmo identificador.

## Anti-padrões

| Anti-padrão | Por quê |
|---|---|
| Componente de 300 linhas | Faz muitas coisas; nenhuma delas testável isoladamente |
| Prop drilling de quatro níveis | O dado deveria estar em contexto ou ser derivado |
| `useEffect` para valor derivável do render | Cria estado duplicado que dessincroniza |
| Abstração antes do terceiro uso | Generaliza sobre dois exemplos e acerta o formato errado |
| Token em `localStorage` sem justificativa | Decisão de segurança que exige entrada em `docs/decisions.md` |
| Elemento interativo sem `data-cy` | Componente incompleto; quebra a suíte E2E |
