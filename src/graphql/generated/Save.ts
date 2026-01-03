import { emptyBudget } from '../../db/budget.js'
import type { SaveResolvers } from './types.generated.js'

export const Save: SaveResolvers = {
  gamestates: async (parent, _args, context) =>
    (await context.loaders.gamestates.load(parent.saveId)).map((gamestate) => ({
      ...gamestate,
      planets: [],
      budget: emptyBudget(),
      empires: [],
      playerEmpire: null,
      diplomaticRelations: [],
      allPlanetCoordinates: [],
    })),
}
