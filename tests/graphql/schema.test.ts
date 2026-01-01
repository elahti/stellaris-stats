import { describe, expect, it } from 'bun:test'
import { readFileSync } from 'fs'
import { buildSchema, parse, GraphQLSchema } from 'graphql'
import path from 'path'

describe('GraphQL Schema', () => {
  const schemaPath = path.join(process.cwd(), 'graphql/schema.graphql')
  const schemaSDL = readFileSync(schemaPath, 'utf-8')

  describe('Schema Parsing', () => {
    it('parses without syntax errors', () => {
      expect(() => parse(schemaSDL)).not.toThrow()
    })

    it('builds a valid schema', () => {
      const schema = buildSchema(schemaSDL)
      expect(schema).toBeInstanceOf(GraphQLSchema)
    })
  })

  describe('Required Types', () => {
    const schema = buildSchema(schemaSDL)

    it('defines Save type', () => {
      const saveType = schema.getType('Save')
      expect(saveType).toBeDefined()
    })

    it('defines Gamestate type', () => {
      const gamestateType = schema.getType('Gamestate')
      expect(gamestateType).toBeDefined()
    })

    it('defines Budget type', () => {
      const budgetType = schema.getType('Budget')
      expect(budgetType).toBeDefined()
    })

    it('defines BudgetCategory type', () => {
      const budgetCategoryType = schema.getType('BudgetCategory')
      expect(budgetCategoryType).toBeDefined()
    })

    it('defines BudgetEntry type', () => {
      const budgetEntryType = schema.getType('BudgetEntry')
      expect(budgetEntryType).toBeDefined()
    })

    it('defines Planet type', () => {
      const planetType = schema.getType('Planet')
      expect(planetType).toBeDefined()
    })

    it('defines Query type', () => {
      const queryType = schema.getQueryType()
      expect(queryType).toBeDefined()
    })
  })

  describe('Query Root', () => {
    const schema = buildSchema(schemaSDL)
    const queryType = schema.getQueryType()

    it('has saves field', () => {
      const savesField = queryType?.getFields().saves
      expect(savesField).toBeDefined()
    })

    it('has save field with filename argument', () => {
      const saveField = queryType?.getFields().save
      expect(saveField).toBeDefined()

      const args = saveField?.args ?? []
      const filenameArg = args.find((arg) => arg.name === 'filename')
      expect(filenameArg).toBeDefined()
    })
  })

  describe('Save Type Fields', () => {
    const schema = buildSchema(schemaSDL)
    const saveType = schema.getType('Save') as
      | import('graphql').GraphQLObjectType
      | undefined

    it('has required fields', () => {
      const fields = saveType?.getFields()

      expect(fields?.saveId).toBeDefined()
      expect(fields?.filename).toBeDefined()
      expect(fields?.name).toBeDefined()
      expect(fields?.gamestates).toBeDefined()
    })
  })

  describe('Gamestate Type Fields', () => {
    const schema = buildSchema(schemaSDL)
    const gamestateType = schema.getType('Gamestate') as
      | import('graphql').GraphQLObjectType
      | undefined

    it('has required fields', () => {
      const fields = gamestateType?.getFields()

      expect(fields?.gamestateId).toBeDefined()
      expect(fields?.date).toBeDefined()
      expect(fields?.planets).toBeDefined()
      expect(fields?.budget).toBeDefined()
    })
  })

  describe('Budget Type Fields', () => {
    const schema = buildSchema(schemaSDL)
    const budgetType = schema.getType('Budget') as
      | import('graphql').GraphQLObjectType
      | undefined

    it('has income, expenses, and balance fields', () => {
      const fields = budgetType?.getFields()

      expect(fields?.income).toBeDefined()
      expect(fields?.expenses).toBeDefined()
      expect(fields?.balance).toBeDefined()
    })
  })

  describe('BudgetEntry Type Fields', () => {
    const schema = buildSchema(schemaSDL)
    const budgetEntryType = schema.getType('BudgetEntry') as
      | import('graphql').GraphQLObjectType
      | undefined

    it('has core resource fields', () => {
      const fields = budgetEntryType?.getFields()

      expect(fields?.energy).toBeDefined()
      expect(fields?.minerals).toBeDefined()
      expect(fields?.food).toBeDefined()
      expect(fields?.alloys).toBeDefined()
      expect(fields?.consumerGoods).toBeDefined()
    })

    it('has research resource fields', () => {
      const fields = budgetEntryType?.getFields()

      expect(fields?.physicsResearch).toBeDefined()
      expect(fields?.societyResearch).toBeDefined()
      expect(fields?.engineeringResearch).toBeDefined()
    })

    it('has strategic resource fields', () => {
      const fields = budgetEntryType?.getFields()

      expect(fields?.exoticGases).toBeDefined()
      expect(fields?.rareCrystals).toBeDefined()
      expect(fields?.volatileMotes).toBeDefined()
      expect(fields?.srDarkMatter).toBeDefined()
      expect(fields?.srLivingMetal).toBeDefined()
      expect(fields?.srZro).toBeDefined()
    })

    it('has exactly 20 resource fields', () => {
      const fields = budgetEntryType?.getFields()
      const fieldCount = Object.keys(fields ?? {}).length
      expect(fieldCount).toBe(20)
    })
  })

  describe('Cache Control Directive', () => {
    it('defines cacheControl directive', () => {
      expect(schemaSDL).toContain('directive @cacheControl')
    })

    it('cacheControl has maxAge argument', () => {
      expect(schemaSDL).toContain('maxAge: Int')
    })

    it('cacheControl has scope argument', () => {
      expect(schemaSDL).toContain('scope: CacheControlScope')
    })

    it('defines CacheControlScope enum', () => {
      expect(schemaSDL).toContain('enum CacheControlScope')
      expect(schemaSDL).toContain('PUBLIC')
      expect(schemaSDL).toContain('PRIVATE')
    })

    it('BudgetEntry uses cacheControl directive', () => {
      expect(schemaSDL).toContain('type BudgetEntry @cacheControl')
    })

    it('Gamestate uses cacheControl directive', () => {
      expect(schemaSDL).toContain('type Gamestate @cacheControl')
    })

    it('Budget uses cacheControl directive', () => {
      expect(schemaSDL).toContain('type Budget @cacheControl')
    })
  })

  describe('Custom Scalars', () => {
    it('defines DateTimeISO scalar', () => {
      expect(schemaSDL).toContain('scalar DateTimeISO')
    })
  })
})
