import { getSectorColor, type MarketBubbleDatum } from '../data/sampleMarketData'

export const createLinearScale = (
  domain: [number, number],
  range: [number, number],
) => {
  const domainSize = domain[1] - domain[0] || 1
  const rangeSize = range[1] - range[0]

  return (value: number) =>
    range[0] + ((value - domain[0]) / domainSize) * rangeSize
}

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
