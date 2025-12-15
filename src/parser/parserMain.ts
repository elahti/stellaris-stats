import { Jomini } from 'jomini'
import { Logger } from 'pino'
import { DbConfig, getDbPool } from '../db.js'
import { getLogger } from '../logger.js'
import { MigrationsConfig, runUpMigrations } from '../migrations.js'
import { readGamestateData } from './gamestateReader.js'
import { ParserConfig } from './parserConfig.js'
import { getParserOptions } from './parserOptions.js'

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
      logger.info('Parser iteration started')

      const gamestateData = await readGamestateData(ironmanPath)
      const jomini = await Jomini.initialize()
      const _parsed = jomini.parseText(gamestateData)
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

const logger = getLogger()
runParser(logger).catch((error: unknown) => {
  logger.error(error)
})
