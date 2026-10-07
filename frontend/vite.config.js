import react from '@vitejs/plugin-react'
import { defineConfig, loadEnv } from 'vite'

export default defineConfig(({ mode }) => {
  // Prefixo '': carrega também as variáveis sem VITE_, que ficam só aqui e não
  // vão para o bundle.
  const env = loadEnv(mode, process.cwd(), '')

  return {
    plugins: [react()],
    server: {
      // A suíte E2E aponta para esta porta: ocupada, o Vite falha em vez de
      // subir em outra e deixar os testes batendo no lugar errado.
      port: 5173,
      strictPort: true,
      // O navegador só fala com o Vite, que repassa /api ao backend: sem
      // chamada entre origens, o backend não precisa de CORS.
      proxy: {
        '/api': env.API_PROXY_TARGET || 'http://localhost:3000',
      },
    },
  }
})
