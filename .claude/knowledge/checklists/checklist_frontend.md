# Checklist — Frontend

Aplicar a qualquer diff que toque `frontend/**`. Base: `conventions/frontend_conventions.md` e `conventions/api_contract.md`.

## Estrutura

- [ ] Cada tela tem sua pasta em `pages/`
- [ ] Nenhuma tela nova além das três previstas, sem sinalização
- [ ] Componentes reutilizáveis em `components/`, sem regra de negócio dentro

## Camadas (CRITICAL)

- [ ] Nenhuma chamada HTTP fora de `services/`
- [ ] Nenhuma regra de negócio dentro de componente reutilizável

## Seletores

- [ ] **Todo elemento interativo novo tem `data-cy`**
- [ ] Padrão `contexto-elemento[-identificador]`, kebab-case
- [ ] Identificador dinâmico usa o `_id` da tarefa, não índice de posição

## Formulários

- [ ] React Hook Form com schema Zod de `schemas/`
- [ ] Erro exibido por campo, não em bloco único
- [ ] Sem validação manual paralela ao schema

## Estados de chamada

- [ ] Estado de carregamento tratado em toda chamada à API
- [ ] Estado de erro tratado em toda chamada à API
- [ ] Mensagem ao usuário vem do `message`; a lógica consome o `code`
- [ ] `401` encerra a sessão e leva ao `/login`

## Rotas protegidas

- [ ] Rota de tarefa sem sessão redireciona para `/login`
- [ ] Proteção num componente de rota único, não repetida por página
- [ ] `404` na tela de edição exibe "tarefa não encontrada"

## Estilo

- [ ] Estilo de componente e de tela em `.module.css` ao lado do `.jsx`
- [ ] `src/index.css` só com tokens e reset
- [ ] Cor, espaçamento e medida repetida vêm de token, não de valor solto entre módulos

## Responsividade

- [ ] **Responsividade:** a interface é utilizável em mobile e desktop, sem quebra de layout nem conteúdo inacessível — critério de avaliação do PDI
- [ ] Lista de tarefas sem rolagem horizontal em mobile para chegar a uma ação
- [ ] Layout reflui de verdade; sem `overflow` escondendo conteúdo

## Idioma

- [ ] Identificadores e componentes em inglês
- [ ] Texto de interface em português
- [ ] Sem mistura dentro do mesmo identificador

## Qualidade

- [ ] Nenhum componente fazendo trabalho demais para ser testado isoladamente
- [ ] Sem prop drilling profundo onde caberia contexto
- [ ] Sem `useEffect` para valor derivável no render
- [ ] Nenhuma abstração criada antes do terceiro uso
- [ ] Token em `localStorage` — se houver, tem entrada em `docs/decisions.md`
