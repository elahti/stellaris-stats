import DataLoader from 'dataloader'
import { PoolClient } from 'pg'
import { getPlanetCoordinatesBatch } from '../../db/planetCoordinate.js'
import { Coordinate } from '../generated/validation.generated.js'

export const createPlanetCoordinatesLoader = (client: PoolClient) =>
  new DataLoader<number, Map<string, Coordinate>>(
    async (gamestateIds) => {
      const batchResults = await getPlanetCoordinatesBatch(client, gamestateIds)
      return gamestateIds.map(
        (gamestateId) => batchResults.get(gamestateId) ?? new Map(),
      )
    },
    { cache: true },
  )
