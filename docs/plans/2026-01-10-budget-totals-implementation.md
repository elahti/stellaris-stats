# Budget Totals Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add server-side budget aggregation so UI displays correct resource totals instead of only countryBase values.

**Architecture:** Add `BudgetTotals` type to GraphQL schema with `totals` field on `Budget`. The resolver computes sums from the already-cached budget data (no new cache keys needed). UI queries `budget.totals.balance` instead of `budget.balance.countryBase`.

**Tech Stack:** GraphQL (graphql-codegen), TypeScript, React, Bun test runner

---

## Task 1: Add BudgetTotals Type to Schema

**Files:**
- Modify: `graphql/schema.graphql:164-168`

**Step 1: Add BudgetTotals type and totals field**

Add after line 163 (before the existing `type Budget`):

```graphql
type BudgetTotals @cacheControl {
  income: BudgetEntry!
  expenses: BudgetEntry!
  balance: BudgetEntry!
}
```

Then modify the existing `Budget` type to add the `totals` field:

```graphql
type Budget @cacheControl {
  income: BudgetCategory!
  expenses: BudgetCategory!
  balance: BudgetCategory!
  totals: BudgetTotals!
}
```

**Step 2: Verify schema is valid**

Run: `npm run build`

Expected: Build succeeds (schema parsing happens during codegen)

**Step 3: Commit**

```bash
git add graphql/schema.graphql
git commit -m "schema: add BudgetTotals type for aggregated budget data"
```

---

## Task 2: Run Server Codegen

**Files:**
- Generated: `src/graphql/generated/types.generated.ts`
- Generated: `src/graphql/generated/validation.generated.ts`
- Generated: `src/graphql/generated/BudgetTotals.ts` (new stub)

**Step 1: Run codegen**

Run: `npm run graphql:codegen`

Expected: Codegen completes successfully, creates new `BudgetTotals.ts` stub

**Step 2: Verify generated types exist**

Run: `grep -l "BudgetTotals" src/graphql/generated/*.ts`

Expected: Shows `types.generated.ts`, `validation.generated.ts`, `BudgetTotals.ts`

**Step 3: Commit generated files**

```bash
git add src/graphql/generated/
git commit -m "codegen: regenerate types for BudgetTotals"
```

---

## Task 3: Write Failing Test for Budget.totals Resolver

**Files:**
- Create: `tests/graphql/budgetTotals.test.ts`
- Reference: `tests/fixtures/saves/save-with-budget.sql` (existing)

**Step 1: Create test file with failing test**

```typescript
import { afterEach, beforeEach, describe, expect, it } from 'bun:test'
import type { Save } from '../../src/graphql/generated/validation.generated.js'
import { loadFixture } from '../utils/fixtures.js'
import { executeQuery } from '../utils/graphqlClient.js'
import type { TestDatabaseContext } from '../utils/testDatabase.js'
import {
  createTestDatabase,
  destroyTestDatabase,
} from '../utils/testDatabase.js'
import type { TestServerContext } from '../utils/testServer.js'
import { createTestServer } from '../utils/testServer.js'

describe('Budget.totals Resolver', () => {
  let testDb: TestDatabaseContext
  let testServer: TestServerContext

  beforeEach(async () => {
    testDb = await createTestDatabase()
    await loadFixture(testDb.pool, 'saves/save-with-budget-totals.sql')
    testServer = createTestServer(testDb)
  })

  afterEach(async () => {
    await testServer.cleanup()
    await destroyTestDatabase(testDb)
  })

  it('returns aggregated totals across all budget categories', async () => {
    const result = await executeQuery<{
      save: Save
    }>(
      testServer,
      `query GetBudgetTotals($filename: String!) {
        save(filename: $filename) {
          gamestates {
            budget {
              totals {
                balance {
                  energy
                  minerals
                  food
                }
              }
              balance {
                countryBase {
                  energy
                  minerals
                  food
                }
                armies {
                  energy
                  minerals
                  food
                }
              }
            }
          }
        }
      }`,
      { filename: 'budget-totals-test.sav' },
    )

    expect(result.errors).toBeUndefined()
    const gamestate = result.data?.save.gamestates[0]

    // Totals should equal countryBase + armies
    const countryBase = gamestate?.budget.balance.countryBase
    const armies = gamestate?.budget.balance.armies
    const totals = gamestate?.budget.totals.balance

    expect(totals?.energy).toBe((countryBase?.energy ?? 0) + (armies?.energy ?? 0))
    expect(totals?.minerals).toBe((countryBase?.minerals ?? 0) + (armies?.minerals ?? 0))
    expect(totals?.food).toBe((countryBase?.food ?? 0) + (armies?.food ?? 0))
  })

  it('handles categories with null values', async () => {
    const result = await executeQuery<{
      save: Save
    }>(
      testServer,
      `query GetBudgetTotals($filename: String!) {
        save(filename: $filename) {
          gamestates {
            budget {
              totals {
                balance {
                  energy
                }
              }
            }
          }
        }
      }`,
      { filename: 'budget-totals-test.sav' },
    )

    expect(result.errors).toBeUndefined()
    // Should not throw even if some categories are null
    expect(result.data?.save.gamestates[0]?.budget.totals.balance.energy).toBeNumber()
  })
})
```

**Step 2: Create test fixture with multiple budget categories**

Create file `tests/fixtures/saves/save-with-budget-totals.sql`:

```sql
INSERT INTO save (filename, name)
VALUES ('budget-totals-test.sav', 'Budget Totals Test Empire');

INSERT INTO gamestate (save_id, date, data)
VALUES (
  (SELECT save_id FROM save WHERE filename = 'budget-totals-test.sav'),
  '2200-01-01',
  '{}'::jsonb
);

-- Insert budget entry for countryBase balance
INSERT INTO budget_entry (
  energy, minerals, food, alloys, consumer_goods,
  trade, unity, influence,
  physics_research, engineering_research, society_research,
  exotic_gases, rare_crystals, volatile_motes,
  astral_threads, minor_artifacts, nanites,
  sr_zro, sr_dark_matter, sr_living_metal
)
VALUES (100.0, 200.0, 50.0, 25.0, 30.0, 10.0, 5.0, 2.0, 15.0, 20.0, 18.0, 3.0, 4.0, 2.5, 1.0, 0.5, 0.2, 0.1, 0.3, 0.4);

INSERT INTO budget_category (gamestate_id, category_type, category_name, budget_entry_id)
VALUES (
  (SELECT gamestate_id FROM gamestate WHERE save_id = (SELECT save_id FROM save WHERE filename = 'budget-totals-test.sav')),
  'balance',
  'country_base',
  (SELECT budget_entry_id FROM budget_entry ORDER BY budget_entry_id DESC LIMIT 1)
);

-- Insert budget entry for armies balance
INSERT INTO budget_entry (
  energy, minerals, food, alloys, consumer_goods,
  trade, unity, influence,
  physics_research, engineering_research, society_research,
  exotic_gases, rare_crystals, volatile_motes,
  astral_threads, minor_artifacts, nanites,
  sr_zro, sr_dark_matter, sr_living_metal
)
VALUES (50.0, 100.0, 25.0, 10.0, 15.0, 5.0, 2.0, 1.0, 7.0, 10.0, 9.0, 1.0, 2.0, 1.0, 0.5, 0.2, 0.1, 0.05, 0.1, 0.2);

INSERT INTO budget_category (gamestate_id, category_type, category_name, budget_entry_id)
VALUES (
  (SELECT gamestate_id FROM gamestate WHERE save_id = (SELECT save_id FROM save WHERE filename = 'budget-totals-test.sav')),
  'balance',
  'armies',
  (SELECT budget_entry_id FROM budget_entry ORDER BY budget_entry_id DESC LIMIT 1)
);
```

**Step 3: Run test to verify it fails**

Run: `npm run test:typescript -- --filter "Budget.totals"`

Expected: FAIL - resolver not implemented yet

**Step 4: Commit test**

```bash
git add tests/graphql/budgetTotals.test.ts tests/fixtures/saves/save-with-budget-totals.sql
git commit -m "test: add failing tests for Budget.totals resolver"
```

---

## Task 4: Implement Budget.totals Resolver

**Files:**
- Modify: `src/graphql/generated/Budget.ts`

**Step 1: Implement the resolver**

Replace contents of `src/graphql/generated/Budget.ts`:

```typescript
import type { BudgetResolvers } from './types.generated.js'
import {
  type BudgetCategory,
  type BudgetEntry,
} from './validation.generated.js'

const RESOURCE_KEYS = [
  'energy',
  'minerals',
  'food',
  'trade',
  'alloys',
  'consumerGoods',
  'unity',
  'influence',
  'physicsResearch',
  'societyResearch',
  'engineeringResearch',
  'exoticGases',
  'rareCrystals',
  'volatileMotes',
  'srDarkMatter',
  'srLivingMetal',
  'srZro',
  'nanites',
  'minorArtifacts',
  'astralThreads',
] as const

const sumCategories = (category: BudgetCategory): BudgetEntry => {
  const result: Record<string, number> = {}
  for (const key of RESOURCE_KEYS) {
    result[key] = 0
  }

  for (const catValue of Object.values(category)) {
    if (catValue && typeof catValue === 'object') {
      for (const key of RESOURCE_KEYS) {
        result[key] += (catValue as Record<string, number>)[key] ?? 0
      }
    }
  }
  return result as BudgetEntry
}

export const Budget: BudgetResolvers = {
  totals: (parent) => ({
    income: sumCategories(parent.income),
    expenses: sumCategories(parent.expenses),
    balance: sumCategories(parent.balance),
  }),
}
```

**Step 2: Run test to verify it passes**

Run: `npm run test:typescript -- --filter "Budget.totals"`

Expected: PASS

**Step 3: Run full test suite**

Run: `npm run test:ci:typescript`

Expected: All tests pass

**Step 4: Commit implementation**

```bash
git add src/graphql/generated/Budget.ts
git commit -m "feat: implement Budget.totals resolver for aggregated sums"
```

---

## Task 5: Add Schema Test for BudgetTotals Type

**Files:**
- Modify: `tests/graphql/schema.test.ts`

**Step 1: Add test for BudgetTotals type**

Add new describe block after line 123 (after the `Budget Type Fields` describe):

```typescript
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
```

**Step 2: Run schema tests**

Run: `npm run test:typescript -- --filter "GraphQL Schema"`

Expected: All tests pass

**Step 3: Commit**

```bash
git add tests/graphql/schema.test.ts
git commit -m "test: add schema tests for BudgetTotals type"
```

---

## Task 6: Update UI GraphQL Query

**Files:**
- Modify: `ui/src/graphql/queries.graphql:21-45`

**Step 1: Update GetBudget query**

Replace lines 21-45 with:

```graphql
query GetBudget($filename: String!) {
  save(filename: $filename) {
    saveId
    filename
    name
    gamestates {
      gamestateId
      date
      budget {
        totals {
          balance {
            energy
            minerals
            food
            trade
            alloys
            consumerGoods
            unity
            influence
          }
        }
      }
    }
  }
}
```

**Step 2: Run UI codegen**

Run: `npm run ui:codegen`

Expected: Codegen succeeds, regenerates TypeScript types

**Step 3: Commit**

```bash
git add ui/src/graphql/queries.graphql ui/src/graphql/
git commit -m "feat(ui): update GetBudget query to use totals"
```

---

## Task 7: Update BudgetDashboard Component

**Files:**
- Modify: `ui/src/components/BudgetDashboard.tsx:62-66`

**Step 1: Update component to read from totals**

Replace lines 62-66:

```typescript
      values: sortedGamestates.map((g) => {
        const totals = g.budget?.totals?.balance
        if (!totals) return 0
        return totals[key] ?? 0
      }),
```

**Step 2: Build UI to verify no type errors**

Run: `npm run ui:build`

Expected: Build succeeds

**Step 3: Commit**

```bash
git add ui/src/components/BudgetDashboard.tsx
git commit -m "feat(ui): use budget totals in BudgetDashboard"
```

---

## Task 8: Manual Verification

**Step 1: Start services**

Run: `npm run dev` (or ensure services are running)

**Step 2: Open UI and verify charts**

Navigate to: `http://localhost:5173`

1. Select "United Nations of Earth" save
2. Observe Primary Resources chart shows values in 100-500 range (not 10-20)
3. Compare with Grafana at `http://grafana:3000` - values should match

**Step 3: Run full quality checks**

Run: `npm run lint:typescript && npm run build && npm run test:ci:typescript && npm run ui:build`

Expected: All checks pass

---

## Task 9: Final Commit

**Step 1: Verify all changes committed**

Run: `git status`

Expected: Working tree clean

**Step 2: Push to feature branch**

Run: `git push origin feature/ui`

Expected: Push succeeds

---

## Summary of Files Changed

| File | Action |
|------|--------|
| `graphql/schema.graphql` | Add `BudgetTotals` type, add `totals` field to `Budget` |
| `src/graphql/generated/Budget.ts` | Implement `totals` resolver with `sumCategories` |
| `src/graphql/generated/*` | Regenerated by codegen |
| `ui/src/graphql/queries.graphql` | Query `totals.balance` instead of `balance.countryBase` |
| `ui/src/components/BudgetDashboard.tsx` | Read from `totals` |
| `tests/graphql/budgetTotals.test.ts` | New test file |
| `tests/graphql/schema.test.ts` | Add BudgetTotals schema tests |
| `tests/fixtures/saves/save-with-budget-totals.sql` | New fixture |
