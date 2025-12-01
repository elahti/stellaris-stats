import { Writable } from 'stream'
import { pipeline } from 'stream/promises'
import { open } from 'yauzl-promise'

export const readGamestateData = async (
  zipFilePath: string,
): Promise<Uint8Array> => {
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
