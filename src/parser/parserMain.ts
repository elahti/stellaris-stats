import { startOfMonth } from 'date-fns'
import { Jomini } from 'jomini'
import { Pool } from 'pg'
import { Logger } from 'pino'
import { z } from 'zod/v4'
import { DbConfig, getDbPool } from '../db.js'
import { getGamestateByMonth, insertGamestate } from '../db/gamestates.js'
import { upsertSave } from '../db/save.js'
import { getLogger } from '../logger.js'
import { MigrationsConfig, runUpMigrations } from '../migrations.js'
import { readGamestateData } from './gamestateReader.js'
import { ParserConfig } from './parserConfig.js'
import { getParserOptions } from './parserOptions.js'

export const executeParserIteration = async (
  pool: Pool,
  ironmanPath: string,
  gamestateId: string,
  logger: Logger,
): Promise<void> => {
  logger.info('Parser iteration started')

  const gamestateData = await readGamestateData(ironmanPath)
  const jomini = await Jomini.initialize()
  const parsed = jomini.parseText(gamestateData)

  const name = z.string().parse(parsed.name)
  const date = z.coerce.date().parse(parsed.date)

  const client = await pool.connect()
  try {
    const save = await upsertSave(client, gamestateId, name)
    logger.info({ saveId: save.saveId, name: save.name }, 'Save upserted')

    const dateToCheck = startOfMonth(date)
    const existingGamestate = await getGamestateByMonth(
      client,
      save.saveId,
      dateToCheck,
    )

    if (existingGamestate) {
      logger.info(
        { gamestateId: existingGamestate.gamestateId, date },
        'Gamestate already exists for this month, skipping',
      )
      return
    }

    const insertedGamestate = await insertGamestate(
      client,
      save.saveId,
      date,
      parsed,
    )
    logger.info(
      { gamestateId: insertedGamestate.gamestateId, date },
      'Gamestate inserted',
    )
  } finally {
    client.release()
  }
}

const runParser = async (logger: Logger) => {
  const config = ParserConfig.extend(DbConfig.shape)
    .extend(MigrationsConfig.shape)
    .parse(process.env)

  const parserOptions = await getParserOptions(logger)
  if (parserOptions === undefined) {
    return
  }

  const { gamestateId, ironmanPath } = parserOptions
  const pool = getDbPool(config)

  await runUpMigrations(config, pool, logger)

  logger.info(
    {
      gamestateId,
      ironmanPath,
      interval: config.STELLARIS_STATS_PARSER_INTERVAL,
    },
    'Parser initialized',
  )

  const parseInterval = setInterval(() => {
    void (async () => {
      try {
        await executeParserIteration(pool, ironmanPath, gamestateId, logger)
      } catch (error: unknown) {
        logger.error({ error }, 'Error during parser iteration')
      }
    })()
  }, config.STELLARIS_STATS_PARSER_INTERVAL)

  const shutdown = () => {
    logger.info('Shutting down parser')
    clearInterval(parseInterval)
    void (async () => {
      await pool.end()
      logger.info('Database pool closed')
    })()
  }

  process.on('SIGTERM', shutdown)
  process.on('SIGINT', shutdown)
}

if (process.env.NODE_ENV !== 'test') {
  const logger = getLogger()
  runParser(logger).catch((error: unknown) => {
    logger.error(error)
  })
}
