import DataLoader from 'dataloader'
import { PoolClient } from 'pg'
import { getPlanetsBatch } from '../../db/planetsBatch.js'
import { Planet } from '../generated/validation.generated.js'

export const createPlanetsLoader = (client: PoolClient) =>
  new DataLoader<number, Planet[]>(
    async (gamestateIds) => {
      const batchResults = await getPlanetsBatch(client, gamestateIds)
      return gamestateIds.map(
        (gamestateId) => batchResults.get(gamestateId) ?? [],
      )
    },
    { cache: true },
  )
