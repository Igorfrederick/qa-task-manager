# Log de decisões técnicas

Registro das decisões tomadas no projeto, na data em que foram tomadas. Existe porque as decisões serão questionadas na avaliação, e resposta escrita na data vale mais do que justificativa reconstruída depois.

Formato de cada entrada: decisão, motivo, alternativa descartada.

**Ordem cronológica inversa** — entrada mais recente no topo. O log cresce ao longo do projeto e a decisão mais nova é a que tem maior chance de ser consultada; nova entrada vai logo abaixo deste cabeçalho.

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

**Alinhamento:** a confirmar com Murilo Morato, tech lead — registrar aqui a data e a resposta.

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
