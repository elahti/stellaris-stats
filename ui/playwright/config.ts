import z from 'zod/v4'

export const PlaywrightEnvConfig = z.object({
  viteHost: z.string(),
  vitePort: z.coerce.number(),
  dbHost: z.string(),
  dbPort: z.coerce.number(),
  dbUser: z.string(),
  dbPassword: z.string(),
  dbName: z.string(),
})

export type PlaywrightEnvConfig = z.infer<typeof PlaywrightEnvConfig>

export const getPlaywrightEnvConfig = (): PlaywrightEnvConfig =>
  PlaywrightEnvConfig.parse({
    viteHost: process.env.STELLARIS_STATS_VITE_HOST,
    vitePort: process.env.STELLARIS_STATS_VITE_PORT,
    dbHost: process.env.STELLARIS_STATS_DB_HOST,
    dbPort: process.env.STELLARIS_STATS_DB_PORT,
    dbUser: process.env.STELLARIS_STATS_DB_USER,
    dbPassword: process.env.STELLARIS_STATS_DB_PASSWORD,
    dbName: process.env.STELLARIS_STATS_DB_NAME,
  })
