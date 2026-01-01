import { describe, expect, it } from 'bun:test'
import { readGamestateData } from '../../src/parser/gamestateReader.js'

describe('Gamestate Reader', () => {
  const fixturesDir = 'tests/parser/fixtures'

  describe('readGamestateData', () => {
    it('extracts gamestate from valid zip file', async () => {
      const result = await readGamestateData(`${fixturesDir}/test-save.zip`)

      expect(result).toBeInstanceOf(Uint8Array)
      expect(result.length).toBeGreaterThan(0)

      const text = new TextDecoder().decode(result)
      expect(text).toContain('name')
      expect(text).toContain('Test')
    })

    it('returns content as Uint8Array', async () => {
      const result = await readGamestateData(`${fixturesDir}/test-save.zip`)

      expect(result).toBeInstanceOf(Uint8Array)
      const parsed = JSON.parse(new TextDecoder().decode(result)) as {
        name: string
        date: string
      }
      expect(parsed.name).toBe('Test')
      expect(parsed.date).toBe('2200.01.01')
    })

    it('throws error when gamestate file not found in zip', async () => {
      await expect(
        readGamestateData(`${fixturesDir}/test-no-gamestate.zip`),
      ).rejects.toThrow('gamestate file not found in zip')
    })

    it('throws error when zip file does not exist', async () => {
      await expect(
        readGamestateData(`${fixturesDir}/nonexistent.zip`),
      ).rejects.toThrow()
    })
  })
})
