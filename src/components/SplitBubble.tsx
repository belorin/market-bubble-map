import { useId } from 'react'
import type { MarketBubbleDatum } from '../data/sampleMarketData'
import { formatPercent, getRelatedBubbleColors } from '../utils/scales'

type SplitBubbleProps = {
  datum: MarketBubbleDatum
  x: number
  y: number
  radius: number
  selected: boolean
  faded: boolean
  onSelect: (datum: MarketBubbleDatum) => void
  onHover: (datum: MarketBubbleDatum | null, x: number, y: number) => void
}

const semicirclePath = (
  side: 'left' | 'right',
  radius: number,
  capRadius: number,
) => {
  const direction = side === 'left' ? -1 : 1
  const sweep = side === 'left' ? 0 : 1
  return [
    `M 0 ${-capRadius}`,
    `A ${radius} ${capRadius} 0 0 ${sweep} ${direction * radius} 0`,
    `A ${radius} ${capRadius} 0 0 ${sweep} 0 ${capRadius}`,
    'Z',
  ].join(' ')
}

export function SplitBubble({
  datum,
  x,
  y,
  radius,
  selected,
  faded,
  onSelect,
  onHover,
}: SplitBubbleProps) {
  const clipId = useId().replaceAll(':', '')
  const colors = getRelatedBubbleColors(datum.sector)
  const capScore = Math.sqrt(datum.marketCap / 1_000_000_000_000)
  const tradeScore = Math.sqrt(datum.tradingValue / 10_000_000_000)
  const totalScore = capScore + tradeScore
  const capShare = capScore / totalScore
  const tradeShare = tradeScore / totalScore
  const leftRadius = radius * (0.72 + capShare * 0.28)
  const rightRadius = radius * (0.72 + tradeShare * 0.28)
  const canShowLabel = radius > 24
  const externalLabel = !canShowLabel && radius > 15

  return (
    <g
      className={`bubble ${selected ? 'is-selected' : ''} ${faded ? 'is-faded' : ''}`}
      transform={`translate(${x} ${y})`}
      onClick={() => onSelect(datum)}
      onMouseEnter={() => onHover(datum, x, y)}
      onMouseMove={() => onHover(datum, x, y)}
      onMouseLeave={() => onHover(null, x, y)}
      role="button"
      tabIndex={0}
      aria-label={`${datum.name}, 수익률 ${formatPercent(datum.return6m)}, 거래대금 변화율 ${formatPercent(datum.tradingValueChange6m)}`}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault()
          onSelect(datum)
        }
      }}
    >
      <defs>
        <clipPath id={clipId}>
          <circle r={radius} />
        </clipPath>
      </defs>
      <circle className="bubble-hit" r={radius + 6} />
      <circle className="bubble-base" r={radius} fill={colors.muted} />
      <g clipPath={`url(#${clipId})`}>
        <path
          d={semicirclePath('left', leftRadius, radius)}
          fill={colors.left}
          opacity={0.58 + capShare * 0.34}
        />
        <path
          d={semicirclePath('right', rightRadius, radius)}
          fill={colors.right}
          opacity={0.63 + tradeShare * 0.34}
        />
        <line y1={-radius} y2={radius} className="bubble-divider" />
      </g>
      <circle className="bubble-outline" r={radius} />
      {canShowLabel ? (
        <text className="bubble-label" textAnchor="middle" dominantBaseline="middle">
          {datum.name}
        </text>
      ) : null}
      {externalLabel ? (
        <>
          <line
            className="leader-line"
            x1={radius * 0.7}
            y1={-radius * 0.7}
            x2={radius + 14}
            y2={-radius - 12}
          />
          <text
            className="bubble-label external"
            x={radius + 17}
            y={-radius - 13}
          >
            {datum.name}
          </text>
        </>
      ) : null}
    </g>
  )
}
