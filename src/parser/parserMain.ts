import { startOfMonth } from 'date-fns'
import { Jomini } from 'jomini'
import { Redis } from 'ioredis'
import { Pool } from 'pg'
import { Logger } from 'pino'
import { z } from 'zod/v4'
import { DbConfig, getDbPool, withTx } from '../db.js'
import { getGamestateByMonth, insertGamestate } from '../db/gamestates.js'
import { getSave, insertSave } from '../db/save.js'
import { GAMESTATE_CREATED } from '../graphql/pubsub.js'
import { getLogger } from '../logger.js'
import { MigrationsConfig, runUpMigrations } from '../migrations.js'
import { createRedisClient } from '../redis.js'
import { populateBudgetTables } from './budgetPopulator.js'
import { populateDiplomaticRelationTables } from './diplomaticRelationPopulator.js'
import { populateEmpireTables } from './empirePopulator.js'
import { readGamestateData } from './gamestateReader.js'
import { populatePlanetCoordinateTables } from './planetCoordinatePopulator.js'
import { ParserConfig } from './parserConfig.js'
import { getParserOptions } from './parserOptions.js'

export interface ParserIterationResult {
  saveId: number
  gamestateId: number
  date: Date
}

export const executeParserIteration = async (
  pool: Pool,
  ironmanPath: string,
  gamestateId: string,
  logger: Logger,
  redisClient?: Redis,
): Promise<ParserIterationResult | undefined> => {
  const gamestateData = await readGamestateData(ironmanPath)
  const jomini = await Jomini.initialize()
  const gamestate = jomini.parseText(gamestateData)

  const name = z.string().parse(gamestate.name)
  const date = z.coerce.date().parse(gamestate.date)

  const result = await withTx(
    pool,
    async (client): Promise<ParserIterationResult | undefined> => {
      const existingSave = await getSave(client, gamestateId)
      const save = existingSave ?? (await insertSave(client, gamestateId, name))

      if (!existingSave) {
        logger.info({ saveId: save.saveId, name: save.name }, 'Save inserted')
      }

      const dateToCheck = startOfMonth(date)
      const existingGamestate = await getGamestateByMonth(
        client,
        save.saveId,
        dateToCheck,
      )

      if (existingGamestate) {
        return undefined
      }

      const insertedGamestate = await insertGamestate(
        client,
        save.saveId,
        date,
        gamestate,
      )
      logger.info(
        { gamestateId: insertedGamestate.gamestateId, date },
        'Gamestate inserted',
      )

      await populateBudgetTables(
        client,
        insertedGamestate.gamestateId,
        gamestate,
        logger,
      )
      logger.info(
        { gamestateId: insertedGamestate.gamestateId },
        'Budget data populated',
      )

      await populateEmpireTables(
        client,
        insertedGamestate.gamestateId,
        gamestate,
        logger,
      )
      logger.info(
        { gamestateId: insertedGamestate.gamestateId },
        'Empire data populated',
      )

      await populateDiplomaticRelationTables(
        client,
        insertedGamestate.gamestateId,
        gamestate,
        logger,
      )
      logger.info(
        { gamestateId: insertedGamestate.gamestateId },
        'Diplomatic relation data populated',
      )

      await populatePlanetCoordinateTables(
        client,
        insertedGamestate.gamestateId,
        gamestate,
        logger,
      )
      logger.info(
        { gamestateId: insertedGamestate.gamestateId },
        'Planet coordinate data populated',
      )

      return {
        saveId: save.saveId,
        gamestateId: insertedGamestate.gamestateId,
        date: insertedGamestate.date,
      }
    },
  )

  if (result && redisClient) {
    const payload = {
      saveId: result.saveId,
      gamestateId: result.gamestateId,
      date: result.date.toISOString(),
    }
    await redisClient.publish(GAMESTATE_CREATED, JSON.stringify(payload))
    logger.info(
      { saveId: result.saveId, gamestateId: result.gamestateId },
      'Published gamestate created event',
    )
  }

  return result
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
  const redisClient = createRedisClient(config)

  await runUpMigrations(config, pool, logger)

  logger.info('Redis client connected for pub/sub')
  redisClient.on('error', (error: unknown) => {
    logger.error({ error }, 'Redis client error')
  })

  logger.info(
    {
      gamestateId,
      ironmanPath,
      interval: config.STELLARIS_STATS_PARSER_INTERVAL,
    },
    'Parser initialized',
  )

  let isIterationRunning = false

  const parseInterval = setInterval(() => {
    if (isIterationRunning) {
      logger.debug(
        'Skipping parser iteration - previous iteration still running',
      )
      return
    }

    isIterationRunning = true
    void (async () => {
      try {
        await executeParserIteration(
          pool,
          ironmanPath,
          gamestateId,
          logger,
          redisClient,
        )
      } catch (error: unknown) {
        logger.error({ error }, 'Error during parser iteration')
      } finally {
        isIterationRunning = false
      }
    })()
  }, config.STELLARIS_STATS_PARSER_INTERVAL)

  const shutdown = () => {
    logger.info('Shutting down parser')
    clearInterval(parseInterval)
    void (async () => {
      await redisClient.quit()
      logger.info('Redis client closed')
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
