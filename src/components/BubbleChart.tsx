import { useMemo, useState } from 'react'
import type { MarketBubbleDatum } from '../data/sampleMarketData'
import {
  createAxisScale,
  createPositiveAxisScale,
  formatKrw,
  formatKrwAxis,
  formatPercent,
  getAxisDomain,
  getBubbleWeight,
  getPositiveAxisDomain,
  getRelatedBubbleColors,
  type AxisScaleMode,
  type ChartMetricMode,
} from '../utils/scales'
import { getBubbleStatus } from '../utils/status'
import { SplitBubble } from './SplitBubble'

type BubbleChartProps = {
  data: MarketBubbleDatum[]
  selectedId?: string
  selectedSector: string
  chartMetricMode: ChartMetricMode
  axisScaleMode: AxisScaleMode
  trailData?: MarketBubbleDatum[]
  variant?: 'normal' | 'expanded'
  onSelect: (datum: MarketBubbleDatum) => void
}

type TooltipState = {
  datum: MarketBubbleDatum
  x: number
  y: number
} | null

export function BubbleChart({
  data,
  selectedId,
  selectedSector,
  chartMetricMode,
  axisScaleMode,
  trailData = [],
  variant = 'normal',
  onSelect,
}: BubbleChartProps) {
  const [tooltip, setTooltip] = useState<TooltipState>(null)
  const chartSize =
    variant === 'expanded'
      ? {
          width: 1320,
          height: 760,
          margin: { top: 48, right: 64, bottom: 72, left: 96 },
        }
      : {
          width: 900,
          height: 560,
          margin: { top: 36, right: 42, bottom: 58, left: 72 },
        }
  const { width, height, margin } = chartSize

  const chartScales = useMemo(() => {
    if (chartMetricMode === 'absolute') {
      const xDomain = getPositiveAxisDomain(data, 'marketCap', [
        100_000_000_000,
        100_000_000_000_000,
      ])
      const yDomain = getPositiveAxisDomain(data, 'tradingValue', [
        1_000_000_000,
        1_000_000_000_000,
      ])

      return {
        xDomain,
        yDomain,
        xScale: createPositiveAxisScale(
          xDomain,
          [margin.left, width - margin.right],
          axisScaleMode,
        ),
        yScale: createPositiveAxisScale(
          yDomain,
          [height - margin.bottom, margin.top],
          axisScaleMode,
        ),
      }
    }

    const xDomain = getAxisDomain(data, 'return6m', [-80, 120])
    const yDomain = getAxisDomain(data, 'tradingValueChange6m', [-100, 180])

    return {
      xDomain,
      yDomain,
      xScale: createAxisScale(
        xDomain,
        [margin.left, width - margin.right],
        axisScaleMode,
      ),
      yScale: createAxisScale(
        yDomain,
        [height - margin.bottom, margin.top],
        axisScaleMode,
      ),
    }
  }, [axisScaleMode, chartMetricMode, data, height, margin, width])

  const layout = useMemo(() => {
    const maxWeight = Math.max(...data.map(getBubbleWeight), 1)

    return data.map((datum) => ({
      datum,
      x: chartScales.xScale(
        chartMetricMode === 'absolute' ? datum.marketCap : datum.return6m,
      ),
      y: chartScales.yScale(
        chartMetricMode === 'absolute'
          ? datum.tradingValue
          : datum.tradingValueChange6m,
      ),
      radius: 16 + (getBubbleWeight(datum) / maxWeight) * 42,
    }))
  }, [chartMetricMode, chartScales, data])

  const trailLayout = useMemo(
    () =>
      trailData.map((datum, index) => ({
        datum,
        x: chartScales.xScale(
          chartMetricMode === 'absolute' ? datum.marketCap : datum.return6m,
        ),
        y: chartScales.yScale(
          chartMetricMode === 'absolute'
            ? datum.tradingValue
            : datum.tradingValueChange6m,
        ),
        opacity: 0.18 + ((index + 1) / Math.max(trailData.length, 1)) * 0.48,
      })),
    [chartMetricMode, chartScales, trailData],
  )
  const trailPath = trailLayout
    .map((point, index) => `${index === 0 ? 'M' : 'L'} ${point.x} ${point.y}`)
    .join(' ')
  const trailColor =
    trailLayout.length > 0
      ? getRelatedBubbleColors(trailLayout[trailLayout.length - 1].datum.sector).right
      : '#70d2ff'

  const xAxisY =
    chartMetricMode === 'absolute'
      ? height - margin.bottom
      : chartScales.yScale(0)
  const yAxisX =
    chartMetricMode === 'absolute' ? margin.left : chartScales.xScale(0)
  const filtered = selectedSector !== '전체 보기'
  const xTicks = getTicks(chartMetricMode, 'x', axisScaleMode)
  const yTicks = getTicks(chartMetricMode, 'y', axisScaleMode)
  const visibleXTicks = xTicks.filter(
    (tick) => tick >= chartScales.xDomain[0] && tick <= chartScales.xDomain[1],
  )
  const visibleYTicks = yTicks.filter(
    (tick) => tick >= chartScales.yDomain[0] && tick <= chartScales.yDomain[1],
  )

  return (
    <section className="chart-panel" aria-label="시장 버블 차트">
      <svg
        className={`bubble-chart ${variant === 'expanded' ? 'expanded' : ''}`}
        viewBox={`0 0 ${width} ${height}`}
        role="img"
        aria-label="섹터별 6개월 수익률과 거래대금 변화율 버블 지도"
      >
        <defs>
          <radialGradient id="chartGlow" cx="50%" cy="48%" r="70%">
            <stop offset="0%" stopColor="rgba(64, 215, 207, 0.18)" />
            <stop offset="65%" stopColor="rgba(85, 199, 255, 0.06)" />
            <stop offset="100%" stopColor="rgba(5, 10, 24, 0)" />
          </radialGradient>
        </defs>
        <rect width={width} height={height} className="chart-bg" />
        <rect
          x={margin.left}
          y={margin.top}
          width={width - margin.left - margin.right}
          height={height - margin.top - margin.bottom}
          fill="url(#chartGlow)"
        />

        {visibleXTicks.map((tick) => (
          <g key={`x-${tick}`}>
            <line
              className="grid-line"
              x1={chartScales.xScale(tick)}
              x2={chartScales.xScale(tick)}
              y1={margin.top}
              y2={height - margin.bottom}
            />
            <text
              className="axis-tick"
              x={chartScales.xScale(tick)}
              y={height - 28}
              textAnchor="middle"
            >
              {formatAxisTick(tick, chartMetricMode)}
            </text>
          </g>
        ))}
        {visibleYTicks.map((tick) => (
          <g key={`y-${tick}`}>
            <line
              className="grid-line"
              x1={margin.left}
              x2={width - margin.right}
              y1={chartScales.yScale(tick)}
              y2={chartScales.yScale(tick)}
            />
            <text
              className="axis-tick"
              x={margin.left - 14}
              y={chartScales.yScale(tick) + 4}
              textAnchor="end"
            >
              {formatAxisTick(tick, chartMetricMode)}
            </text>
          </g>
        ))}

        <line className="zero-axis" x1={margin.left} x2={width - margin.right} y1={xAxisY} y2={xAxisY} />
        <line className="zero-axis" x1={yAxisX} x2={yAxisX} y1={margin.top} y2={height - margin.bottom} />

        <text className="quadrant-label" x={width - 224} y={margin.top + 34}>
          {chartMetricMode === 'absolute' ? '큰 체급 · 높은 관심' : '주도'}
        </text>
        <text className="quadrant-label" x={width - 248} y={height - 92}>
          {chartMetricMode === 'absolute'
            ? '큰 체급 · 조용한 거래'
            : '조용한 상승'}
        </text>
        <text className="quadrant-label" x={margin.left + 28} y={margin.top + 34}>
          {chartMetricMode === 'absolute'
            ? '작은 체급 · 거래 집중'
            : '투매/손바뀜'}
        </text>
        <text className="quadrant-label" x={margin.left + 34} y={height - 92}>
          {chartMetricMode === 'absolute' ? '작은 체급 · 조용함' : '소외'}
        </text>

        <text className="axis-label" x={width / 2} y={height - 8} textAnchor="middle">
          {chartMetricMode === 'absolute' ? '시가총액' : '최근 6개월 수익률'}
        </text>
        <text
          className="axis-label"
          transform={`translate(18 ${height / 2}) rotate(-90)`}
          textAnchor="middle"
        >
          {chartMetricMode === 'absolute'
            ? '거래대금'
            : '최근 6개월 거래대금 변화율'}
        </text>
        {axisScaleMode === 'compressed' || chartMetricMode === 'absolute' ? (
          <text className="scale-note" x={width - margin.right} y={height - 8} textAnchor="end">
            축은 압축 표시 중이며, 수치는 원자료 기준입니다.
          </text>
        ) : null}

        {trailLayout.length > 1 ? (
          <g className="movement-trail" aria-hidden="true">
            <path
              className="trail-line"
              d={trailPath}
              stroke={trailColor}
            />
            {trailLayout.map((point, index) => (
              <circle
                key={`${point.datum.date}-${point.datum.id}`}
                className="trail-dot"
                cx={point.x}
                cy={point.y}
                r={index === trailLayout.length - 1 ? 4.4 : 3.2}
                fill={trailColor}
                opacity={point.opacity}
              />
            ))}
          </g>
        ) : null}

        {layout.map(({ datum, x, y, radius }) => (
          <SplitBubble
            key={datum.id}
            datum={datum}
            x={x}
            y={y}
            radius={radius}
            selected={selectedId === datum.id}
            faded={filtered && selectedSector !== datum.sector}
            onSelect={onSelect}
            onHover={(hoveredDatum, hoverX, hoverY) =>
              setTooltip(
                hoveredDatum ? { datum: hoveredDatum, x: hoverX, y: hoverY } : null,
              )
            }
          />
        ))}
      </svg>

      {tooltip ? (
        <div
          className="tooltip"
          style={{
            left: `${(tooltip.x / width) * 100}%`,
            top: `${(tooltip.y / height) * 100}%`,
          }}
        >
          <strong>{tooltip.datum.name}</strong>
          <span>{getBubbleStatus(tooltip.datum)}</span>
          <span>섹터 {tooltip.datum.sector}</span>
          {chartMetricMode === 'absolute' ? (
            <>
              <span>시가총액 {formatKrw(tooltip.datum.marketCap)}</span>
              <span>거래대금 {formatKrw(tooltip.datum.tradingValue)}</span>
            </>
          ) : (
            <>
              <span>최근 6개월 수익률 {formatPercent(tooltip.datum.return6m)}</span>
              <span>거래대금 변화율 {formatPercent(tooltip.datum.tradingValueChange6m)}</span>
            </>
          )}
        </div>
      ) : null}
    </section>
  )
}

type AxisName = 'x' | 'y'

const getTicks = (
  chartMetricMode: ChartMetricMode,
  axis: AxisName,
  axisScaleMode: AxisScaleMode,
) => {
  if (chartMetricMode === 'absolute') {
    return axis === 'x'
      ? [
          100_000_000_000,
          1_000_000_000_000,
          10_000_000_000_000,
          100_000_000_000_000,
          500_000_000_000_000,
        ]
      : [
          1_000_000_000,
          10_000_000_000,
          100_000_000_000,
          1_000_000_000_000,
          5_000_000_000_000,
        ]
  }

  if (axis === 'x') {
    return axisScaleMode === 'compressed'
      ? [-200, -100, -50, 0, 50, 100, 200]
      : [-80, -40, 0, 40, 80, 120]
  }

  return axisScaleMode === 'compressed'
    ? [-200, -100, -50, 0, 50, 100, 200, 400]
    : [-100, -50, 0, 50, 100, 150, 200]
}

const formatAxisTick = (value: number, chartMetricMode: ChartMetricMode) =>
  chartMetricMode === 'absolute' ? formatKrwAxis(value) : `${value}%`
