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
  const leftClipId = `${clipId}-left`
  const rightClipId = `${clipId}-right`
  const colors = getRelatedBubbleColors(datum.sector)
  const capScore = Math.sqrt(datum.marketCap / 1_000_000_000_000)
  const tradeScore = Math.sqrt(datum.tradingValue / 10_000_000_000)
  const totalScore = capScore + tradeScore
  const capShare = capScore / totalScore
  const tradeShare = tradeScore / totalScore
  const leftCoreRadius = radius * (0.34 + capShare * 0.58)
  const rightCoreRadius = radius * (0.34 + tradeShare * 0.58)
  const canShowLabel = radius > 24
  const externalLabel = !canShowLabel && radius > 15

  return (
    <g
      className={`bubble ${selected ? 'is-selected' : ''} ${faded ? 'is-faded' : ''}`}
      style={{ transform: `translate(${x}px, ${y}px)` }}
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
        <clipPath id={leftClipId}>
          <rect x={-radius} y={-radius} width={radius} height={radius * 2} />
        </clipPath>
        <clipPath id={rightClipId}>
          <rect x={0} y={-radius} width={radius} height={radius * 2} />
        </clipPath>
      </defs>
      <circle className="bubble-hit" r={radius + 6} />
      <g clipPath={`url(#${clipId})`}>
        <path
          className="bubble-half left"
          d={semicirclePath('left', radius, radius)}
          fill={colors.left}
          opacity={0.52 + capShare * 0.3}
        />
        <path
          className="bubble-half right"
          d={semicirclePath('right', radius, radius)}
          fill={colors.right}
          opacity={0.62 + tradeShare * 0.34}
        />
        <g clipPath={`url(#${leftClipId})`}>
          <circle
            className="bubble-core left"
            cx={-radius * 0.2}
            cy={0}
            r={leftCoreRadius}
            fill={colors.left}
            opacity={0.28 + capShare * 0.5}
          />
        </g>
        <g clipPath={`url(#${rightClipId})`}>
          <circle
            className="bubble-core right"
            cx={radius * 0.22}
            cy={0}
            r={rightCoreRadius}
            fill={colors.right}
            opacity={0.34 + tradeShare * 0.56}
          />
          <circle
            className="bubble-highlight"
            cx={radius * 0.34}
            cy={-radius * 0.34}
            r={Math.max(3, radius * 0.16)}
            opacity={0.16 + tradeShare * 0.26}
          />
        </g>
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
