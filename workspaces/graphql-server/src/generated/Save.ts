import { emptyBudget } from '@stellaris-stats/shared/budget'
import { getGamestates } from '@stellaris-stats/shared/gamestate'
import type { SaveResolvers } from './types.generated.js'

export const Save: SaveResolvers = {
  gamestates: async (parent, _args, context) =>
    (await getGamestates(context.client, parent.saveId)).map((gamestate) => ({
      ...gamestate,
      planets: [],
      budget: emptyBudget,
    })),
}
