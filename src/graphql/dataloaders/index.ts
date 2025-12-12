import { PoolClient } from 'pg'
import { createGamestatesLoader } from './gamestatesLoader.js'
import { createBudgetLoader } from './budgetLoader.js'
import { createPlanetsLoader } from './planetsLoader.js'

export const createDataLoaders = (client: PoolClient) => ({
  gamestates: createGamestatesLoader(client),
  budget: createBudgetLoader(client),
  planets: createPlanetsLoader(client),
})

export type DataLoaders = ReturnType<typeof createDataLoaders>
