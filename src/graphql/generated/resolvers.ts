/* This file was automatically generated. DO NOT UPDATE MANUALLY. */
import type { Resolvers } from './types.generated.js'
import { saves as Query_saves } from './Query/saves.js'
import { Budget } from './Budget.js'
import { BudgetCategory } from './BudgetCategory.js'
import { BudgetEntry } from './BudgetEntry.js'
import { Gamestate } from './Gamestate.js'
import { Save } from './Save.js'
import { DateTimeISO } from './DateTimeISO.js'
export const resolvers: Resolvers = {
  Query: { saves: Query_saves },

  Budget: Budget,
  BudgetCategory: BudgetCategory,
  BudgetEntry: BudgetEntry,
  Gamestate: Gamestate,
  Save: Save,
  DateTimeISO: DateTimeISO,
}
