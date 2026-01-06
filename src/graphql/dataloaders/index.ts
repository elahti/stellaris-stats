import { PoolClient } from 'pg'
import { createAllPlanetCoordinatesLoader } from './allPlanetCoordinatesLoader.js'
import { createBudgetLoader } from './budgetLoader.js'
import { createDiplomaticRelationsLoader } from './diplomaticRelationLoader.js'
import {
  createEmpiresLoader,
  createPlayerEmpireLoader,
} from './empireLoader.js'
import { createGamestatesLoader } from './gamestatesLoader.js'
import { createPlanetsLoader } from './planetsLoader.js'

export const createDataLoaders = (client: PoolClient) => ({
  gamestates: createGamestatesLoader(client),
  budget: createBudgetLoader(client),
  planets: createPlanetsLoader(client),
  empires: createEmpiresLoader(client),
  playerEmpire: createPlayerEmpireLoader(client),
  diplomaticRelations: createDiplomaticRelationsLoader(client),
  allPlanetCoordinates: createAllPlanetCoordinatesLoader(client),
})

export type DataLoaders = ReturnType<typeof createDataLoaders>
