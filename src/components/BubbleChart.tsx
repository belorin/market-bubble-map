import { useMemo, useState } from 'react'
import type { MarketBubbleDatum } from '../data/sampleMarketData'
import {
  createLinearScale,
  formatKrw,
  formatPercent,
  getBubbleWeight,
} from '../utils/scales'
import { getBubbleStatus } from '../utils/status'
import { SplitBubble } from './SplitBubble'

type BubbleChartProps = {
  data: MarketBubbleDatum[]
  selectedId?: string
  selectedSector: string
  onSelect: (datum: MarketBubbleDatum) => void
}

type TooltipState = {
  datum: MarketBubbleDatum
  x: number
  y: number
} | null

const width = 900
const height = 560
const margin = { top: 36, right: 42, bottom: 58, left: 72 }

export function BubbleChart({
  data,
  selectedId,
  selectedSector,
  onSelect,
}: BubbleChartProps) {
  const [tooltip, setTooltip] = useState<TooltipState>(null)

  const layout = useMemo(() => {
    const xScale = createLinearScale(
      [-60, 85],
      [margin.left, width - margin.right],
    )
    const yScale = createLinearScale(
      [-65, 165],
      [height - margin.bottom, margin.top],
    )
    const maxWeight = Math.max(...data.map(getBubbleWeight), 1)

    return data.map((datum) => ({
      datum,
      x: xScale(datum.return6m),
      y: yScale(datum.tradingValueChange6m),
      radius: 16 + (getBubbleWeight(datum) / maxWeight) * 42,
    }))
  }, [data])

  const xAxisY = createLinearScale(
    [-65, 165],
    [height - margin.bottom, margin.top],
  )(0)
  const yAxisX = createLinearScale(
    [-60, 85],
    [margin.left, width - margin.right],
  )(0)
  const filtered = selectedSector !== '전체 보기'

  return (
    <section className="chart-panel" aria-label="시장 버블 차트">
      <svg
        className="bubble-chart"
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

        {[-40, -20, 0, 20, 40, 60, 80].map((tick) => (
          <g key={`x-${tick}`}>
            <line
              className="grid-line"
              x1={createLinearScale([-60, 85], [margin.left, width - margin.right])(tick)}
              x2={createLinearScale([-60, 85], [margin.left, width - margin.right])(tick)}
              y1={margin.top}
              y2={height - margin.bottom}
            />
            <text
              className="axis-tick"
              x={createLinearScale([-60, 85], [margin.left, width - margin.right])(tick)}
              y={height - 28}
              textAnchor="middle"
            >
              {tick}%
            </text>
          </g>
        ))}
        {[-50, 0, 50, 100, 150].map((tick) => (
          <g key={`y-${tick}`}>
            <line
              className="grid-line"
              x1={margin.left}
              x2={width - margin.right}
              y1={createLinearScale([-65, 165], [height - margin.bottom, margin.top])(tick)}
              y2={createLinearScale([-65, 165], [height - margin.bottom, margin.top])(tick)}
            />
            <text
              className="axis-tick"
              x={margin.left - 14}
              y={
                createLinearScale([-65, 165], [height - margin.bottom, margin.top])(
                  tick,
                ) + 4
              }
              textAnchor="end"
            >
              {tick}%
            </text>
          </g>
        ))}

        <line className="zero-axis" x1={margin.left} x2={width - margin.right} y1={xAxisY} y2={xAxisY} />
        <line className="zero-axis" x1={yAxisX} x2={yAxisX} y1={margin.top} y2={height - margin.bottom} />

        <text className="quadrant-label" x={width - 154} y={margin.top + 34}>
          주도
        </text>
        <text className="quadrant-label" x={width - 190} y={height - 92}>
          조용한 상승
        </text>
        <text className="quadrant-label" x={margin.left + 28} y={margin.top + 34}>
          투매/손바뀜
        </text>
        <text className="quadrant-label" x={margin.left + 34} y={height - 92}>
          소외
        </text>

        <text className="axis-label" x={width / 2} y={height - 8} textAnchor="middle">
          최근 6개월 수익률
        </text>
        <text
          className="axis-label"
          transform={`translate(18 ${height / 2}) rotate(-90)`}
          textAnchor="middle"
        >
          최근 6개월 거래대금 변화율
        </text>

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
          <span>수익률 {formatPercent(tooltip.datum.return6m)}</span>
          <span>거래 변화 {formatPercent(tooltip.datum.tradingValueChange6m)}</span>
          <span>시가총액 {formatKrw(tooltip.datum.marketCap)}</span>
        </div>
      ) : null}
    </section>
  )
}
