import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { chartColors } from '../styles/theme.css'
import { useRealtimeBudget } from '../hooks/useRealtimeBudget'
import { TimeSeriesChart, SeriesConfig } from './TimeSeriesChart'
import type { BudgetEntry } from '../graphql/generated/graphql'
import * as styles from './BudgetDashboard.css'

export interface BudgetDashboardProps {
  filename: string
  initialCategory?: string
}

const categoryKeyToTitle: Record<string, string> = {
  basic: 'Basic Resources',
  advanced: 'Advanced Resources',
  basic_strategic: 'Basic Strategic Resources',
  advanced_strategic: 'Advanced Strategic Resources',
  abstract: 'Abstract Resources',
  research: 'Research',
}

const categoryTitleToKey: Record<string, string> = {
  'Basic Resources': 'basic',
  'Advanced Resources': 'advanced',
  'Basic Strategic Resources': 'basic_strategic',
  'Advanced Strategic Resources': 'advanced_strategic',
  'Abstract Resources': 'abstract',
  'Research': 'research',
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
      { key: 'energy', label: 'Energy', color: chartColors.energy },
      { key: 'minerals', label: 'Minerals', color: chartColors.minerals },
      { key: 'food', label: 'Food', color: chartColors.food },
      { key: 'trade', label: 'Trade', color: chartColors.trade },
    ],
  },
  {
    title: 'Advanced Resources',
    resources: [
      { key: 'alloys', label: 'Alloys', color: chartColors.alloys },
      {
        key: 'consumerGoods',
        label: 'Consumer Goods',
        color: chartColors.consumerGoods,
      },
    ],
  },
  {
    title: 'Basic Strategic Resources',
    resources: [
      {
        key: 'rareCrystals',
        label: 'Rare Crystals',
        color: chartColors.rareCrystals,
      },
      {
        key: 'exoticGases',
        label: 'Exotic Gases',
        color: chartColors.exoticGases,
      },
      {
        key: 'volatileMotes',
        label: 'Volatile Motes',
        color: chartColors.volatileMotes,
      },
    ],
  },
  {
    title: 'Advanced Strategic Resources',
    resources: [
      {
        key: 'srDarkMatter',
        label: 'Dark Matter',
        color: chartColors.srDarkMatter,
      },
      {
        key: 'srLivingMetal',
        label: 'Living Metal',
        color: chartColors.srLivingMetal,
      },
      { key: 'srZro', label: 'Zro', color: chartColors.srZro },
    ],
  },
  {
    title: 'Abstract Resources',
    resources: [
      { key: 'unity', label: 'Unity', color: chartColors.unity },
      { key: 'influence', label: 'Influence', color: chartColors.influence },
    ],
  },
  {
    title: 'Research',
    resources: [
      {
        key: 'physicsResearch',
        label: 'Physics',
        color: chartColors.physicsResearch,
      },
      {
        key: 'societyResearch',
        label: 'Society',
        color: chartColors.societyResearch,
      },
      {
        key: 'engineeringResearch',
        label: 'Engineering',
        color: chartColors.engineeringResearch,
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
  initialCategory,
}: BudgetDashboardProps): React.ReactElement => {
  const { gamestates, loading, error, saveName } = useRealtimeBudget(filename)
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null)
  const [hiddenResources, setHiddenResources] = useState<Set<string>>(new Set())
  const navigate = useNavigate()

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

  const selectedCategory = useMemo(() => {
    if (initialCategory && categoryKeyToTitle[initialCategory]) {
      return categoryKeyToTitle[initialCategory]
    }
    return chartData?.categories[0]?.title ?? null
  }, [initialCategory, chartData])

  useEffect(() => {
    setHiddenResources(new Set())
  }, [selectedCategory])

  const handleCategoryChange = (title: string) => {
    const key = categoryTitleToKey[title] ?? 'basic'
    navigate({
      to: '/saves/$saveId/empire_budget',
      params: { saveId: filename },
      search: { category: key },
    })
  }

  const handleToggleResource = (key: string) => {
    setHiddenResources((prev) => {
      const next = new Set(prev)
      if (next.has(key)) {
        next.delete(key)
      } else {
        next.add(key)
      }
      return next
    })
  }

  const selectedCategoryData = chartData?.categories.find(
    (c) => c.title === selectedCategory,
  )

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
      </div>

      <nav className={styles.categoryTabs}>
        {chartData.categories.map((category) => (
          <button
            key={category.title}
            className={`${styles.tab} ${selectedCategory === category.title ? styles.tabActive : ''}`}
            onClick={() => handleCategoryChange(category.title)}
            type='button'
          >
            {category.title}
          </button>
        ))}
      </nav>

      {selectedCategoryData && (
        <div className={styles.chartSection}>
          <TimeSeriesChart
            title={selectedCategoryData.title}
            timestamps={chartData.timestamps}
            series={selectedCategoryData.series}
            hoveredIndex={hoveredIndex}
            onHoverChange={setHoveredIndex}
            hiddenKeys={hiddenResources}
            onToggleResource={handleToggleResource}
          />
        </div>
      )}
    </div>
  )
}
