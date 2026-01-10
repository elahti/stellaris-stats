import { useEffect, useRef } from 'react'
import uPlot from 'uplot'
import 'uplot/dist/uPlot.min.css'
import { vars } from '../styles/theme.css'
import * as styles from './TimeSeriesChart.css'

export interface SeriesConfig {
  key: string
  label: string
  values: number[]
  color: string
}

export interface TimeSeriesChartProps {
  timestamps: number[]
  series: SeriesConfig[]
  title: string
  height?: number
}

const formatGameDate = (timestamp: number): string => {
  const date = new Date(timestamp)
  const year = date.getUTCFullYear()
  const month = String(date.getUTCMonth() + 1).padStart(2, '0')
  return `${year}.${month}`
}

const createChartOptions = (
  title: string,
  series: SeriesConfig[],
  height: number,
): uPlot.Options => ({
  title,
  width: 0,
  height,
  background: 'transparent',
  cursor: {
    drag: { x: true, y: false },
  },
  scales: {
    x: { time: true },
  },
  axes: [
    {
      stroke: vars.color.textMuted,
      grid: {
        stroke: 'rgba(70, 130, 180, 0.15)',
        width: 1,
      },
      ticks: {
        stroke: vars.color.border,
        width: 1,
      },
      font: `12px ${vars.font.body}`,
      values: (_self, ticks) => ticks.map((t) => formatGameDate(t * 1000)),
    },
    {
      stroke: vars.color.textMuted,
      grid: {
        stroke: 'rgba(70, 130, 180, 0.15)',
        width: 1,
      },
      ticks: {
        stroke: vars.color.border,
        width: 1,
      },
      font: `12px ${vars.font.body}`,
    },
  ],
  series: [
    {},
    ...series.map((s) => ({
      label: s.label,
      stroke: s.color,
      width: 2,
      spanGaps: true,
    })),
  ],
})

export const TimeSeriesChart = ({
  timestamps,
  series,
  title,
  height = 300,
}: TimeSeriesChartProps): React.ReactElement => {
  const containerRef = useRef<HTMLDivElement>(null)
  const chartRef = useRef<uPlot | null>(null)

  useEffect(() => {
    if (!containerRef.current || timestamps.length === 0) return

    const opts = createChartOptions(title, series, height)
    opts.width = containerRef.current.offsetWidth

    const data: uPlot.AlignedData = [
      timestamps.map((t) => t / 1000),
      ...series.map((s) => s.values),
    ]

    chartRef.current = new uPlot(opts, data, containerRef.current)

    const handleResize = () => {
      if (containerRef.current && chartRef.current) {
        chartRef.current.setSize({
          width: containerRef.current.offsetWidth,
          height,
        })
      }
    }

    window.addEventListener('resize', handleResize)

    return () => {
      window.removeEventListener('resize', handleResize)
      chartRef.current?.destroy()
    }
  }, [timestamps, series, title, height])

  useEffect(() => {
    if (chartRef.current && timestamps.length > 0) {
      const data: uPlot.AlignedData = [
        timestamps.map((t) => t / 1000),
        ...series.map((s) => s.values),
      ]
      chartRef.current.setData(data)
    }
  }, [timestamps, series])

  return (
    <div className={styles.chartContainer}>
      <h3 className={styles.chartTitle}>{title}</h3>
      <div className={styles.chartWrapper} ref={containerRef} />
      <div className={styles.legend}>
        {series.map((s) => (
          <div key={s.key} className={styles.legendItem}>
            <div
              className={styles.legendColor}
              style={{ backgroundColor: s.color }}
            />
            <span>{s.label}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
