import { emptyBudget } from '../../db/budget.js'
import { getGamestates } from '../../db/gamestate.js'
import type { SaveResolvers } from './types.generated.js'

export const Save: SaveResolvers = {
  gamestates: async (parent, _args, context) =>
    (await getGamestates(context.client, parent.saveId)).map((gamestate) => ({
      ...gamestate,
      planets: [],
      budget: emptyBudget,
    })),
}
