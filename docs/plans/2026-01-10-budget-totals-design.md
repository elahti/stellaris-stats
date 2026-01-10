# Budget Totals Aggregation Design

## Problem

The UI displays incorrect budget data because it only queries `budget.balance.countryBase`, which is 1 of 56 budget categories. The correct values should be the sum of all categories.

**Evidence:**
- UI shows resource values around 10-20
- Grafana (correctly aggregated) shows values of 300-500
- Values are 20-40x too low in the UI

## Solution

Add server-side aggregation via a new `budget.totals` field that sums all 56 categories for each resource type.

## Design

### 1. Schema Changes

**File**: `graphql/schema.graphql`

```graphql
type BudgetTotals @cacheControl {
  income: BudgetEntry!
  expenses: BudgetEntry!
  balance: BudgetEntry!
}

type Budget @cacheControl {
  income: BudgetCategory!
  expenses: BudgetCategory!
  balance: BudgetCategory!
  totals: BudgetTotals!        # NEW - aggregated sums
}
```

**Why this structure:**
- `BudgetTotals` mirrors `Budget` structure (income/expenses/balance) for consistency
- Each contains a `BudgetEntry` with all 20 resource fields
- `@cacheControl` directive applied for consistency with existing types
- Additive change - existing queries continue working, Grafana unaffected

### 2. Resolver Implementation

**File**: `src/graphql/generated/Budget.ts`

```typescript
import type { BudgetResolvers } from './types.generated.js'
import {
  type BudgetCategory,
  type BudgetEntry,
} from './validation.generated.js'

const RESOURCE_KEYS = [
  'energy', 'minerals', 'food', 'trade', 'alloys', 'consumerGoods',
  'unity', 'influence', 'physicsResearch', 'societyResearch',
  'engineeringResearch', 'exoticGases', 'rareCrystals', 'volatileMotes',
  'srDarkMatter', 'srLivingMetal', 'srZro', 'nanites', 'minorArtifacts',
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
        result[key] += catValue[key] ?? 0
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

**Caching behavior:**
- No new cache keys needed
- Parent `Budget` data is already cached at `budget:gamestateId:{id}` (Tier 2)
- `totals` computed on-the-fly from cached data (negligible cost)
- Response-level cache (Tier 1) will cache full responses including computed totals

### 3. UI Changes

**File**: `ui/src/graphql/queries.graphql`

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

**File**: `ui/src/components/BudgetDashboard.tsx` (lines 62-66)

```typescript
// Before:
const countryBase = g.budget?.balance?.countryBase
if (!countryBase) return 0
return countryBase[key] ?? 0

// After:
const totals = g.budget?.totals?.balance
if (!totals) return 0
return totals[key] ?? 0
```

### 4. Testing

Server-side test to verify aggregation:

```typescript
describe('Budget.totals', () => {
  it('sums all categories for balance', async () => {
    // Load fixture with known budget data
    // Query both totals and individual categories
    // Verify totals = sum of all categories
  })

  it('handles null category values gracefully', async () => {
    // Test with sparse data where some categories are null
  })
})
```

Manual verification: Compare UI charts with Grafana dashboard values.

## Implementation Steps

1. **Schema Change**: `graphql/schema.graphql`
2. **Server Codegen**: `npm run graphql:codegen`
3. **Resolver Implementation**: `src/graphql/generated/Budget.ts`
4. **Server Verification**: `npm run build && npm run test:ci:typescript`
5. **UI Query Update**: `ui/src/graphql/queries.graphql`
6. **UI Codegen**: `npm run ui:codegen`
7. **Component Update**: `ui/src/components/BudgetDashboard.tsx`
8. **UI Build & Test**: `npm run ui:build`
9. **Manual Verification**: Compare UI with Grafana

## Files Changed

| File | Change |
|------|--------|
| `graphql/schema.graphql` | Add `BudgetTotals` type, add `totals` field |
| `src/graphql/generated/Budget.ts` | Add `totals` resolver |
| `ui/src/graphql/queries.graphql` | Query `totals.balance` instead of `balance.countryBase` |
| `ui/src/components/BudgetDashboard.tsx` | Read from `totals` |
| `tests/budget-totals.test.ts` | New test file |

## Decisions

- **Server-side vs client-side aggregation**: Server-side chosen for smaller payloads and simpler UI code. Migration path exists if needed later.
- **Grafana dashboards**: Left unchanged - they work correctly and detailed dashboards need individual categories anyway.
- **Caching**: Leverages existing cache infrastructure, no new cache keys needed.

## Rollback Plan

The change is fully backwards-compatible:
- Existing `balance.countryBase` queries still work
- Grafana dashboards unaffected
- UI can revert to previous query with one-line change
