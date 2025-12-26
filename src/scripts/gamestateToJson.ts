import { Command } from 'commander'
import { access, mkdir, readdir, unlink, writeFile } from 'fs/promises'
import { Jomini } from 'jomini'
import { z } from 'zod/v4'
import { DbConfig, getDbPool } from '../db.js'
import { getGamestateData } from '../db/gamestates.js'
import { getSaves } from '../db/save.js'
import { readGamestateData } from '../parser/gamestateReader.js'

const writeGamestateJson = async (
  parsed: Record<string, unknown>,
  outputDir: string,
) => {
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

const handleListSavesFromFilesystem = async () => {
  const entries = await readdir('/stellaris-data', { withFileTypes: true })
  const directories = entries
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)

  for (const dir of directories) {
    console.log(dir)
  }
}

const handleListSavesFromDb = async () => {
  const config = DbConfig.parse(process.env)
  const pool = getDbPool(config)

  try {
    const client = await pool.connect()
    try {
      const saves = await getSaves(client)
      for (const save of saves) {
        console.log(save.filename)
      }
    } finally {
      client.release()
    }
  } finally {
    await pool.end()
  }
}

const handleGamestateFromFile = async (filename: string) => {
  const ironmanPath = `/stellaris-data/${filename}/ironman.sav`

  try {
    await access(ironmanPath)
  } catch {
    throw new Error(
      `Save '${filename}' does not exist: file not found at ${ironmanPath}`,
    )
  }

  const gamestateData = await readGamestateData(ironmanPath)
  const parsed = (await Jomini.initialize()).parseText(gamestateData) as Record<
    string,
    unknown
  >
  const date = z.coerce.date().parse(parsed.date)
  const dateStr = date.toISOString().split('T')[0]
  const outputDir = `/workspace/gamestate-json-data/${filename}/${dateStr}`

  await writeGamestateJson(parsed, outputDir)
  console.log(`Wrote gamestate JSON files to ${outputDir}`)
}

const handleGamestateFromDb = async (filename: string, dateStr: string) => {
  const date = z.coerce.date().parse(dateStr)
  const config = DbConfig.parse(process.env)
  const pool = getDbPool(config)

  try {
    const client = await pool.connect()
    try {
      const data = await getGamestateData(client, filename, date)
      if (!data) {
        throw new Error(
          `No gamestate found for save '${filename}' at date '${dateStr}'`,
        )
      }

      const outputDateStr = date.toISOString().split('T')[0]
      const outputDir = `/workspace/gamestate-json-data/${filename}/${outputDateStr}`

      await writeGamestateJson(data, outputDir)
      console.log(`Wrote gamestate JSON files to ${outputDir}`)
    } finally {
      client.release()
    }
  } finally {
    await pool.end()
  }
}

const main = async () => {
  const program = new Command()

  program.option('--list-saves', 'List all save filenames')
  program.option('--filename <name>', 'Save filename to read gamestate from')
  program.option('--db', 'Use database instead of filesystem')
  program.option(
    '--date <date>',
    'Date in YYYY-MM-DD format (required with --db --filename)',
  )
  program.parse()

  const options = program.opts()

  if (options.listSaves) {
    if (options.db) {
      await handleListSavesFromDb()
    } else {
      await handleListSavesFromFilesystem()
    }
    return
  }

  if (options.filename) {
    const filename = z.string().parse(options.filename)
    if (options.db) {
      if (!options.date) {
        throw new Error('--date is required when using --db with --filename')
      }
      const dateStr = z.string().parse(options.date)
      await handleGamestateFromDb(filename, dateStr)
    } else {
      await handleGamestateFromFile(filename)
    }
    return
  }

  throw new Error('Either --list-saves or --filename is required')
}

main().catch((error: unknown) => {
  console.error(error)
  throw error
})
