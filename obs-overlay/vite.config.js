import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  base: '/overlay/',
  root: path.resolve(__dirname), // Asegurar que la raíz es la carpeta overlay
  build: {
    outDir: 'dist',
    emptyOutDir: true
  },
  server: {
    port: 5174, // Puerto diferente para evitar conflictos
    host: true
  }
})
