import { getBudgetByGamestateId } from '../../db/budget.js'
import { getPlanetsByGamestateId } from '../../db/planets.js'
import type { GamestateResolvers } from './types.generated.js'
export const Gamestate: GamestateResolvers = {
  budget: async (parent, _args, context) =>
    await getBudgetByGamestateId(context.client, parent.gamestateId),

  planets: async (parent, _args, context) =>
    await getPlanetsByGamestateId(context.client, parent.gamestateId),
}
