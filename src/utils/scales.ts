import { getSectorColor, type MarketBubbleDatum } from '../data/sampleMarketData'

export type AxisScaleMode = 'linear' | 'compressed'

const symlogConstant = 25

export const createLinearScale = (
  domain: [number, number],
  range: [number, number],
) => {
  const domainSize = domain[1] - domain[0] || 1
  const rangeSize = range[1] - range[0]

  return (value: number) =>
    range[0] + ((value - domain[0]) / domainSize) * rangeSize
}

export const createAxisScale = (
  domain: [number, number],
  range: [number, number],
  scaleMode: AxisScaleMode,
) => {
  if (scaleMode === 'linear') {
    return createClampedLinearScale(domain, range)
  }

  const transform = (value: number) =>
    Math.sign(value) * Math.log1p(Math.abs(value) / symlogConstant)
  const transformedDomain: [number, number] = [
    transform(domain[0]),
    transform(domain[1]),
  ]
  const transformedScale = createLinearScale(transformedDomain, range)

  return (value: number) =>
    clampToRange(transformedScale(transform(clamp(value, domain[0], domain[1]))), range)
}

export const getAxisDomain = (
  data: MarketBubbleDatum[],
  key: 'return6m' | 'tradingValueChange6m',
  fallback: [number, number],
) => {
  if (data.length === 0) {
    return fallback
  }

  const values = data.map((datum) => datum[key]).filter(Number.isFinite)
  const extent = Math.max(Math.abs(fallback[0]), Math.abs(fallback[1]), ...values.map(Math.abs))
  const padded = Math.ceil((extent * 1.08) / 10) * 10
  return [-padded, padded] as [number, number]
}

export const createClampedLinearScale = (
  domain: [number, number],
  range: [number, number],
) => {
  const scale = createLinearScale(domain, range)

  return (value: number) =>
    clampToRange(scale(clamp(value, domain[0], domain[1])), range)
}

const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value))

const clampToRange = (value: number, range: [number, number]) =>
  Math.min(Math.max(value, Math.min(...range)), Math.max(...range))

export const getBubbleWeight = (datum: MarketBubbleDatum) =>
  Math.sqrt(datum.marketCap / 1_000_000_000_000) * 2.2 +
  Math.sqrt(datum.tradingValue / 10_000_000_000) * 1.35

export const formatPercent = (value: number) =>
  `${value > 0 ? '+' : ''}${value.toFixed(1)}%`

export const formatKrw = (value: number) => {
  const jo = value / 1_000_000_000_000
  if (jo >= 1) {
    return `${jo.toLocaleString('ko-KR', { maximumFractionDigits: 1 })}조원`
  }

  const eok = value / 100_000_000
  return `${eok.toLocaleString('ko-KR', { maximumFractionDigits: 0 })}억원`
}

export const getRelatedBubbleColors = (sector: string) => {
  const base = getSectorColor(sector)
  return {
    left: base,
    right: brightenHex(base, 1.22),
    muted: brightenHex(base, 0.72),
  }
}

const brightenHex = (hex: string, factor: number) => {
  const clean = hex.replace('#', '')
  const channels = [0, 2, 4].map((start) =>
    Number.parseInt(clean.slice(start, start + 2), 16),
  )
  const adjusted = channels.map((channel) =>
    Math.max(0, Math.min(255, Math.round(channel * factor))),
  )
  return `#${adjusted.map((channel) => channel.toString(16).padStart(2, '0')).join('')}`
}
