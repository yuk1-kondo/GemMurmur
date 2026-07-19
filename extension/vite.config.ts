import { defineConfig } from 'vite'
import { crx } from '@crxjs/vite-plugin'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import manifest from './manifest.config'

const rootDir = dirname(fileURLToPath(import.meta.url))

export default defineConfig({
  // Required for Chrome extension pages nested under src/*
  base: '',
  plugins: [crx({ manifest })],
  resolve: {
    alias: {
      '@': resolve(rootDir, 'src'),
    },
  },
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    rollupOptions: {
      input: {
        offscreen: resolve(rootDir, 'offscreen.html'),
      },
    },
  },
  server: {
    port: 5173,
    strictPort: true,
    hmr: { port: 5173 },
  },
})
