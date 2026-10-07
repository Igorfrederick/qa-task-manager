import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

export default defineConfig({
  plugins: [react()],
  server: {
    // A suíte E2E aponta para esta porta: ocupada, o Vite falha em vez de
    // subir em outra e deixar os testes batendo no lugar errado.
    port: 5173,
    strictPort: true,
  },
})
