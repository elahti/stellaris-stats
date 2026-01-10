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
      const catRecord = catValue as Record<string, number | null | undefined>
      for (const key of RESOURCE_KEYS) {
        const val = catRecord[key]
        result[key] = (result[key] ?? 0) + (val ?? 0)
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
