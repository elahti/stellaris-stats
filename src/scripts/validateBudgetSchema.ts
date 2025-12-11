import { readFile } from 'fs/promises'
import { z } from 'zod/v4'
import { DbConfig, getDbPool, toCamelCase } from '../db.js'

const categoryTypes = ['income', 'expenses', 'balance'] as const

const BudgetEntryDataSchema = z.record(z.string(), z.number().optional())

const GamestateRowSchema = z.object({
  gamestate_id: z.number(),
  budget_current_month: z.record(
    z.string(),
    z.record(z.string(), BudgetEntryDataSchema),
  ),
})

const ColumnSchema = z.object({
  column_name: z.string(),
})

const main = async (): Promise<void> => {
  const dbConfig = DbConfig.parse(process.env)
  const pool = getDbPool(dbConfig)

  try {
    const gamestatesResult = await pool.query(`
      SELECT
        gamestate_id,
        data -> 'country' -> (data -> 'player' -> 0 ->> 'country')
          -> 'budget' -> 'current_month' AS budget_current_month
      FROM gamestate
      WHERE data -> 'country' -> (data -> 'player' -> 0 ->> 'country')
        -> 'budget' -> 'current_month' IS NOT NULL
      LIMIT 100
    `)

    const gamestateRows = z
      .array(GamestateRowSchema)
      .parse(gamestatesResult.rows)

    const budgetEntryFields = new Set<string>()
    const budgetCategoryNames = new Set<string>()

    for (const gamestateRow of gamestateRows) {
      const budgetData = gamestateRow.budget_current_month

      for (const categoryType of categoryTypes) {
        const categoryData = budgetData[categoryType]

        if (!categoryData) {
          continue
        }

        for (const categoryName of Object.keys(categoryData)) {
          budgetCategoryNames.add(categoryName)

          const entryData = categoryData[categoryName]

          if (!entryData) {
            continue
          }

          for (const fieldName of Object.keys(entryData)) {
            budgetEntryFields.add(fieldName)
          }
        }
      }
    }

    const dbColumnsResult = await pool.query(
      `
      SELECT column_name
      FROM information_schema.columns
      WHERE table_name = 'budget_entry'
        AND table_schema = 'public'
    `,
    )

    const dbColumns = z
      .array(ColumnSchema)
      .parse(dbColumnsResult.rows)
      .map((row) => row.column_name)
      .filter((col) => col !== 'budget_entry_id')

    const graphqlSchemaPath = '/workspace/graphql/schema.graphql'
    const graphqlSchema = await readFile(graphqlSchemaPath, 'utf-8')

    const budgetEntryRegex = /type BudgetEntry \{([^}]+)\}/s
    const budgetCategoryRegex = /type BudgetCategory \{([^}]+)\}/s

    const budgetEntryMatch = budgetEntryRegex.exec(graphqlSchema)
    const budgetCategoryMatch = budgetCategoryRegex.exec(graphqlSchema)

    if (!budgetEntryMatch?.[1]) {
      throw new Error('Could not find BudgetEntry type in GraphQL schema')
    }

    if (!budgetCategoryMatch?.[1]) {
      throw new Error('Could not find BudgetCategory type in GraphQL schema')
    }

    const budgetEntryGraphqlFields = budgetEntryMatch[1]
      .split('\n')
      .map((line) => line.trim())
      .filter((line) => line && !line.startsWith('#'))
      .map((line) => {
        const fieldRegex = /^(\w+):/
        const match = fieldRegex.exec(line)
        return match ? match[1] : null
      })
      .filter((field): field is string => field !== null)

    const budgetCategoryGraphqlFields = budgetCategoryMatch[1]
      .split('\n')
      .map((line) => line.trim())
      .filter((line) => line && !line.startsWith('#'))
      .map((line) => {
        const fieldRegex = /^(\w+):/
        const match = fieldRegex.exec(line)
        return match ? match[1] : null
      })
      .filter((field): field is string => field !== null)

    const missingDbColumns: string[] = []
    const missingGraphqlEntryFields: string[] = []
    const missingGraphqlCategoryFields: string[] = []

    for (const field of budgetEntryFields) {
      if (!dbColumns.includes(field)) {
        missingDbColumns.push(field)
      }

      const camelCaseField = toCamelCase(field)
      if (!budgetEntryGraphqlFields.includes(camelCaseField)) {
        missingGraphqlEntryFields.push(camelCaseField)
      }
    }

    for (const categoryName of budgetCategoryNames) {
      const camelCaseName = toCamelCase(categoryName)
      if (!budgetCategoryGraphqlFields.includes(camelCaseName)) {
        missingGraphqlCategoryFields.push(camelCaseName)
      }
    }

    console.log('\n=== Budget Schema Validation Results ===\n')
    console.log(
      `Found ${budgetEntryFields.size} unique budget entry fields in gamestate data`,
    )
    console.log(
      `Found ${budgetCategoryNames.size} unique budget category names in gamestate data`,
    )
    console.log(`Found ${dbColumns.length} columns in budget_entry table`)
    console.log(
      `Found ${budgetEntryGraphqlFields.length} fields in BudgetEntry GraphQL type`,
    )
    console.log(
      `Found ${budgetCategoryGraphqlFields.length} fields in BudgetCategory GraphQL type`,
    )

    if (missingDbColumns.length > 0) {
      console.log('\n❌ Missing columns in budget_entry table:')
      for (const col of missingDbColumns.sort()) {
        console.log(`  - ${col}`)
      }
    } else {
      console.log(
        '\n✅ All budget entry fields have corresponding database columns',
      )
    }

    if (missingGraphqlEntryFields.length > 0) {
      console.log('\n❌ Missing fields in BudgetEntry GraphQL type:')
      for (const field of missingGraphqlEntryFields.sort()) {
        console.log(`  - ${field}`)
      }
    } else {
      console.log(
        '\n✅ All budget entry fields have corresponding GraphQL fields',
      )
    }

    if (missingGraphqlCategoryFields.length > 0) {
      console.log('\n❌ Missing fields in BudgetCategory GraphQL type:')
      for (const field of missingGraphqlCategoryFields.sort()) {
        console.log(`  - ${field}`)
      }
    } else {
      console.log(
        '\n✅ All budget category names have corresponding GraphQL fields',
      )
    }

    if (
      missingDbColumns.length === 0
      && missingGraphqlEntryFields.length === 0
      && missingGraphqlCategoryFields.length === 0
    ) {
      console.log('\n🎉 All validations passed!')
    } else {
      console.log(
        '\n⚠️  Some validations failed. Please update the schema accordingly.',
      )
    }
  } finally {
    await pool.end()
  }
}

main().catch((error: unknown) => {
  console.error('Error:', error)
  throw error
})
