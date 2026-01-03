import DataLoader from 'dataloader'
import { PoolClient } from 'pg'
import { getEmpiresBatch, getPlayerEmpireBatch } from '../../db/empire.js'
import { Empire } from '../generated/validation.generated.js'

export const createEmpiresLoader = (client: PoolClient) =>
  new DataLoader<number, Empire[]>(
    async (gamestateIds) => {
      const batchResults = await getEmpiresBatch(client, gamestateIds)
      return gamestateIds.map(
        (gamestateId) => batchResults.get(gamestateId) ?? [],
      )
    },
    { cache: true },
  )

export const createPlayerEmpireLoader = (client: PoolClient) =>
  new DataLoader<number, Empire | null>(
    async (gamestateIds) => {
      const batchResults = await getPlayerEmpireBatch(client, gamestateIds)
      return gamestateIds.map(
        (gamestateId) => batchResults.get(gamestateId) ?? null,
      )
    },
    { cache: true },
  )
