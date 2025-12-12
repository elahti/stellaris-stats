import type { GamestateResolvers } from './types.generated.js'

export const Gamestate: GamestateResolvers = {
  budget: async (parent, _args, context) =>
    await context.loaders.budget.load(parent.gamestateId),

  planets: async (parent, _args, context) =>
    await context.loaders.planets.load(parent.gamestateId),
}
