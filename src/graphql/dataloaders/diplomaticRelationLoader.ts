import DataLoader from 'dataloader'
import { PoolClient } from 'pg'
import { getDiplomaticRelationsBatch } from '../../db/diplomaticRelation.js'
import { DiplomaticRelation } from '../generated/validation.generated.js'

export const createDiplomaticRelationsLoader = (client: PoolClient) =>
  new DataLoader<number, DiplomaticRelation[]>(
    async (gamestateIds) => {
      const batchResults = await getDiplomaticRelationsBatch(
        client,
        gamestateIds,
      )
      return gamestateIds.map(
        (gamestateId) => batchResults.get(gamestateId) ?? [],
      )
    },
    { cache: true },
  )
