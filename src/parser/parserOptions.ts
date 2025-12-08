import { Command } from 'commander'
import { access, readdir } from 'fs/promises'
import { Logger } from 'pino'
import { z } from 'zod/v4'

export const getParserOptions = async (logger: Logger) => {
  const program = new Command()

  program.option('-l, --list', 'List all gamestate IDs')
  program.option('-g, --gamestateId <id>', 'Gamestate ID')
  program.parse()

  const options = program.opts()

  if (options.list) {
    const entries = await readdir('/stellaris-data', { withFileTypes: true })
    const directories = entries
      .filter((entry) => entry.isDirectory())
      .map((entry) => entry.name)

    directories.forEach((dir) => {
      logger.info(dir)
    })
    return
  }

  if (!options.gamestateId) {
    throw new Error('Either -l or -g option is required')
  }

  const gamestateId = z.string().parse(options.gamestateId)
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
