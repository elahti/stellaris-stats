import { readFile } from 'fs/promises'
import { join } from 'path'
import type { Pool } from 'pg'

const FIXTURES_DIR = '/workspace/tests/fixtures'

export const loadFixture = async (
  pool: Pool,
  fixturePath: string,
): Promise<void> => {
  const fullPath = join(FIXTURES_DIR, fixturePath)

  try {
    const sql = await readFile(fullPath, 'utf-8')
    await pool.query(sql)
  } catch (error: unknown) {
    throw new Error(
      `Failed to load fixture ${fixturePath}: ${error instanceof Error ? error.message : String(error)}`,
    )
  }
}

export const loadFixtures = async (
  pool: Pool,
  fixturePaths: string[],
): Promise<void> => {
  for (const path of fixturePaths) {
    await loadFixture(pool, path)
  }
}
