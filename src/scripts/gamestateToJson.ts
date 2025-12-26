import { access, mkdir, readdir, unlink, writeFile } from 'fs/promises'
import { Jomini } from 'jomini'
import { z } from 'zod/v4'
import { getLogger } from '../logger.js'
import { readGamestateData } from '../parser/gamestateReader.js'
import { getParserOptions } from '../parser/parserOptions.js'

const main = async () => {
  const logger = getLogger()
  const parserOptions = await getParserOptions(logger)
  if (parserOptions === undefined) {
    return
  }
  const { gamestateId, ironmanPath } = parserOptions
  const gamestateData = await readGamestateData(ironmanPath)
  const parsed = (await Jomini.initialize()).parseText(gamestateData)
  const date = z.coerce.date().parse(parsed.date)
  const dateStr = date.toISOString().split('T')[0]
  const outputDir = `/workspace/gamestate-json-data/gamestate/${gamestateId}/${dateStr}`

  let directoryExists = false
  try {
    await access(outputDir)
    directoryExists = true
  } catch {
    await mkdir(outputDir, { recursive: true })
  }

  if (directoryExists) {
    const entries = await readdir(outputDir, { withFileTypes: true })
    const jsonFiles = entries
      .filter((entry) => entry.isFile() && entry.name.endsWith('.json'))
      .map((entry) => entry.name)

    for (const file of jsonFiles) {
      await unlink(`${outputDir}/${file}`)
    }
  }

  for (const [key, value] of Object.entries(parsed)) {
    const filePath = `${outputDir}/${key}.json`
    await writeFile(filePath, JSON.stringify(value, null, 2))
  }
}

main().catch((error: unknown) => {
  console.error(error)
  throw error
})
