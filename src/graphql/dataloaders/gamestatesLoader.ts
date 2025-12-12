import DataLoader from 'dataloader'
import { PoolClient } from 'pg'
import { getGamestatesBatch } from '../../db/gamestatesBatch.js'
import { Gamestate } from '../generated/validation.generated.js'

export const createGamestatesLoader = (client: PoolClient) =>
  new DataLoader<number, Pick<Gamestate, 'gamestateId' | 'date'>[]>(
    async (saveIds) => {
      const batchResults = await getGamestatesBatch(client, saveIds)
      return saveIds.map((saveId) => batchResults.get(saveId) ?? [])
    },
    { cache: true },
  )
