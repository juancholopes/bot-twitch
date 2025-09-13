import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// Configuración de Vite para el overlay desde la raíz del proyecto
export default defineConfig({
  plugins: [react()],
  base: '/overlay/',
  root: path.resolve(__dirname, 'obs-overlay'), // Raíz del overlay
  build: {
    outDir: path.resolve(__dirname, 'obs-overlay/dist'),
    emptyOutDir: true
  },
  server: {
    port: 5174,
    host: true
  },
  publicDir: path.resolve(__dirname, 'obs-overlay/public')
})
