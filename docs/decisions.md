# Log de decisões técnicas

Registro das decisões tomadas no projeto, na data em que foram tomadas. Existe porque as decisões serão questionadas na avaliação, e resposta escrita na data vale mais do que justificativa reconstruída depois.

Formato de cada entrada: decisão, motivo, alternativa descartada.

**Ordem cronológica inversa** — entrada mais recente no topo. O log cresce ao longo do projeto e a decisão mais nova é a que tem maior chance de ser consultada; nova entrada vai logo abaixo deste cabeçalho.

---

## [07/10/2026] Massa de tarefa do E2E excluída no teardown da fixture, pelo perfil que a criou

**Decisão:** a fixture `taskApi` dá ao teste um `TaskService` por perfil — `taskApi.qa`, `taskApi.lead` —, com o token da sessão do worker. Toda tarefa criada por ele fica anotada, com o perfil que a criou; a tarefa criada pela tela entra na lista por `taskApi.track`, com o `_id` da resposta da criação. No teardown, cada uma é excluída pela API, com o token de quem a criou, e o `404 TASK_NOT_FOUND` de uma tarefa que o próprio teste já excluiu é ignorado — qualquer outra falha, inclusive outro `404`, aparece, sem interromper a exclusão das demais.

**Motivo:** o teardown da fixture roda também quando o teste falha, e nenhum arquivo de teste precisa de `afterEach` para limpar. A exclusão pelo perfil que criou, e não pelo `lead`, que alcança as tarefas do time inteiro, impede que a limpeza dependa da regra de escopo que um teste pode estar provando: se o escopo do `lead` quebrasse, a limpeza por ele falharia em silêncio, com o `TASK_NOT_FOUND` ignorado. O `_id` da tarefa criada pela tela vem da resposta porque o teste precisa dele de qualquer forma, para localizar a linha.

**Alternativa descartada:** `afterEach` em cada arquivo — a mesma limpeza repetida, e esquecida no arquivo seguinte. Limpar tudo pelo `lead` — a limpeza passaria a depender da regra de escopo. Varrer no fim da suíte as tarefas com uma marca no título — apagaria a massa de testes ainda rodando em paralelo. Ouvir as respostas da página para anotar sozinho o que a tela criou — esconderia do leitor do teste o que ele cria.

**Decidido por:** Igor Frederick, em 07/10/2026.

---

## [07/10/2026] Autenticação do E2E por fixture de perfil, com o token da API no `storageState`

**Decisão:** `test.use({ role: 'qa' })` ou `{ role: 'lead' }` escolhe o perfil do teste. Uma fixture de worker entra pela API com as contas do seed, uma vez por worker, e a fixture `storageState` põe o token daquele perfil no `localStorage` antes de a página abrir: o teste começa autenticado, sem passar pela tela de login. A suíte não cria usuário — a massa de cada teste são as tarefas que ele cria e exclui, e as asserções se ancoram no `_id` delas.

**Motivo:** login pela tela em cada teste custaria segundos e acoplaria toda jornada à tela de login, que tem testes próprios. O token no `storageState` é o mesmo estado que o login deixa — a entrada de 07/10 sobre o `localStorage` já contava com isso. Sair na tela só apaga o token do navegador daquele teste: o JWT não tem estado no servidor, e o token do worker segue valendo para os outros. Contas do seed, e não um usuário por teste: a API não tem rota para excluir usuário, e cada teste deixaria um que nenhum teardown remove.

**Alternativa descartada:** projeto de setup do Playwright gravando o `storageState` em arquivo por perfil — token em disco, a ignorar no git, para o que uma fixture de worker faz em memória. Usuário novo por teste, criado pelo `lead` — isolamento maior, ao preço de lixo permanente na base. Login pela tela no `beforeEach` — lento e acoplado à tela de login.

**Consequência registrada:** testes em paralelo dividem as contas do seed, então a lista do `qa` mostra também as tarefas de outros testes. Nenhuma asserção conta as linhas da lista inteira; cada uma olha as tarefas do próprio teste. A linha de `e2e_conventions.md` que previa usuário criado pelo teste passa a dizer que a suíte não cria usuário. A entrada de 07/10 sobre o seed segue valendo: a massa que o teste de escopo cria pelo `lead` é uma tarefa dele, e não um usuário — o caso entre dois `qa` já está provado na API, em `backend/tests/`. O Playwright não tem `--shuffle`: a prova de independência é `--repeat-each` com `fullyParallel`, mais uma rodada com `--workers=1`.

**Decidido por:** Igor Frederick, em 07/10/2026.

---

## [07/10/2026] Massa do E2E com `@faker-js/faker`, na versão 10

**Decisão:** as factories de `e2e/factories/` geram a massa com `@faker-js/faker` 10, com entropia no que precisa ser único. O `engines` da suíte acompanha o do faker: Node 20.19+, 22.13+ ou 23.5+.

**Motivo:** a convenção de E2E pede massa por factory com faker desde 01/10, e `@faker-js/faker` é o pacote mantido. A versão 9, instalada primeiro, tinha alerta alto — GHSA-qxc2-j82w-r537, execução de código por `helpers.fake`, em todas as versões até a 10.4.0. A 10.6, instalada no lugar, está fora da faixa.

**Alternativa descartada:** gerar à mão com `crypto.randomUUID` — resolve a entropia, mas não dá título nem descrição plausíveis de tarefa. Ficar na 9 — com o alerta aberto.

**Decidido por:** Igor Frederick, em 07/10/2026.

---

## [07/10/2026] Suíte E2E: `data-cy` como test id, desktop e celular, e a aplicação subida pelo Playwright

**Decisão:** a config do Playwright define `testIdAttribute: 'data-cy'`, e os Page Objects localizam por `getByTestId`. Cada teste roda em dois projetos, `desktop` (Desktop Chrome) e `mobile` (Pixel 7). O `webServer` sobe a API e o frontend — ou reaproveita os que já estiverem no ar —, e um `globalSetup` confere que as contas do seed entram na API antes do primeiro teste. Banco e seed ficam fora: são pré-requisito documentado no README. O `e2e/.env` é lido por `process.loadEnvFile`, do próprio Node, e não há nova tentativa (`retries: 0`).

**Motivo:** com o test id apontado para `data-cy`, o seletor da convenção é o caminho natural da API do Playwright, e qualquer outro tipo de seletor salta à vista na revisão. Rodar no celular transforma a responsividade, critério da rubrica, em teste, e não só em captura de tela. O `webServer` reduz a execução a um comando depois do seed; o seed fica de fora porque apaga a base. Sem a conferência do `globalSetup`, senha do seed diferente da do `e2e/.env` apareceria como um 401 em cada teste, sem causa. Sem nova tentativa, teste instável aparece como falha, em vez de passar na segunda.

**Alternativa descartada:** `locator('[data-cy=…]')` escrito à mão — o mesmo seletor, repetido como string em cada Page Object. Rodar o seed no `globalSetup` — a suíte apagaria a base de quem a rodasse contra o ambiente de desenvolvimento. `dotenv` — biblioteca para o que o Node já faz desde a versão 20.12. Projeto só desktop — a responsividade ficaria sem prova automatizada.

**Decidido por:** Igor Frederick, em 07/10/2026.

---

## [07/10/2026] Exclusão confirmada pelo diálogo nativo do navegador

**Decisão:** excluir uma tarefa pela lista pede confirmação por `window.confirm`, antes da chamada à API. No E2E, a ação de excluir do Page Object registra a aceitação do diálogo antes do clique.

**Motivo:** a exclusão não tem volta, e a confirmação evita a perda por toque acidental — no celular, os botões da linha ficam próximos. O diálogo nativo não pede componente, estado nem estilo, e já vem acessível. O Playwright trata diálogo por evento; sem ouvinte, ele o descarta, o `confirm` devolve `false` e nada é excluído — por isso a aceitação mora na ação do Page Object, e não repetida em cada teste.

**Alternativa descartada:** modal próprio — componente novo, controle de foco, tecla Esc e `data-cy` próprios, para o mesmo resultado. Excluir sem confirmação — um toque errado apaga a tarefa. Desfazer depois de excluir — exigiria exclusão lógica na API, fora do contrato.

**Decidido por:** Igor Frederick, em 07/10/2026.

---

## [07/10/2026] O frontend chama a API pelo proxy do Vite, e o backend fica sem CORS

**Decisão:** o frontend chama `/api` no próprio endereço, e o servidor de desenvolvimento do Vite repassa a chamada ao backend, no endereço de `API_PROXY_TARGET` — opcional, com padrão `http://localhost:3000`. O backend não ganha configuração de CORS, e `VITE_API_URL` sai do `frontend/.env.example`.

**Motivo:** em desenvolvimento, o frontend (porta 5173) e a API (porta 3000) são origens diferentes, e o navegador bloqueia a chamada entre elas sem CORS no backend. Com o proxy, o navegador fala com uma origem só: nenhuma biblioteca nova, nenhuma mudança no backend — fechado no Passo 2, com contrato estável —, nenhuma variável de origem para manter em sincronia entre as frentes. O E2E não muda: a tela segue em `BASE_URL`, e a service layer chama a API direto, fora do navegador, onde CORS não se aplica.

**Alternativa descartada:** pacote `cors` no backend, com a origem do frontend numa variável de ambiente — biblioteca nova, alteração numa frente fechada e uma variável a mais para o avaliador acertar. URL absoluta da API no frontend — exige o mesmo CORS.

**Consequência registrada:** o repasse existe no `vite` e no `vite preview`. Um build servido por outro servidor precisaria do mesmo repasse, ou de CORS — fora do v1, que não tem deploy.

**Decidido por:** Igor Frederick, em 07/10/2026.

---

## [07/10/2026] Token no `localStorage`, e só o token

**Decisão:** o JWT fica no `localStorage`, lido e escrito só por `utils/tokenStorage.js`. Só o token é guardado: o usuário e o perfil vêm da API — da resposta do login e, quando a página recarrega, de `GET /auth/me`.

**Motivo:** a sessão precisa sobreviver à recarga e a uma aba nova, e a fixture de autenticação do E2E usa o `storageState` do Playwright, que guarda `localStorage` mas não `sessionStorage`. O risco do `localStorage` é ser lido por script injetado (XSS); aqui ele é contido pelo escape do React, pela ausência de `dangerouslySetInnerHTML` e de HTML vindo da API, e pela expiração do token em `JWT_EXPIRES_IN`. O perfil não vai para o navegador porque seria uma cópia que envelhece — o backend já o lê do banco a cada requisição (entrada de 06/10).

**Alternativa descartada:** cookie `httpOnly` — fora do alcance de script, mas muda o contrato, que autentica por `Authorization: Bearer`, e traz a proteção contra CSRF para dentro do escopo. `sessionStorage` — some com a aba e fica fora do `storageState`, o que obrigaria o E2E a entrar pela tela em todo teste. Só em memória — a sessão cai a cada recarga.

**Decidido por:** Igor Frederick, em 07/10/2026.

---

## [07/10/2026] `@hookform/resolvers` liga o React Hook Form ao schema Zod

**Decisão:** os formulários do frontend validam pelo schema Zod de `schemas/`, entregue ao React Hook Form por `zodResolver`, do pacote `@hookform/resolvers`. O Zod do frontend fica no mesmo major do backend, a versão 3.

**Motivo:** o stack declara React Hook Form e Zod, e os dois não se falam sem um adaptador. `@hookform/resolvers` é o adaptador mantido pelo próprio projeto do React Hook Form: o schema vira a fonte única da validação, e o erro de cada campo chega a `formState.errors` sem código de ligação escrito à mão. Com o mesmo major nas duas frentes, o schema de login do frontend se lê como o da API.

**Alternativa descartada:** chamar `schema.safeParse` na submissão e copiar os erros para o formulário — validação paralela ao schema, que `frontend_conventions.md` trata como achado. Validar com as regras nativas do `register` — duplicaria no JSX o que o schema já diz.

**Decidido por:** Igor Frederick, em 07/10/2026.

---

## [07/10/2026] Estilo do frontend com CSS Modules

**Decisão:** cada componente e cada tela tem seu `.module.css`, ao lado do `.jsx`. O CSS global, `src/index.css`, fica com os tokens — cores, espaçamento, raio, tipografia — e o reset.

**Motivo:** o Vite suporta CSS Modules sem configuração e sem biblioteca. O escopo local evita colisão de classe entre telas, e o estilo fica no mesmo diretório do componente que o usa. Os tokens em variáveis CSS mantêm a interface consistente sem um sistema de design.

**Alternativa descartada:** Tailwind — biblioteca nova e configuração, e o estilo passaria a disputar espaço com o `data-cy` no JSX. CSS-in-JS, como styled-components — biblioteca nova com custo de runtime. Um CSS global único — colisão de nomes à medida que as telas crescem.

**Decidido por:** Igor Frederick, em 07/10/2026.

---

## [07/10/2026] O seed recria a base, e as senhas dele ficam fora das variáveis obrigatórias

**Decisão:** `npm run seed` apaga usuários e tarefas e recria o mesmo conjunto fictício — um `lead`, dois `qa` e oito tarefas —, pelos services da API, e recusa rodar com `NODE_ENV=production`. As senhas vêm de `SEED_LEAD_PASSWORD` e `SEED_QA_PASSWORD`, opcionais em `config/env.js` e exigidas por `seed/run.js` antes de conectar. Os dois `qa` dividem a senha, e só o primeiro tem credencial no `e2e/.env.example`.

**Motivo:** estado conhecido depois de cada execução — o E2E e quem sobe o projeto partem sempre da mesma base, sem sobra de rodada anterior. As tarefas saem junto com os usuários porque tarefa sem dono sairia com `owner: null`. Pelos services, o seed herda o hash, os padrões e os limites do model. O segundo `qa` não tem credencial porque o teste de escopo cria a própria massa pelo `lead`, como manda `e2e_conventions.md`.

**Alternativa descartada:** seed idempotente, que cria só o que falta e preserva o resto — o estado depois dele dependeria do que havia antes. Senhas do seed entre as obrigatórias — a API e a suíte exigiriam um valor que não usam. Um `config/seedEnv.js` que valida as senhas na importação — segue a entrada de 01/10 ao pé da letra, ao custo de um módulo para duas variáveis.

**Consequência registrada:** `npm run seed` exige `JWT_SECRET`, que não usa, porque importa `config/env.js`. A política de senha mora no schema da rota de cadastro, um degrau acima dos services, e por isso o seed a confere à parte, antes de apagar a base.

**Substitui:** em parte, a entrada de 01/10 *Variáveis de ambiente validadas na importação do módulo*. A validação na importação continua valendo para o que todo ponto de entrada precisa; a variável que só um ponto de entrada usa é conferida por ele, antes de qualquer efeito.

**Decidido por:** Igor Frederick, em 07/10/2026.

---

## [06/10/2026] O middleware de autenticação confirma o usuário no banco

**Decisão:** `requireAuth` valida o token e, em seguida, busca o usuário pelo `sub`: se ele não existe mais, responde `401 TOKEN_INVALID`; se existe, `req.user` recebe o id e o perfil lidos do banco, não do token.

**Motivo:** com o middleware só no token, o mesmo token respondia `401` em `/auth/me` e `201` em `POST /auth/register` — um `lead` removido seguia criando contas até o token expirar. O seed recria usuários, e tokens emitidos antes dele cairiam no mesmo caso. Ler o perfil do banco faz uma mudança de perfil valer na hora, sem esperar o próximo login. O custo é uma consulta por `_id`, indexado, a cada requisição autenticada.

**Alternativa descartada:** middleware sem estado, só com o token — uma consulta a menos, ao preço de o token de usuário removido autorizar qualquer rota por até `JWT_EXPIRES_IN`, e de `TOKEN_INVALID` significar coisas diferentes conforme a rota.

**Consequência registrada:** o token passa a levar só o id, em `sub`. Com o perfil lido do banco, um perfil copiado no token não seria lido por ninguém — e convidaria alguém a usá-lo.

**Origem:** achado HIGH do `code-reviewer` no PR da fatia 2.1.

**Decidido por:** Igor Frederick, em 06/10/2026.

---

## [06/10/2026] Parada para decisão perto de 50% da janela de contexto

**Decisão:** perto de 50% da janela de contexto, o agente para no próximo ponto seguro — entre commits, nunca no meio de um —, informa o consumo estimado e pede ao usuário que escolha: seguir na sessão, compactar, ou encerrar e retomar numa sessão nova a partir de `docs/handoff.md`, que o agente atualiza antes de encerrar. A regra entra no `CLAUDE.md` §9, ao lado do orçamento de revisão.

**Motivo:** acima de 50% da janela, cresce o risco de o agente perder ou inventar detalhe do que já foi decidido — e este projeto depende de decisões registradas, de contrato fechado e de código que Igor consegue explicar. Uma parada explícita transforma esse risco numa decisão do usuário, tomada num ponto em que o trabalho está commitado e o estado cabe no handoff.

**Alternativa descartada:** deixar a compactação automática decidir — ela acontece no limite da janela, sem escolha do ponto de corte, e o resumo pode perder decisões ainda não registradas. Limite em número absoluto de tokens — depende do tamanho da janela de cada modelo; o percentual vale para qualquer um.

**Decidido por:** Igor Frederick, em 06/10/2026.

---

## [01/10/2026] O `code` carrega o status, num catálogo único

**Decisão:** o catálogo de `code`s cobre todos os erros da API — validação, autenticação, rota inexistente, erro interno e regras de negócio — e é um único objeto em `backend/src/utils/errors.js`, que associa cada `code` ao seu status HTTP e à sua mensagem: `code → { status, message }`. Há uma única classe de erro, construída pelo `code` — status e mensagem vêm do catálogo, nunca de quem lança. O catálogo nasce num commit `refactor:` que leva para ele os `code`s que já existem (`VALIDATION_ERROR`, `EMAIL_TAKEN`, `NOT_FOUND`, `INTERNAL_ERROR`), imediatamente antes do commit de login, que acrescenta o primeiro `code` da família `401`.

**Motivo:** a família `401` decide a forma: quatro `code`s com o mesmo `401`, e nenhum `code` com dois status. A relação `code → status` é uma função — cada `code` tem exatamente um status —, e por isso o status é atributo do `code`, não uma estrutura à parte. Mudar o status de um `code` é mudança de contrato com ou sem esta escolha: `api_contract.md` declara o status de cada `code`, e o E2E assere os dois.

Guardar a mensagem no catálogo dá a ela o teste de unidade que a entrada *Erros da API asseverados por `code`* promete: a mensagem é testada sobre o catálogo, e não pelo E2E.

**Por que não no próprio commit de login:** levar `EMAIL_TAKEN` e `VALIDATION_ERROR` para o catálogo não muda comportamento — é refatoração —, e o login é feature; `commit_conventions.md` proíbe misturar os dois. A forma foi decidida com a família `401` em mãos — nomeada na entrada logo abaixo —, e não inferida de um caso só.

**Consequência registrada:** mensagem fixa por `code`. `EMAIL_TAKEN` e `NOT_FOUND` deixam de interpolar o e-mail e a rota, e o JSON malformado passa a responder com a mensagem de `VALIDATION_ERROR`. Mensagem é apresentação pelo contrato; `code` e status não mudam.

**Alternativa descartada:** `code` sem status, com um mapa `code → status` no middleware de erro — duas estruturas com as mesmas chaves, que podem dessincronizar, sem ganho: nenhum `code` precisa de status diferente conforme o contexto. Uma classe por `code` (`EmailTakenError`, `InvalidCredentialsError`…) — repete o catálogo em forma de hierarquia, e cada `code` novo custaria uma classe.

**Decidido por:** Igor Frederick, em 01/10/2026.

---

## [01/10/2026] Nomes dos `code`s de autenticação e autorização

**Decisão:** a família de autenticação e autorização tem cinco `code`s.

| `code` | Status | Quando |
|---|---|---|
| `INVALID_CREDENTIALS` | `401` | Login com e-mail inexistente ou com senha errada |
| `TOKEN_MISSING` | `401` | Requisição sem `Authorization: Bearer <token>` |
| `TOKEN_INVALID` | `401` | Assinatura, formato ou algoritmo inválido, ou token de usuário que não existe mais |
| `TOKEN_EXPIRED` | `401` | `exp` vencido |
| `FORBIDDEN` | `403` | Perfil autenticado sem permissão para a rota |

**Motivo:** três `code`s de token, e não um `UNAUTHORIZED` genérico, porque o consumidor que precisa da distinção é o teste. O teste de token expirado só prova que a expiração é validada se asserir um `code` que só a expiração produz; com `code` único, um token montado errado no próprio teste — segredo trocado, formato quebrado — o faria passar pelo motivo errado. É o critério de asserções específicas da rubrica aplicado à API. Para o frontend a distinção não custa nada: `frontend_conventions.md` trata qualquer `401` do mesmo jeito, encerrando a sessão.

`INVALID_CREDENTIALS` é um só para os dois erros de login porque o contrato exige resposta igual. `TOKEN_INVALID` cobre também o token bem formado de usuário que já não existe: para quem chama, a credencial não identifica ninguém, e o `401` leva o frontend a encerrar a sessão, onde um `404` o deixaria preso numa tela de erro.

`FORBIDDEN` é o nome que a entrada *Tarefa de outra pessoa responde `404`* já usa para o `403` que ela descarta.

**Alternativa descartada:** `UNAUTHORIZED` único para toda falha de token — menos `code`s, e asserção que não distingue a causa.

**Fora do escopo, registrado:** `TOKEN_EXPIRED` não é gatilho de renovação. Não há refresh token no v1 (`CLAUDE.md` §2); o `code` existe para o teste e para a mensagem.

**Decidido por:** Igor Frederick, em 01/10/2026.

---

## [01/10/2026] Protocolo de trabalho enxuto para o prazo de 09/10

**Decisão:** modo geração como padrão quando nenhum modo é declarado; plano de commits aprovado por fatia, não por arquivo; o `code-reviewer` roda uma vez por PR, com nova rodada só diante de achado CRITICAL ou HIGH; o `revisor-pdi` roda uma vez, antes da entrega.

**Motivo:** o prazo não comporta aprovação arquivo a arquivo nem rodadas de revisão repetidas até zerar achados — o custo de cada ciclo se multiplica pelo número de fatias. O que esse rigor protegeria, código que Igor consegue explicar, continua como regra permanente 3 do `CLAUDE.md` §9, cobrada na revisão de cada PR.

**Alternativa descartada:** protocolo de pair completo — pergunta de defesa ao fim de cada ciclo, aprovação por arquivo, revisão repetida até zerar achados. Caberia no prazo só cortando escopo, e o escopo já está no mínimo que produz evidência de cada critério da rubrica: cortar escopo tira evidência; aliviar o protocolo tira só cerimônia.

**Decidido por:** Igor Frederick, em 01/10/2026.

---

## [01/10/2026] Contrato fechado antes da primeira rota, e construção backend → frontend → E2E

**Decisão:** o backend é construído até o contrato da API estar estável; depois o frontend; o E2E por último. O contrato em `api_contract.md` é fechado antes de qualquer rota de tarefa, com os status de sucesso declarados — `201` na criação, `200` em leitura e atualização — e cinco escolhas que não são óbvias:

- `PATCH` para edição: a edição é parcial, e concluir ou reabrir envia só o `status`
- `204` sem corpo na exclusão
- a tarefa traz `owner` com `_id` e `name`, para a listagem do líder; o dono nunca é entrada
- `_id` mal formado responde `400` com `VALIDATION_ERROR`, não `404` nem o `500` de um `CastError`
- login com e-mail inexistente e login com senha errada respondem igual

**Motivo:** frontend e E2E consomem o contrato, e mudança depois de escritos custa em três lugares em vez de um. Contrato que declara só os status de erro deixa os de sucesso para quem escreve o primeiro teste, e o resto da API os copia por imitação. As cinco escolhas são as que, sem registro, seriam decididas por quem escrevesse a primeira rota. O `_id` mal formado se julga olhando só a entrada, então é invariante de entrada — ver *Classificação das regras de negócio*. A resposta igual no login impede descobrir quais e-mails têm conta.

**Alternativa descartada:** as três frentes em paralelo, por fatia vertical de funcionalidade — cada ajuste de contrato viraria retrabalho simultâneo em três lugares. `PUT` com a tarefa inteira — obrigaria o frontend a reenviar todos os campos para concluir uma tarefa. `200` com a tarefa excluída no corpo — devolveria um recurso que já não existe.

---

## [01/10/2026] Tarefa de outra pessoa responde `404`, não `403`

**Decisão:** para o perfil `qa`, `GET`, `PATCH` e `DELETE` de tarefa de outra pessoa respondem `404` com `TASK_NOT_FOUND`, exatamente como tarefa inexistente. O filtro por dono entra na própria consulta do service — `{ _id, userId }` —, não numa comparação feita depois de buscar a tarefa.

**Motivo:** `403` confirma que a tarefa existe, informação que o `qa` não deveria ter. Com `404`, tarefa alheia e tarefa inexistente percorrem o mesmo caminho no código e no teste. O filtro na consulta elimina a classe de erro em que a comparação do dono é esquecida em uma das rotas: não há passo a esquecer.

**Relação com a classificação por dependência de estado:** escopo por dono só se julga consultando o banco, e por isso vive no service. O que muda é o status: `409` é para estado que impede a operação; aqui, para quem pede, o recurso não existe.

**Alternativa descartada:** `403 FORBIDDEN` — semanticamente defensável ("existe, mas não é sua"), e revela existência. Buscar por `_id` e comparar `userId` no service — funciona, mas depende de cada rota lembrar da comparação.

---

## [01/10/2026] Criação de conta restrita ao líder, sem token na resposta

**Decisão:** `POST /auth/register` exige perfil `lead` e responde `{ user }`, sem token. Não há cadastro público; o primeiro `lead` nasce do seed. Token é emitido apenas pelo login. A restrição entra na fatia de autenticação, junto com o middleware de token de que ela depende.

**Motivo:** a base do backend tem um cadastro público que aceita `role` no payload — qualquer pessoa conseguiria se cadastrar como `lead`. Restringir a rota fecha essa escalada de privilégio e dá ao `lead` uma permissão de rota concreta, que exercita o middleware de autorização por perfil sem exigir tela nova. Sem token na resposta porque quem cria a conta de outra pessoa não deve receber a credencial dela, e porque um único emissor de token é um único lugar para testar e mudar.

**Alternativa descartada:** manter o cadastro público e tirar `role` do schema — fecha a escalada, mas deixa o `lead` sem nenhuma rota exclusiva e o middleware de perfil sem uso real. `{ token, user }` com login automático — cria um segundo ponto de emissão de credencial.

---

## [01/10/2026] Domínio mínimo: tarefas de um time de QA, com dois perfis

**Decisão:** as etapas 1 (frontend), 2 (backend) e 3 (E2E) do PDI são demonstradas por um gerenciador de tarefas — `User` e `Task`, três telas, perfis `qa` e `lead` —, em repositório próprio. As etapas 4 e 5 vivem fora daqui.

**Motivo:** a avaliação mede competências técnicas nas três frentes, não o produto. Um domínio mínimo concentra o esforço no que a rubrica mede e cabe no prazo. Tarefa tem `status` e `priority`, que dão os filtros da listagem e os casos de validação; dono e perfil dão os casos de autorização — `401`, `403` e escopo por dono. Os perfis se chamam `qa` e `lead` porque descrevem os papéis de um time de QA.

**Alternativa descartada:** um gerenciador de notas — ainda mais simples, mas sem status e prioridade, que dão os filtros e os casos de teste mais úteis. Um domínio com regra própria, como agenda ou assinaturas — trocaria tempo de demonstração por tempo de regra de negócio. As etapas 4 e 5 no mesmo repositório — misturaria entregáveis com critérios de avaliação diferentes.

**Alinhamento:** confirmado com Murilo Morato, tech lead, em 07/10/2026 — as etapas 1 a 3 ficam em repositório próprio, separadas das etapas 4 e 5.

---

## [01/10/2026] Classificação das regras de negócio por camada e status

**Decisão:** o critério é a dependência de estado. Invariante de entrada — o que se julga olhando só o payload — valida por schema Zod no middleware e retorna `400` com `VALIDATION_ERROR` e o campo em `details`. Invariante de domínio — o que só se julga consultando o estado do sistema — valida no service, com `code` próprio: `409` quando o estado impede a operação, `404` quando o recurso não existe para quem pede.

**Motivo:** sem critério, o status de cada regra vira opinião de quem a implementa, e backend e E2E divergem — uma regra de forma do payload marcada `409` nunca chegaria ao service, porque o middleware a recusaria antes com `400`. Aplicado às regras do `CLAUDE.md` §3: `title` obrigatório e os valores de `status` e `priority` são entrada (`400`); e-mail único é domínio (`409`); tarefa alheia é domínio, com `404`.

**Alternativa descartada:** todas as regras como `409` no service — duplicaria no service validações que o schema já garante.

---

## [01/10/2026] Erros da API asseverados por `code`, não por mensagem

**Decisão:** toda resposta de erro segue o formato único `{ error: { code, message, details } }`. Os testes asseveram o `code`, nunca a mensagem em português.

**Motivo:** a mensagem é apresentação e o `code` é contrato. Asseverar a mensagem tornaria a suíte frágil: uma alteração cosmética de texto quebraria testes sem mudança de comportamento. A mensagem continua testada, em nível de unidade, junto do catálogo de `code`s — a cobertura muda de lugar, não se perde.

**Alternativa descartada:** asseverar a mensagem exibida, por ser o que o usuário vê — acopla o teste a texto de interface, a fonte mais comum de falso positivo em regressão.

---

## [01/10/2026] Page Object Model com um Page Object por tela

**Decisão:** a suíte E2E usa Page Object Model, com exatamente um Page Object por tela — três telas, três Page Objects. O Page Object contém locators e ações de baixo nível; asserções ficam no arquivo do teste, massa de dados em factory, setup via service layer e autenticação em fixture.

**Motivo:** a rubrica do E2E cita organização dos testes e qualidade dos seletores. Um Page Object por tela faz `e2e/pages/` corresponder às telas da aplicação, e a organização se lê sem explicação. Asserção fora do Page Object mantém o Arrange-Act-Assert visível no arquivo do teste.

**Alternativa descartada:** Page Object por componente — fragmenta e faz cada teste depender de muitos objetos. Por fluxo — mistura telas diferentes no mesmo objeto e reintroduz o acoplamento que o padrão existe para evitar.

**Alinhado com:** Murilo Morato, tech lead, em 15/09/2026 às 11:22.

---

## [01/10/2026] Interface para mobile e desktop, com desktop-first na ordem de trabalho

**Decisão:** a interface funciona em mobile e em desktop, sem quebra de layout nem conteúdo inacessível. Desktop-first é a ordem de trabalho — o alvo que guia as decisões de layout —, não dispensa de suporte a mobile.

**Motivo:** a rubrica pede interface responsiva, mobile e desktop. O uso principal de um gerenciador de tarefas de time é no computador de trabalho, e por isso o desktop guia o layout. Separar ordem de design de suporte de plataforma impede que a ordem seja lida como dispensa.

**Alternativa descartada:** mobile-first — inverte a prioridade do uso real sem ganho na avaliação, que pede os dois.

---

## [01/10/2026] Vitest e ESM no backend

**Decisão:** o backend é ESM (`"type": "module"`) e os testes de `backend/tests/` usam Vitest, com `supertest` para exercitar a API sem abrir porta.

**Motivo:** Vitest roda ESM nativamente, sem etapa de transformação: o que está no arquivo é o que executa, e a pilha de erro aponta a linha real.

**Consequências de organização:**

- `app.js` é separado de `server.js`: a aplicação não chama `listen`, e o teste de API roda sem porta aberta. O que tem efeito colateral fica na borda.
- `fileParallelism: false` no `vitest.config.js`: a suíte compartilha uma conexão com o banco de teste, e arquivos concorrentes disputariam as coleções. Independência entre testes não pode depender de sorte de ordenação.

**Alternativa descartada:** CommonJS com Jest — combinação mais comum, mas Jest com ESM exige `--experimental-vm-modules` e configuração adicional, custo sem contrapartida num projeto sem código legado.

---

## [01/10/2026] Variáveis de ambiente validadas na importação do módulo

**Decisão:** `config/env.js` valida as variáveis obrigatórias na importação e lança com a lista do que falta. Sem valor padrão para segredo. A suíte injeta valores de teste via `setupFiles` do Vitest.

**Motivo:** todo caminho que importa `env` — servidor, seed, teste que chama o service direto — passa pela validação sem depender de alguém lembrar de chamar uma função. Com chamada explícita, esses caminhos falhariam longe da causa: `mongoose.connect(undefined)`, custo de bcrypt `NaN`, `jwt.sign` sem segredo. Errar a porta é inconveniente; errar `JWT_SECRET` é falha de segurança.

A validação é efeito colateral verificador — só recusa continuar — e por isso fica no centro; `listen()` é irreversível e fica na borda, em `server.js`.

**Alternativa descartada:** uma função `loadEnv()` chamada em `server.js` — deixa passar todo ponto de entrada que não seja o servidor.

---

## [01/10/2026] MongoDB por `docker-compose`, e a suíte falha rápido sem ele

**Decisão:** MongoDB de desenvolvimento e teste via `docker-compose.yml` na raiz, com MongoDB local documentado como alternativa. A suíte verifica a conexão uma vez, antes de rodar, e aborta com a causa e o comando que resolve.

**Motivo:** o avaliador precisa de MongoDB para a aplicação, a suíte do backend e o E2E; o compose resolve os três com um comando. Sem a verificação, um clone sem banco mostra uma pilha de timeouts que se lê como código quebrado, não como ambiente ausente.

**Alternativa descartada:** `mongodb-memory-server` — resolve só a suíte do backend, deixa aplicação e E2E sem banco, e acrescenta biblioteca com dezenas de megabytes de binário no primeiro uso.

---

## [01/10/2026] Service importa o model em vez de recebê-lo por parâmetro

**Decisão:** os services importam os models diretamente. A dependência externa que entra por fora é a conexão, aberta por `config/database.js`.

**Motivo:** a convenção pede dependência externa por parâmetro ou por `config/`. Model Mongoose é registro global por nome — `mongoose.model('User')` devolve o mesmo objeto a quem pedir —, e injetá-lo por parâmetro não permitiria substituição real: só mudaria o import de lugar. O que a convenção protege, service exercitável sem HTTP, está atendido: o teste de service abre a conexão e chama a função, sem `app.js`.

**Alternativa descartada:** model por parâmetro, para trocar por dublê no teste — o dublê enfraqueceria o teste justamente nas garantias que mais importam: índice único de `email`, `select: false` e `transform` são comportamento do Mongoose e do banco, e a corrida de cadastro simultâneo não existiria contra um objeto em memória.

**Custo aceito:** o teste de service exige banco em pé — mais lento que dublê, e uma dependência de ambiente a mais. A alternativa troca lentidão por cegueira nas invariantes de segurança.

---

## [01/10/2026] A unidade de branch é a fatia, não a frente

**Decisão:** cada fatia vive numa branch própria, fechada com PR; a branch seguinte parte da `main` depois do merge. Uma fatia fecha quando entrega uma capacidade que a seguinte consome e que pode ser testada no próprio PR. "Frente" continua designando backend, frontend e E2E.

**Motivo:** com uma branch por frente, o `code-reviewer` só rodaria no fim do backend, sobre o diff inteiro — o pior caso para revisão de diff. Frente é a unidade de agente e responsabilidade; fatia é a unidade de revisão e merge. A fatia vive dentro de uma frente e atravessa as camadas dela — não é a fatia vertical pelas três frentes, que a sequência backend → frontend → E2E descarta.

**Alternativa descartada:** corte por tamanho, em commits ou linhas — arbitrário, não diz o que o PR entrega.

---

## [01/10/2026] Convenções em `.claude/knowledge/`, e cinco agentes que apontam para elas

**Decisão:** as convenções vivem em `.claude/knowledge/` — cinco arquivos de convenção e quatro checklists —, e o `CLAUDE.md` fica como camada de contexto. São cinco agentes, divididos por unidade de análise e momento: três construtores em pair, um por frente; o `code-reviewer` sobre o diff de cada PR; o `revisor-pdi` sobre o repositório inteiro, antes da entrega. Os agentes não transcrevem convenção: cada linha diz o que garantir e aponta para a fonte. Alteração na rubrica, na tabela de critérios do `CLAUDE.md` ou neste log exige verificar a propagação para `.claude/knowledge/` e `.claude/agents/` no mesmo commit, e quem verifica é um leitor sem o contexto da mudança — o `code-reviewer` e o `revisor-pdi`.

**Motivo:** convenção duplicada diverge em silêncio: corrigir num lugar e esquecer o outro produz dois agentes com regras diferentes sem que ninguém perceba. Com fonte única, a atualização chega a todos os leitores ao mesmo tempo. Os agentes consomem o conhecimento e não se atualizam sozinhos, por isso entram na propagação. Revisar um diff e avaliar um repositório têm escopo e critério de saída diferentes: a revisão de diff precisa ser barata e frequente; a do repositório é cara e rara. E quem acabou de escrever lê a intenção em vez do texto — por isso a verificação é de um leitor sem contexto.

**Alternativa descartada:** convenções no `CLAUDE.md`, com checklist embutido em cada agente — misturaria contexto com detalhe e duplicaria a mesma regra em vários arquivos. Um único revisor para diff e repositório — faria uma das duas revisões no ritmo errado.

**Cuidado de execução:** a linha-índice do agente precisa ser tão larga quanto a seção que indexa. Índice mais estreito que a fonte faz o agente parar onde o índice termina e não abrir o resto da seção.
