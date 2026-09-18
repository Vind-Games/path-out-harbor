import { defineConfig } from 'vite'

export default defineConfig({
  base: '/path-out-harbor/',
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
  },
})
