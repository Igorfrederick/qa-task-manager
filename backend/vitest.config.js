import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    environment: 'node',
    include: ['tests/**/*.test.js'],
    // Roda antes de qualquer import: config/env.js lança na importação se
    // faltar variável obrigatória, e .env não é versionado.
    setupFiles: ['tests/setup.js'],
    // Verifica a conexão uma vez antes de tudo: sem isto, a ausência do banco
    // se apresenta como 15 timeouts em vez de uma mensagem com a causa.
    globalSetup: ['tests/globalSetup.js'],
    // Sem paralelismo entre arquivos: a suíte compartilha uma única conexão
    // com o banco de teste, e arquivos concorrentes disputariam as coleções.
    fileParallelism: false,
  },
})
