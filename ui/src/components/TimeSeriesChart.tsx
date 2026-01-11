import { useEffect, useRef, useCallback } from 'react'
import uPlot from 'uplot'
import 'uplot/dist/uPlot.min.css'
import { vars } from '../styles/theme.css'
import * as styles from './TimeSeriesChart.css'

export interface SeriesConfig {
  key: string
  label: string
  values: (number | null)[]
  color: string
}

export interface TimeSeriesChartProps {
  timestamps: number[]
  series: SeriesConfig[]
  title: string
  height?: number
  hoveredIndex: number | null
  onHoverChange: (index: number | null) => void
}

const formatGameDate = (timestamp: number): string => {
  const date = new Date(timestamp)
  const year = date.getUTCFullYear()
  const month = String(date.getUTCMonth() + 1).padStart(2, '0')
  return `${year}.${month}`
}

const formatValue = (value: number | null | undefined): string => {
  if (value === null || value === undefined) return '—'
  const prefix = value >= 0 ? '+' : ''
  return `${prefix}${Math.round(value).toLocaleString()}`
}

const createChartOptions = (
  title: string,
  series: SeriesConfig[],
  height: number,
  onHoverChange: (index: number | null) => void,
): uPlot.Options => ({
  title,
  width: 0,
  height,
  background: 'transparent',
  legend: { show: false },
  cursor: {
    drag: { x: false, y: false },
  },
  scales: {
    x: { time: true },
  },
  hooks: {
    setCursor: [
      (u) => {
        const idx = u.cursor.idx
        onHoverChange(idx === undefined ? null : idx)
      },
    ],
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
  height = 350,
  hoveredIndex,
  onHoverChange,
}: TimeSeriesChartProps): React.ReactElement => {
  const containerRef = useRef<HTMLDivElement>(null)
  const chartRef = useRef<uPlot | null>(null)
  const onHoverChangeRef = useRef(onHoverChange)
  const isProgrammaticCursorRef = useRef(false)
  onHoverChangeRef.current = onHoverChange

  const stableOnHoverChange = useCallback((index: number | null) => {
    // Ignore callbacks from programmatic cursor updates (sync from other charts)
    if (isProgrammaticCursorRef.current) return
    onHoverChangeRef.current(index)
  }, [])

  useEffect(() => {
    if (!containerRef.current || timestamps.length === 0) return

    const opts = createChartOptions(title, series, height, stableOnHoverChange)
    opts.width = containerRef.current.offsetWidth

    const data: uPlot.AlignedData = [
      timestamps.map((t) => t / 1000),
      ...series.map((s) => s.values.map((v) => v ?? null)),
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
  }, [timestamps, series, title, height, stableOnHoverChange])

  useEffect(() => {
    if (chartRef.current && timestamps.length > 0) {
      const data: uPlot.AlignedData = [
        timestamps.map((t) => t / 1000),
        ...series.map((s) => s.values.map((v) => v ?? null)),
      ]
      chartRef.current.setData(data)
    }
  }, [timestamps, series])

  useEffect(() => {
    if (chartRef.current && hoveredIndex !== null) {
      // Set flag to ignore the callback triggered by programmatic cursor update
      isProgrammaticCursorRef.current = true
      chartRef.current.setCursor({ idx: hoveredIndex, left: -1, top: -1 })
      isProgrammaticCursorRef.current = false
    }
  }, [hoveredIndex])

  const handleMouseLeave = () => {
    onHoverChange(null)
  }

  const displayIndex = hoveredIndex ?? timestamps.length - 1
  const isHovering = hoveredIndex !== null

  return (
    <div className={styles.chartContainer}>
      <h3 className={styles.chartTitle}>{title}</h3>
      <div
        className={styles.chartWrapper}
        ref={containerRef}
        onMouseLeave={handleMouseLeave}
      />
      <div className={styles.legend}>
        {series.map((s) => {
          const value = s.values[displayIndex]
          return (
            <div key={s.key} className={styles.legendItem}>
              <div
                className={styles.legendColor}
                style={{ backgroundColor: s.color }}
              />
              <span className={styles.legendLabel}>{s.label}</span>
              <span className={styles.legendValue}>
                {isHovering || timestamps.length > 0 ? formatValue(value) : '—'}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
