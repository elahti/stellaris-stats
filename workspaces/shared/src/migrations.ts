import { runner } from 'node-pg-migrate'
import { Pool } from 'pg'
import z from 'zod/v4'
import { withTx } from './db.js'
import { logger } from './logger.js'

export const MigrationsConfig = z.object({
  STELLARIS_STATS_MIGRATIONS_DIR: z.string(),
  STELLARIS_STATS_MIGRATIONS_TABLE: z.string(),
})

type MigrationsConfig = z.infer<typeof MigrationsConfig>

export const runUpMigrations = async (config: MigrationsConfig, pool: Pool) => {
  await withTx(pool, async (client) => {
    await runner({
      checkOrder: true,
      createMigrationsSchema: true,
      dbClient: client,
      dir: config.STELLARIS_STATS_MIGRATIONS_DIR,
      direction: 'up',
      logger: logger,
      migrationsTable: config.STELLARIS_STATS_MIGRATIONS_TABLE,
    })
  })
}
