import { useMemo } from 'react'
import { vars } from '../styles/theme.css'
import { useRealtimeBudget } from '../hooks/useRealtimeBudget'
import { TimeSeriesChart, SeriesConfig } from './TimeSeriesChart'
import * as styles from './BudgetDashboard.css'

export interface BudgetDashboardProps {
  filename: string
}

const resourceColors: Record<string, string> = {
  energy: vars.color.energy,
  minerals: vars.color.minerals,
  food: vars.color.food,
  alloys: vars.color.alloys,
  consumerGoods: vars.color.consumerGoods,
  unity: vars.color.unity,
  influence: vars.color.influence,
  trade: vars.color.secondary,
}

const resourceLabels: Record<string, string> = {
  energy: 'Energy',
  minerals: 'Minerals',
  food: 'Food',
  alloys: 'Alloys',
  consumerGoods: 'Consumer Goods',
  unity: 'Unity',
  influence: 'Influence',
  trade: 'Trade Value',
}

export const BudgetDashboard = ({
  filename,
}: BudgetDashboardProps): React.ReactElement => {
  const { gamestates, loading, error, saveName } = useRealtimeBudget(filename)

  const chartData = useMemo(() => {
    if (gamestates.length === 0) return null

    const sortedGamestates = [...gamestates].sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
    )

    const timestamps = sortedGamestates.map((g) => new Date(g.date).getTime())

    const resourceKeys = [
      'energy',
      'minerals',
      'food',
      'trade',
      'alloys',
      'consumerGoods',
      'unity',
      'influence',
    ] as const

    const series: SeriesConfig[] = resourceKeys.map((key) => ({
      key,
      label: resourceLabels[key],
      color: resourceColors[key],
      values: sortedGamestates.map((g) => {
        const countryBase = g.budget?.balance?.countryBase
        if (!countryBase) return 0
        return countryBase[key] ?? 0
      }),
    }))

    return { timestamps, series }
  }, [gamestates])

  if (loading) {
    return <div className={styles.loadingContainer}>Loading budget data...</div>
  }

  if (error) {
    return <div className={styles.errorContainer}>Error: {error.message}</div>
  }

  if (!chartData) {
    return (
      <div className={styles.noDataContainer}>
        Select a save to view budget data
      </div>
    )
  }

  const primaryResources = chartData.series.filter((s) =>
    ['energy', 'minerals', 'food'].includes(s.key),
  )

  const secondaryResources = chartData.series.filter((s) =>
    ['alloys', 'consumerGoods'].includes(s.key),
  )

  const advancedResources = chartData.series.filter((s) =>
    ['unity', 'influence', 'trade'].includes(s.key),
  )

  return (
    <div className={styles.dashboardContainer}>
      <div className={styles.dashboardHeader}>
        <h2 className={styles.dashboardTitle}>Empire Budget</h2>
        {saveName && <span className={styles.saveName}>{saveName}</span>}
      </div>

      <div className={styles.chartsGrid}>
        <TimeSeriesChart
          title="Primary Resources"
          timestamps={chartData.timestamps}
          series={primaryResources}
        />

        <TimeSeriesChart
          title="Secondary Resources"
          timestamps={chartData.timestamps}
          series={secondaryResources}
        />

        <TimeSeriesChart
          title="Advanced Resources"
          timestamps={chartData.timestamps}
          series={advancedResources}
        />

        <TimeSeriesChart
          title="All Resources"
          timestamps={chartData.timestamps}
          series={chartData.series}
        />
      </div>
    </div>
  )
}
