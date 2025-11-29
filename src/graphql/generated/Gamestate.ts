import { getBudgetByGamestateId } from '../../db/budget.js'
import type { GamestateResolvers } from './types.generated.js'
export const Gamestate: GamestateResolvers = {
  budget: async (parent, _args, context) =>
    await getBudgetByGamestateId(context.client, parent.gamestateId),
}
