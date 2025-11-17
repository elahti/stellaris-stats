import { Command } from 'commander'
import { access, mkdir, readdir, unlink, writeFile } from 'fs/promises'
import { Jomini } from 'jomini'
import { Writable } from 'stream'
import { pipeline } from 'stream/promises'
import { open } from 'yauzl-promise'
import { z } from 'zod'

const getGamestateData = async (zipFilePath: string): Promise<Uint8Array> => {
  const zipFile = await open(zipFilePath)

  try {
    for await (const entry of zipFile) {
      if (entry.filename === 'gamestate') {
        const readStream = await entry.openReadStream()
        const chunks: Buffer[] = []

        const writableStream = new Writable({
          write(chunk: Buffer, _encoding, callback) {
            chunks.push(chunk)
            callback()
          },
        })

        await pipeline(readStream, writableStream)

        const buffer = Buffer.concat(chunks)
        return new Uint8Array(buffer)
      }
    }

    throw new Error('gamestate file not found in zip')
  } finally {
    await zipFile.close()
  }
}

const main = async () => {
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
      console.log(dir)
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

  const gamestateData = await getGamestateData(ironmanPath)
  const parsed = (await Jomini.initialize()).parseText(gamestateData)

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

  for (const [key, value] of Object.entries(parsed)) {
    const filePath = `${outputDir}/${key}.json`
    await writeFile(filePath, JSON.stringify(value, null, 2))
  }
}

main().catch((error: unknown) => {
  console.error(error)
  throw error
})
