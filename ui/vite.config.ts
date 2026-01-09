import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { vanillaExtractPlugin } from '@vanilla-extract/vite-plugin'

export default defineConfig({
  plugins: [react(), vanillaExtractPlugin()],
  server: {
    port: 5173,
    host: true,
    proxy: {
      '/graphql': 'http://localhost:4000',
      '/api': 'http://localhost:4000',
    },
  },
})
