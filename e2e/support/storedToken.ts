import type { Page } from '@playwright/test'

// Mesma chave de frontend/src/utils/tokenStorage.js.
export const TOKEN_STORAGE_KEY = 'task-manager.token'

/** Token que a aplicação guardou no navegador, ou `null` sem sessão. */
export function readStoredToken(page: Page): Promise<string | null> {
  return page.evaluate((key) => localStorage.getItem(key), TOKEN_STORAGE_KEY)
}

/**
 * Troca o token guardado, como se outro estivesse no navegador. A página
 * precisa já estar na origem da aplicação, porque o localStorage é por origem.
 * A troca vale a partir da próxima chamada à API, sem recarregar: o cliente
 * HTTP do frontend lê o token a cada chamada.
 */
export async function writeStoredToken(page: Page, token: string): Promise<void> {
  await page.evaluate(([key, value]) => localStorage.setItem(key, value), [TOKEN_STORAGE_KEY, token])
}
