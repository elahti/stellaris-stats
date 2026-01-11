import { useMemo, useState } from 'react'
import { vars } from '../styles/theme.css'
import { useRealtimeBudget } from '../hooks/useRealtimeBudget'
import { TimeSeriesChart, SeriesConfig } from './TimeSeriesChart'
import type { BudgetEntry } from '../graphql/generated/graphql'
import * as styles from './BudgetDashboard.css'

export interface BudgetDashboardProps {
  filename: string
}

interface ResourceCategory {
  title: string
  resources: {
    key: string
    label: string
    color: string
  }[]
}

const RESOURCE_CATEGORIES: ResourceCategory[] = [
  {
    title: 'Basic Resources',
    resources: [
      { key: 'energy', label: 'Energy', color: vars.color.energy },
      { key: 'minerals', label: 'Minerals', color: vars.color.minerals },
      { key: 'food', label: 'Food', color: vars.color.food },
      { key: 'trade', label: 'Trade', color: vars.color.trade },
    ],
  },
  {
    title: 'Advanced Resources',
    resources: [
      { key: 'alloys', label: 'Alloys', color: vars.color.alloys },
      {
        key: 'consumerGoods',
        label: 'Consumer Goods',
        color: vars.color.consumerGoods,
      },
    ],
  },
  {
    title: 'Basic Strategic Resources',
    resources: [
      {
        key: 'rareCrystals',
        label: 'Rare Crystals',
        color: vars.color.rareCrystals,
      },
      {
        key: 'exoticGases',
        label: 'Exotic Gases',
        color: vars.color.exoticGases,
      },
      {
        key: 'volatileMotes',
        label: 'Volatile Motes',
        color: vars.color.volatileMotes,
      },
    ],
  },
  {
    title: 'Advanced Strategic Resources',
    resources: [
      {
        key: 'srDarkMatter',
        label: 'Dark Matter',
        color: vars.color.srDarkMatter,
      },
      {
        key: 'srLivingMetal',
        label: 'Living Metal',
        color: vars.color.srLivingMetal,
      },
      { key: 'srZro', label: 'Zro', color: vars.color.srZro },
    ],
  },
  {
    title: 'Abstract Resources',
    resources: [
      { key: 'unity', label: 'Unity', color: vars.color.unity },
      { key: 'influence', label: 'Influence', color: vars.color.influence },
    ],
  },
  {
    title: 'Research',
    resources: [
      {
        key: 'physicsResearch',
        label: 'Physics',
        color: vars.color.physicsResearch,
      },
      {
        key: 'societyResearch',
        label: 'Society',
        color: vars.color.societyResearch,
      },
      {
        key: 'engineeringResearch',
        label: 'Engineering',
        color: vars.color.engineeringResearch,
      },
    ],
  },
]

const getResourceValue = (
  totals: BudgetEntry | null | undefined,
  key: string,
): number | null => {
  if (!totals) return null
  if (key in totals) {
    return (totals as Record<string, number | null | undefined>)[key] ?? null
  }
  return null
}

const hasAnyData = (values: (number | null)[]): boolean =>
  values.some((v) => v !== null && v !== 0)

export const BudgetDashboard = ({
  filename,
}: BudgetDashboardProps): React.ReactElement => {
  const { gamestates, loading, error, saveName } = useRealtimeBudget(filename)
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null)

  const chartData = useMemo(() => {
    if (gamestates.length === 0) return null

    const sortedGamestates = [...gamestates].sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
    )

    const timestamps = sortedGamestates.map((g) => new Date(g.date).getTime())

    const getResourceValues = (key: string): (number | null)[] =>
      sortedGamestates.map((g) =>
        getResourceValue(g.budget?.totals?.balance, key),
      )

    const categories = RESOURCE_CATEGORIES.map((category) => {
      const seriesWithData: SeriesConfig[] = []

      for (const resource of category.resources) {
        const values = getResourceValues(resource.key)
        if (hasAnyData(values)) {
          seriesWithData.push({
            key: resource.key,
            label: resource.label,
            color: resource.color,
            values,
          })
        }
      }

      return {
        title: category.title,
        series: seriesWithData,
      }
    }).filter((category) => category.series.length > 0)

    return { timestamps, categories }
  }, [gamestates])

  if (loading) {
    return <div className={styles.loadingContainer}>Loading budget data...</div>
  }

  if (error) {
    return <div className={styles.errorContainer}>Error: {error.message}</div>
  }

  if (!chartData || chartData.categories.length === 0) {
    return (
      <div className={styles.dashboardContainer}>
        <div className={styles.dashboardHeader}>
          <h2 className={styles.dashboardTitle}>Empire Budget</h2>
          {saveName && <span className={styles.saveName}>{saveName}</span>}
        </div>
        <div className={styles.noDataContainer}>
          No budget data available for this save
        </div>
      </div>
    )
  }

  return (
    <div className={styles.dashboardContainer}>
      <div className={styles.dashboardHeader}>
        <h2 className={styles.dashboardTitle}>Empire Budget</h2>
        {saveName && <span className={styles.saveName}>{saveName}</span>}
      </div>

      <div className={styles.chartsGrid}>
        {chartData.categories.map((category) => (
          <TimeSeriesChart
            key={category.title}
            title={category.title}
            timestamps={chartData.timestamps}
            series={category.series}
            hoveredIndex={hoveredIndex}
            onHoverChange={setHoveredIndex}
          />
        ))}
      </div>
    </div>
  )
}
