import { Command } from 'commander'
import { access, readdir } from 'fs/promises'
import { Logger } from 'pino'
import { z } from 'zod/v4'

export const getParserOptions = async (logger: Logger) => {
  const program = new Command()

  program.option('--list-saves', 'List all gamestate IDs')
  program.option('--gamestate <id>', 'Gamestate ID')
  program.parse()

  const options = program.opts()

  if (options.listSaves) {
    const entries = await readdir('/stellaris-data', { withFileTypes: true })
    const directories = entries
      .filter((entry) => entry.isDirectory())
      .map((entry) => entry.name)

    directories.forEach((dir) => {
      logger.info(dir)
    })
    return
  }

  if (!options.gamestate) {
    throw new Error('Either --list-saves or --gamestate option is required')
  }

  const gamestateId = z.string().parse(options.gamestate)
  const ironmanPath = `/stellaris-data/${gamestateId}/ironman.sav`

  try {
    await access(ironmanPath)
  } catch {
    throw new Error(
      `Gamestate ID '${gamestateId}' does not exist: file not found at ${ironmanPath}`,
    )
  }

  return { gamestateId, ironmanPath }
}
