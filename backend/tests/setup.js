/**
 * Setup da suíte, executado antes de qualquer import de teste.
 *
 * config/env.js valida as variáveis obrigatórias na importação e lança se
 * faltarem — decisão deliberada, para que ninguém use `env` sem tê-la passado.
 * A consequência é que qualquer teste que toque config/ dependeria de um .env
 * na máquina de quem roda, e .env não é versionado. Aqui a suíte declara os
 * próprios valores, fictícios e explícitos.
 *
 * ??= preserva override: em CI, a variável já definida no ambiente vence.
 */
process.env.MONGODB_URI ??= 'mongodb://127.0.0.1:27017/task-manager-test'
process.env.JWT_SECRET ??= 'segredo-de-teste-sem-valor-real'
process.env.NODE_ENV ??= 'test'

// Custo mínimo do bcrypt na suíte: o que se testa é que a senha foi hasheada,
// não a resistência do hash. Com o padrão de produção, cada cadastro custaria
// dezenas de milissegundos e a suíte pagaria isso a cada teste.
process.env.BCRYPT_SALT_ROUNDS ??= '4'
