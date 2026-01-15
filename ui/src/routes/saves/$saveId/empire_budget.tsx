import { createFileRoute } from '@tanstack/react-router'
import { z } from 'zod'
import { zodSearchValidator } from '@tanstack/router-zod-adapter'
import { BudgetDashboard } from '../../../components'

const categories = [
  'basic',
  'advanced',
  'basic_strategic',
  'advanced_strategic',
  'abstract',
  'research',
] as const

const searchSchema = z.object({
  category: z.enum(categories).catch('basic'),
})

export const Route = createFileRoute('/saves/$saveId/empire_budget')({
  validateSearch: zodSearchValidator(searchSchema),
  component: EmpireBudgetPage,
})

function EmpireBudgetPage(): React.ReactElement {
  const { saveId } = Route.useParams()
  const { category } = Route.useSearch()

  return <BudgetDashboard filename={saveId} initialCategory={category} />
}
