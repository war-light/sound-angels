import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import path from 'node:path'
import { defineConfig } from 'vitest/config'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': path.resolve(import.meta.dirname, './src'),
    },
  },
  server: {
    watch: {
      usePolling: true,
      interval: 300,
      ignored: [
        '**/.ua/**',
        '**/graphify-out/**',
        '**/@/**',
        '**/.git/**',
        '**/node_modules/**',
        '**/dist/**',
        '**/logs/**',
        '**/*.log',
      ],
    },
  },
  test: {
    environment: 'jsdom',
    setupFiles: './src/test/setup.ts',
    globals: true,
  },
})
