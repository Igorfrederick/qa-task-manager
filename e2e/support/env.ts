import { existsSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

// O .env da suíte fica na raiz de e2e/. Variável já definida no ambiente
// prevalece sobre a do arquivo: process.loadEnvFile não sobrescreve.
const envFile = fileURLToPath(new URL('../.env', import.meta.url))
if (existsSync(envFile)) {
  process.loadEnvFile(envFile)
}

function required(name: string): string {
  const value = process.env[name]
  if (!value) {
    throw new Error(`Variável ${name} ausente: copie e2e/.env.example para e2e/.env e preencha.`)
  }
  return value
}

// Com a barra no fim, os caminhos relativos do cliente de API ('auth/login')
// ficam sob /api; sem ela, a resolução de URL descartaria o /api.
function withTrailingSlash(url: string): string {
  return url.endsWith('/') ? url : `${url}/`
}

export const env = {
  baseUrl: required('BASE_URL'),
  apiUrl: withTrailingSlash(required('API_URL')),
  lead: { email: required('E2E_LEAD_EMAIL'), password: required('E2E_LEAD_PASSWORD') },
  qa: { email: required('E2E_QA_EMAIL'), password: required('E2E_QA_PASSWORD') },
}
