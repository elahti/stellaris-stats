import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { vanillaExtractPlugin } from '@vanilla-extract/vite-plugin'
import z from 'zod/v4'

const ViteEnvConfig = z.object({
  serverPort: z.coerce.number().default(5173),
  graphqlServerPort: z.coerce.number().default(4000),
})

const envConfig = ViteEnvConfig.parse({
  serverPort: process.env.STELLARIS_STATS_VITE_PORT,
  graphqlServerPort: process.env.STELLARIS_STATS_GRAPHQL_SERVER_PORT,
})

const graphqlUrl = `http://localhost:${envConfig.graphqlServerPort}`

export default defineConfig({
  plugins: [react(), vanillaExtractPlugin()],
  server: {
    port: envConfig.serverPort,
    host: true,
    proxy: {
      '/graphql': graphqlUrl,
      '/api': graphqlUrl,
    },
  },
})
