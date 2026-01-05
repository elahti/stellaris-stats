import DataLoader from 'dataloader'
import { PoolClient } from 'pg'
import { getAllPlanetCoordinatesBatch } from '../../db/allPlanetCoordinates.js'
import { AllPlanetCoordinate } from '../generated/validation.generated.js'

export const createAllPlanetCoordinatesLoader = (client: PoolClient) =>
  new DataLoader<number, AllPlanetCoordinate[]>(
    async (gamestateIds) => {
      const batchResults = await getAllPlanetCoordinatesBatch(
        client,
        gamestateIds,
      )
      return gamestateIds.map(
        (gamestateId) => batchResults.get(gamestateId) ?? [],
      )
    },
    { cache: true },
  )
