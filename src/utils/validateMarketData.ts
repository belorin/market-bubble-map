import type { MarketBubbleDatum } from '../data/sampleMarketData'

const isMarket = (value: unknown): value is MarketBubbleDatum['market'] =>
  value === 'KOSPI' || value === 'KOSDAQ'

const isLevel = (value: unknown): value is MarketBubbleDatum['level'] =>
  value === 'sector' || value === 'stock'

const isFiniteNumber = (value: unknown): value is number =>
  typeof value === 'number' && Number.isFinite(value)

const isMarketBubbleDatum = (value: unknown): value is MarketBubbleDatum => {
  if (!value || typeof value !== 'object') {
    return false
  }

  const datum = value as Record<string, unknown>

  return (
    typeof datum.date === 'string' &&
    /^\d{4}-\d{2}$/.test(datum.date) &&
    isLevel(datum.level) &&
    typeof datum.id === 'string' &&
    datum.id.length > 0 &&
    typeof datum.name === 'string' &&
    datum.name.length > 0 &&
    isMarket(datum.market) &&
    typeof datum.sector === 'string' &&
    datum.sector.length > 0 &&
    isFiniteNumber(datum.marketCap) &&
    datum.marketCap > 0 &&
    isFiniteNumber(datum.tradingValue) &&
    datum.tradingValue >= 0 &&
    isFiniteNumber(datum.return6m) &&
    isFiniteNumber(datum.tradingValueChange6m)
  )
}

export const validateMarketData = (
  value: unknown,
): MarketBubbleDatum[] | null => {
  if (!Array.isArray(value) || value.length === 0) {
    return null
  }

  if (!value.every(isMarketBubbleDatum)) {
    return null
  }

  return value
}
