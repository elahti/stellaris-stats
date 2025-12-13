import z from 'zod/v4'

export const TestDbAdminConfig = z.object({
  host: z.string(),
  port: z.coerce.number(),
  user: z.string(),
  password: z.string(),
  adminDatabase: z.string(),
})

export type TestDbAdminConfig = z.infer<typeof TestDbAdminConfig>

export const TestRedisConfig = z.object({
  host: z.string(),
  port: z.coerce.number(),
  db: z.coerce.number(),
})

export type TestRedisConfig = z.infer<typeof TestRedisConfig>

export const getTestDbAdminConfig = (): TestDbAdminConfig =>
  TestDbAdminConfig.parse({
    host: process.env.STELLARIS_TEST_DB_HOST,
    port: process.env.STELLARIS_TEST_DB_PORT,
    user: process.env.STELLARIS_TEST_DB_USER,
    password: process.env.STELLARIS_TEST_DB_PASSWORD,
    adminDatabase: process.env.STELLARIS_TEST_DB_ADMIN_DATABASE,
  })

export const getTestRedisConfig = (): TestRedisConfig =>
  TestRedisConfig.parse({
    host: process.env.STELLARIS_TEST_REDIS_HOST,
    port: process.env.STELLARIS_TEST_REDIS_PORT,
    db: process.env.STELLARIS_TEST_REDIS_DB,
  })
