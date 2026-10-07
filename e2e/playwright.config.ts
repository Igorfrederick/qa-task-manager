import { defineConfig, devices } from '@playwright/test'

import { env } from './support/env'

export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  // Sem nova tentativa: teste instável tem de aparecer como falha, não sumir.
  retries: 0,
  reporter: [['list'], ['html', { open: 'never' }]],
  globalSetup: './support/globalSetup.ts',
  use: {
    baseURL: env.baseUrl,
    // getByTestId lê data-cy: o único seletor que a suíte usa.
    testIdAttribute: 'data-cy',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  // A mesma suíte no desktop e no celular: a interface responsiva é critério
  // da rubrica, e cada jornada roda nos dois.
  projects: [
    { name: 'desktop', use: { ...devices['Desktop Chrome'] } },
    { name: 'mobile', use: { ...devices['Pixel 7'] } },
  ],
  // Sobe a API e o frontend, ou reaproveita os que já estiverem no ar. O banco
  // e o seed ficam fora: o seed apaga a base, e rodá-lo é decisão de quem testa.
  webServer: [
    {
      command: 'npm start',
      cwd: '../backend',
      url: new URL('health', env.apiUrl).href,
      reuseExistingServer: true,
      timeout: 30_000,
    },
    {
      command: 'npm run dev',
      cwd: '../frontend',
      url: env.baseUrl,
      reuseExistingServer: true,
      timeout: 30_000,
    },
  ],
})
