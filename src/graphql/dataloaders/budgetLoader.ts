import DataLoader from 'dataloader'
import { PoolClient } from 'pg'
import { getBudgetBatch, emptyBudget } from '../../db/budget.js'
import { Budget } from '../generated/validation.generated.js'

export const createBudgetLoader = (client: PoolClient) =>
  new DataLoader<number, Budget>(
    async (gamestateIds) => {
      const batchResults = await getBudgetBatch(client, gamestateIds)
      return gamestateIds.map(
        (gamestateId) => batchResults.get(gamestateId) ?? emptyBudget(),
      )
    },
    { cache: true },
  )
