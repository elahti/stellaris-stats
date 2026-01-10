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

  describe('BudgetTotals Type', () => {
    const schema = buildSchema(schemaSDL)

    it('defines BudgetTotals type', () => {
      const budgetTotalsType = schema.getType('BudgetTotals')
      expect(budgetTotalsType).toBeDefined()
    })

    it('has income, expenses, and balance fields', () => {
      const budgetTotalsType = schema.getType('BudgetTotals') as
        | import('graphql').GraphQLObjectType
        | undefined
      const fields = budgetTotalsType?.getFields()

      expect(fields?.income).toBeDefined()
      expect(fields?.expenses).toBeDefined()
      expect(fields?.balance).toBeDefined()
    })

    it('uses cacheControl directive', () => {
      expect(schemaSDL).toContain('type BudgetTotals @cacheControl')
    })
  })

  describe('Budget Type totals Field', () => {
    const schema = buildSchema(schemaSDL)
    const budgetType = schema.getType('Budget') as
      | import('graphql').GraphQLObjectType
      | undefined

    it('has totals field', () => {
      const fields = budgetType?.getFields()
      expect(fields?.totals).toBeDefined()
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

  describe('DiplomaticRelation Type', () => {
    const schema = buildSchema(schemaSDL)

    it('defines DiplomaticRelation type', () => {
      const diplomaticRelationType = schema.getType('DiplomaticRelation')
      expect(diplomaticRelationType).toBeDefined()
    })

    it('has required fields', () => {
      const diplomaticRelationType = schema.getType('DiplomaticRelation') as
        | import('graphql').GraphQLObjectType
        | undefined
      const fields = diplomaticRelationType?.getFields()

      expect(fields?.targetCountryId).toBeDefined()
      expect(fields?.targetEmpireName).toBeDefined()
      expect(fields?.opinion).toBeDefined()
      expect(fields?.trust).toBeDefined()
      expect(fields?.threat).toBeDefined()
      expect(fields?.isHostile).toBeDefined()
      expect(fields?.borderRange).toBeDefined()
      expect(fields?.hasContact).toBeDefined()
      expect(fields?.hasCommunications).toBeDefined()
      expect(fields?.opinionModifiers).toBeDefined()
    })

    it('uses cacheControl directive', () => {
      expect(schemaSDL).toContain('type DiplomaticRelation @cacheControl')
    })
  })

  describe('OpinionModifier Type', () => {
    const schema = buildSchema(schemaSDL)

    it('defines OpinionModifier type', () => {
      const opinionModifierType = schema.getType('OpinionModifier')
      expect(opinionModifierType).toBeDefined()
    })

    it('has required fields', () => {
      const opinionModifierType = schema.getType('OpinionModifier') as
        | import('graphql').GraphQLObjectType
        | undefined
      const fields = opinionModifierType?.getFields()

      expect(fields?.modifierType).toBeDefined()
      expect(fields?.value).toBeDefined()
    })
  })

  describe('AllPlanetCoordinate Type', () => {
    const schema = buildSchema(schemaSDL)

    it('defines AllPlanetCoordinate type', () => {
      const allPlanetCoordinateType = schema.getType('AllPlanetCoordinate')
      expect(allPlanetCoordinateType).toBeDefined()
    })

    it('has required fields', () => {
      const allPlanetCoordinateType = schema.getType('AllPlanetCoordinate') as
        | import('graphql').GraphQLObjectType
        | undefined
      const fields = allPlanetCoordinateType?.getFields()

      expect(fields?.planetId).toBeDefined()
      expect(fields?.x).toBeDefined()
      expect(fields?.y).toBeDefined()
      expect(fields?.systemId).toBeDefined()
    })
  })

  describe('Empire Type', () => {
    const schema = buildSchema(schemaSDL)

    it('defines Empire type', () => {
      const empireType = schema.getType('Empire')
      expect(empireType).toBeDefined()
    })

    it('has required fields', () => {
      const empireType = schema.getType('Empire') as
        | import('graphql').GraphQLObjectType
        | undefined
      const fields = empireType?.getFields()

      expect(fields?.countryId).toBeDefined()
      expect(fields?.name).toBeDefined()
      expect(fields?.isPlayer).toBeDefined()
      expect(fields?.capitalPlanetId).toBeDefined()
      expect(fields?.ownedPlanetCount).toBeDefined()
      expect(fields?.ownedPlanetIds).toBeDefined()
      expect(fields?.controlledPlanetCount).toBeDefined()
      expect(fields?.militaryPower).toBeDefined()
      expect(fields?.economyPower).toBeDefined()
      expect(fields?.techPower).toBeDefined()
    })
  })

  describe('Gamestate Neighbor Analysis Fields', () => {
    const schema = buildSchema(schemaSDL)
    const gamestateType = schema.getType('Gamestate') as
      | import('graphql').GraphQLObjectType
      | undefined

    it('has diplomaticRelations field', () => {
      const fields = gamestateType?.getFields()
      expect(fields?.diplomaticRelations).toBeDefined()
    })

    it('has allPlanetCoordinates field', () => {
      const fields = gamestateType?.getFields()
      expect(fields?.allPlanetCoordinates).toBeDefined()
    })

    it('has empires field', () => {
      const fields = gamestateType?.getFields()
      expect(fields?.empires).toBeDefined()
    })

    it('has playerEmpire field', () => {
      const fields = gamestateType?.getFields()
      expect(fields?.playerEmpire).toBeDefined()
    })
  })
})
