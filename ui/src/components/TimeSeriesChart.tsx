import { useEffect, useRef, useCallback, useState } from 'react'
import uPlot from 'uplot'
import 'uplot/dist/uPlot.min.css'
import { vars, chartConfig } from '../styles/theme.css'
import * as styles from './TimeSeriesChart.css'

const EMPTY_SET = new Set<string>()

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
  hiddenKeys?: Set<string>
  onToggleResource?: (key: string) => void
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
    draw: [
      (u) => {
        const ctx = u.ctx
        const y0 = u.valToPos(0, 'y', true)
        if (y0 >= u.bbox.top && y0 <= u.bbox.top + u.bbox.height) {
          ctx.save()
          ctx.strokeStyle = chartConfig.colors.zeroLine
          ctx.lineWidth = 1
          ctx.beginPath()
          ctx.moveTo(u.bbox.left, y0)
          ctx.lineTo(u.bbox.left + u.bbox.width, y0)
          ctx.stroke()
          ctx.restore()
        }
      },
    ],
  },
  axes: [
    {
      stroke: chartConfig.colors.text,
      grid: {
        stroke: chartConfig.colors.grid,
        width: 1,
      },
      ticks: {
        stroke: chartConfig.colors.grid,
        width: 1,
      },
      font: `${chartConfig.fontSize.axis} ${chartConfig.font.body}`,
      values: (_self, ticks) => ticks.map((t) => formatGameDate(t * 1000)),
      space: 100, // Increase spacing between x-axis ticks
    },
    {
      stroke: chartConfig.colors.text,
      grid: {
        stroke: chartConfig.colors.grid,
        width: 1,
      },
      ticks: {
        stroke: chartConfig.colors.grid,
        width: 1,
      },
      font: `${chartConfig.fontSize.axis} ${chartConfig.font.body}`,
      size: 60, // Allocate more space for y-axis labels
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
  height,
  hoveredIndex,
  onHoverChange,
  hiddenKeys = EMPTY_SET,
  onToggleResource,
}: TimeSeriesChartProps): React.ReactElement => {
  const containerRef = useRef<HTMLDivElement>(null)
  const outerContainerRef = useRef<HTMLDivElement>(null)
  const chartRef = useRef<uPlot | null>(null)
  const onHoverChangeRef = useRef(onHoverChange)
  const isProgrammaticCursorRef = useRef(false)
  const [chartHeight, setChartHeight] = useState(height ?? 350)
  onHoverChangeRef.current = onHoverChange

  const stableOnHoverChange = useCallback((index: number | null) => {
    // Ignore callbacks from programmatic cursor updates (sync from other charts)
    if (isProgrammaticCursorRef.current) return
    onHoverChangeRef.current(index)
  }, [])

  useEffect(() => {
    if (!containerRef.current || timestamps.length === 0) return

    // Filter out hidden series for chart rendering, but keep all series for legend
    const visibleSeries = series.filter((s) => !hiddenKeys.has(s.key))

    const opts = createChartOptions(
      title,
      visibleSeries,
      chartHeight,
      stableOnHoverChange,
    )
    opts.width = containerRef.current.offsetWidth

    const data: uPlot.AlignedData = [
      timestamps.map((t) => t / 1000),
      ...visibleSeries.map((s) => s.values.map((v) => v ?? null)),
    ]

    chartRef.current = new uPlot(opts, data, containerRef.current)

    const handleResize = () => {
      if (containerRef.current && chartRef.current) {
        chartRef.current.setSize({
          width: containerRef.current.offsetWidth,
          height: chartHeight,
        })
      }
    }

    window.addEventListener('resize', handleResize)

    return () => {
      window.removeEventListener('resize', handleResize)
      chartRef.current?.destroy()
    }
  }, [timestamps, series, title, chartHeight, stableOnHoverChange, hiddenKeys])

  useEffect(() => {
    if (chartRef.current && timestamps.length > 0) {
      const visibleSeries = series.filter((s) => !hiddenKeys.has(s.key))
      const data: uPlot.AlignedData = [
        timestamps.map((t) => t / 1000),
        ...visibleSeries.map((s) => s.values.map((v) => v ?? null)),
      ]
      chartRef.current.setData(data)
    }
  }, [timestamps, series, hiddenKeys])

  useEffect(() => {
    if (chartRef.current && hoveredIndex !== null) {
      // Set flag to ignore the callback triggered by programmatic cursor update
      isProgrammaticCursorRef.current = true
      chartRef.current.setCursor({ idx: hoveredIndex, left: -1, top: -1 })
      isProgrammaticCursorRef.current = false
    }
  }, [hoveredIndex])

  useEffect(() => {
    if (!outerContainerRef.current || height !== undefined) return

    const observer = new ResizeObserver((entries) => {
      const entry = entries[0]
      if (entry) {
        // Subtract space for title (~40px) and legend (~80px)
        const availableHeight = entry.contentRect.height - 120
        setChartHeight(Math.max(300, availableHeight))
      }
    })

    observer.observe(outerContainerRef.current)
    return () => observer.disconnect()
  }, [height])

  const handleMouseLeave = () => {
    onHoverChange(null)
  }

  const displayIndex = hoveredIndex ?? timestamps.length - 1
  const isHovering = hoveredIndex !== null

  return (
    <div className={styles.chartContainer} ref={outerContainerRef}>
      <h3 className={styles.chartTitle}>{title}</h3>
      <div
        className={styles.chartWrapper}
        ref={containerRef}
        onMouseLeave={handleMouseLeave}
      />
      <div className={styles.legend}>
        {series.map((s) => {
          const value = s.values[displayIndex]
          const isHidden = hiddenKeys.has(s.key)
          return (
            <div
              key={s.key}
              className={`${styles.legendItem} ${isHidden ? styles.legendItemHidden : ''}`}
              onClick={() => onToggleResource?.(s.key)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault()
                  onToggleResource?.(s.key)
                }
              }}
              role='button'
              tabIndex={0}
              aria-pressed={!isHidden}
            >
              <div
                className={styles.legendColor}
                style={{
                  backgroundColor: isHidden ? vars.color.textMuted : s.color,
                }}
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
