import type { GamestateResolvers } from './types.generated.js'
import {
  AllPlanetCoordinate,
  Budget,
  DiplomaticRelation,
  Empire,
  Planet,
} from './validation.generated.js'

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

  empires: async (parent, _args, context) => {
    const cacheKey = `empires:gamestateId:${parent.gamestateId}`
    const cached = await context.cache.get(cacheKey)

    if (cached) {
      return JSON.parse(cached) as Empire[]
    }

    const empires = await context.loaders.empires.load(parent.gamestateId)

    await context.cache.set(cacheKey, JSON.stringify(empires))

    return empires
  },

  playerEmpire: async (parent, _args, context) => {
    const cacheKey = `playerEmpire:gamestateId:${parent.gamestateId}`
    const cached = await context.cache.get(cacheKey)

    if (cached) {
      const parsed = JSON.parse(cached) as Empire | null
      return parsed
    }

    const playerEmpire = await context.loaders.playerEmpire.load(
      parent.gamestateId,
    )

    await context.cache.set(cacheKey, JSON.stringify(playerEmpire))

    return playerEmpire
  },

  diplomaticRelations: async (parent, _args, context) => {
    const cacheKey = `diplomaticRelations:gamestateId:${parent.gamestateId}`
    const cached = await context.cache.get(cacheKey)

    if (cached) {
      return JSON.parse(cached) as DiplomaticRelation[]
    }

    const relations = await context.loaders.diplomaticRelations.load(
      parent.gamestateId,
    )

    await context.cache.set(cacheKey, JSON.stringify(relations))

    return relations
  },

  allPlanetCoordinates: async (parent, _args, context) => {
    const cacheKey = `allPlanetCoordinates:gamestateId:${parent.gamestateId}`
    const cached = await context.cache.get(cacheKey)

    if (cached) {
      return JSON.parse(cached) as AllPlanetCoordinate[]
    }

    const coordinates = await context.loaders.allPlanetCoordinates.load(
      parent.gamestateId,
    )

    await context.cache.set(cacheKey, JSON.stringify(coordinates))

    return coordinates
  },
}
