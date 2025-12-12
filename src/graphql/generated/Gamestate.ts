import type { GamestateResolvers } from './types.generated.js'
import type { Budget, Planet } from './types.generated.js'

export const Gamestate: GamestateResolvers = {
  budget: async (parent, _args, context) => {
    const cacheKey = `budget:gamestateId:${parent.gamestateId}`
    const cached = await context.cache.get(cacheKey)

    if (cached) {
      return JSON.parse(cached) as Budget
    }

    const budget = await context.loaders.budget.load(parent.gamestateId)

    await context.cache.set(cacheKey, JSON.stringify(budget))

    return budget
  },

  planets: async (parent, _args, context) => {
    const cacheKey = `planets:gamestateId:${parent.gamestateId}`
    const cached = await context.cache.get(cacheKey)

    if (cached) {
      return JSON.parse(cached) as Planet[]
    }

    const planets = await context.loaders.planets.load(parent.gamestateId)

    await context.cache.set(cacheKey, JSON.stringify(planets))

    return planets
  },
}
