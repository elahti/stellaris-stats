import { subscribeToGamestateCreated } from '../../pubsub.js'
import type { SubscriptionResolvers } from './../types.generated.js'

export const gamestateCreated: NonNullable<
  SubscriptionResolvers['gamestateCreated']
> = {
  subscribe: async (_parent, { saveId }, ctx) =>
    subscribeToGamestateCreated(ctx.redisClient, saveId),
}
