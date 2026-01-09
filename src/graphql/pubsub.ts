import { PubSub } from 'graphql-subscriptions'
import { Redis } from 'ioredis'
import { Gamestate } from './generated/types.generated.js'

export const GAMESTATE_CREATED = 'GAMESTATE_CREATED'

export interface GamestateCreatedPayload {
  saveId: number
  gamestate: Gamestate
}

let pubsubInstance: PubSub | null = null

export const getPubSub = (): PubSub => {
  pubsubInstance ??= new PubSub()
  return pubsubInstance
}

export const publishGamestateCreated = async (
  redisClient: Redis,
  saveId: number,
  gamestate: Gamestate,
): Promise<void> => {
  const payload: GamestateCreatedPayload = { saveId, gamestate }
  await redisClient.publish(GAMESTATE_CREATED, JSON.stringify(payload))
}

export const subscribeToGamestateCreated = async (
  redisClient: Redis,
  saveId: number,
): Promise<AsyncIterable<{ gamestateCreated: Gamestate }>> => {
  const pubsub = getPubSub()
  const subscriber = redisClient.duplicate()

  await subscriber.subscribe(GAMESTATE_CREATED)

  subscriber.on('message', (_channel: string, message: string) => {
    const payload = JSON.parse(message) as GamestateCreatedPayload
    if (payload.saveId === saveId) {
      pubsub
        .publish(`${GAMESTATE_CREATED}.${saveId}`, {
          gamestateCreated: payload.gamestate,
        })
        .catch((error: unknown) => {
          console.error('Failed to publish gamestate created event:', error)
        })
    }
  })

  return pubsub.asyncIterableIterator<{ gamestateCreated: Gamestate }>(
    `${GAMESTATE_CREATED}.${saveId}`,
  )
}
