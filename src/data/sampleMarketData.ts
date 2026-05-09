export type MarketBubbleDatum = {
  date: string
  id: string
  name: string
  market: 'KOSPI' | 'KOSDAQ'
  sector: string
  marketCap: number
  tradingValue: number
  return6m: number
  tradingValueChange6m: number
}

type SectorProfile = {
  id: string
  name: string
  market: 'KOSPI' | 'KOSDAQ'
  sector: string
  baseMarketCap: number
  baseTradingValue: number
  color: string
}

export const sectors = [
  '반도체',
  '자동차',
  '2차전지',
  '바이오',
  '금융',
  '조선',
  '방산',
  '인터넷/게임',
  '소비재',
  '유틸리티',
]

const profiles: SectorProfile[] = [
  {
    id: 'semiconductor',
    name: '반도체',
    market: 'KOSPI',
    sector: '반도체',
    baseMarketCap: 610_000_000_000_000,
    baseTradingValue: 1_900_000_000_000,
    color: '#55c7ff',
  },
  {
    id: 'auto',
    name: '자동차',
    market: 'KOSPI',
    sector: '자동차',
    baseMarketCap: 255_000_000_000_000,
    baseTradingValue: 760_000_000_000,
    color: '#66d19e',
  },
  {
    id: 'battery',
    name: '2차전지',
    market: 'KOSPI',
    sector: '2차전지',
    baseMarketCap: 235_000_000_000_000,
    baseTradingValue: 1_180_000_000_000,
    color: '#ffb84d',
  },
  {
    id: 'bio',
    name: '바이오',
    market: 'KOSDAQ',
    sector: '바이오',
    baseMarketCap: 150_000_000_000_000,
    baseTradingValue: 620_000_000_000,
    color: '#d184ff',
  },
  {
    id: 'finance',
    name: '금융',
    market: 'KOSPI',
    sector: '금융',
    baseMarketCap: 330_000_000_000_000,
    baseTradingValue: 560_000_000_000,
    color: '#82a8ff',
  },
  {
    id: 'shipbuilding',
    name: '조선',
    market: 'KOSPI',
    sector: '조선',
    baseMarketCap: 118_000_000_000_000,
    baseTradingValue: 410_000_000_000,
    color: '#40d7cf',
  },
  {
    id: 'defense',
    name: '방산',
    market: 'KOSPI',
    sector: '방산',
    baseMarketCap: 92_000_000_000_000,
    baseTradingValue: 360_000_000_000,
    color: '#ff7468',
  },
  {
    id: 'internet-game',
    name: '인터넷/게임',
    market: 'KOSDAQ',
    sector: '인터넷/게임',
    baseMarketCap: 175_000_000_000_000,
    baseTradingValue: 690_000_000_000,
    color: '#b7e35a',
  },
  {
    id: 'consumer',
    name: '소비재',
    market: 'KOSPI',
    sector: '소비재',
    baseMarketCap: 142_000_000_000_000,
    baseTradingValue: 320_000_000_000,
    color: '#f59ac2',
  },
  {
    id: 'utility',
    name: '유틸리티',
    market: 'KOSPI',
    sector: '유틸리티',
    baseMarketCap: 88_000_000_000_000,
    baseTradingValue: 210_000_000_000,
    color: '#a6b3c8',
  },
]

const monthCount = 65
const startYear = 2021
const startMonth = 0

const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value))

const wave = (index: number, phase: number, size: number) =>
  Math.sin(index / size + phase)

const dateForIndex = (index: number) => {
  const date = new Date(Date.UTC(startYear, startMonth + index, 1))
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(
    2,
    '0',
  )}`
}

const trendFor = (id: string, index: number) => {
  const yearProgress = index / 12
  const softNoise = wave(index, id.length * 0.7, 2.4) * 7

  switch (id) {
    case 'semiconductor': {
      const lift = index < 25 ? -14 : index < 36 ? 5 : index < 55 ? 32 : 24
      return {
        return6m: lift + softNoise + wave(index, 0.4, 4.6) * 9,
        tradingValueChange6m:
          (index < 25 ? -8 : index < 36 ? 22 : 68) +
          wave(index, 0.9, 3.4) * 23,
      }
    }
    case 'battery': {
      const lift = index < 34 ? 38 : index < 47 ? 4 : 13
      return {
        return6m: lift + softNoise + wave(index, 1.8, 3.9) * 14,
        tradingValueChange6m:
          (index < 34 ? 86 : index < 47 ? 18 : 34) +
          wave(index, 2.4, 2.8) * 31,
      }
    }
    case 'shipbuilding':
      return {
        return6m: -8 + yearProgress * 7.5 + softNoise,
        tradingValueChange6m: 4 + yearProgress * 16 + wave(index, 1.1, 3.6) * 18,
      }
    case 'defense':
      return {
        return6m: -3 + yearProgress * 6.7 + softNoise,
        tradingValueChange6m:
          8 + yearProgress * 14 + wave(index, 2.1, 3.2) * 22,
      }
    case 'bio': {
      const spike = index % 17 < 3 ? 64 : 0
      return {
        return6m: wave(index, 0.2, 2.3) * 24 + softNoise - 3,
        tradingValueChange6m:
          12 + spike + wave(index, 1.3, 1.9) * 35 + softNoise,
      }
    }
    case 'finance':
      return {
        return6m: 4 + wave(index, 0.7, 5.8) * 8,
        tradingValueChange6m: 3 + wave(index, 1.9, 6.2) * 14,
      }
    case 'internet-game':
      return {
        return6m:
          (index < 16 ? 20 : index < 38 ? -24 : -6) +
          wave(index, 2.3, 3.2) * 13,
        tradingValueChange6m:
          (index < 16 ? 36 : index < 38 ? -22 : 12) +
          wave(index, 0.6, 2.9) * 21,
      }
    case 'auto':
      return {
        return6m:
          (index < 25 ? 6 : index < 54 ? 22 : 12) +
          wave(index, 1.2, 4.4) * 12,
        tradingValueChange6m:
          (index < 25 ? 8 : index < 54 ? 42 : 24) +
          wave(index, 2.2, 4.2) * 18,
      }
    case 'consumer':
      return {
        return6m: 6 + wave(index, 0.1, 5.6) * 9,
        tradingValueChange6m: 4 + wave(index, 1.5, 5.1) * 13,
      }
    case 'utility':
      return {
        return6m: 1 + wave(index, 2.8, 6.8) * 6,
        tradingValueChange6m: -2 + wave(index, 0.8, 5.9) * 9,
      }
    default:
      return { return6m: 0, tradingValueChange6m: 0 }
  }
}

export const sampleMarketData: MarketBubbleDatum[] = Array.from(
  { length: monthCount },
  (_, monthIndex) =>
    profiles.map((profile, sectorIndex) => {
      const movement = trendFor(profile.id, monthIndex)
      const capMultiplier =
        1 +
        movement.return6m / 180 +
        wave(monthIndex, sectorIndex + 0.4, 7.8) * 0.06
      const tradingMultiplier =
        1 +
        movement.tradingValueChange6m / 130 +
        wave(monthIndex, sectorIndex + 1.2, 3.3) * 0.12

      return {
        date: dateForIndex(monthIndex),
        id: profile.id,
        name: profile.name,
        market: profile.market,
        sector: profile.sector,
        marketCap: Math.round(profile.baseMarketCap * clamp(capMultiplier, 0.55, 1.9)),
        tradingValue: Math.round(
          profile.baseTradingValue * clamp(tradingMultiplier, 0.38, 2.8),
        ),
        return6m: Number(clamp(movement.return6m, -55, 78).toFixed(1)),
        tradingValueChange6m: Number(
          clamp(movement.tradingValueChange6m, -58, 155).toFixed(1),
        ),
      }
    }),
).flat()

export const getUniqueDates = (data: MarketBubbleDatum[]) =>
  Array.from(new Set(data.map((datum) => datum.date))).sort()

export const getDataForDate = (data: MarketBubbleDatum[], date: string) =>
  data.filter((datum) => datum.date === date)

export const getSectorColor = (sector: string) =>
  profiles.find((profile) => profile.sector === sector)?.color ?? '#8ca3bd'
