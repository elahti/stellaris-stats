import { access, mkdir, readdir, unlink, writeFile } from 'fs/promises'
import { Jomini } from 'jomini'
import { readGamestateData } from '../parser/gamestateReader.js'
import { getParserOptions } from '../parser/parserOptions.js'

const main = async () => {
  const parserOptions = await getParserOptions()
  if (parserOptions === undefined) {
    return
  }
  const { gamestateId, ironmanPath } = parserOptions
  const gamestateData = await readGamestateData(ironmanPath)
  const outputDir = `/workspace/gamestate-json-data/${gamestateId}`

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

  const parsed = (await Jomini.initialize()).parseText(gamestateData)
  for (const [key, value] of Object.entries(parsed)) {
    const filePath = `${outputDir}/${key}.json`
    await writeFile(filePath, JSON.stringify(value, null, 2))
  }
}

main().catch((error: unknown) => {
  console.error(error)
  throw error
})
