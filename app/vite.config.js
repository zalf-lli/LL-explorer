import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

const configDir = dirname(fileURLToPath(import.meta.url))
const projectRoot = resolve(configDir)

// https://vite.dev/config/
export default defineConfig({
  base: './',
  root: projectRoot,
  plugins: [react()],
  publicDir: resolve(projectRoot, 'public'),
  cacheDir: resolve(projectRoot, 'node_modules', '.vite'),
  build: {
    outDir: resolve(projectRoot, 'dist'),
  },
})
