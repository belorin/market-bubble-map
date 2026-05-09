export type MarketBubbleDatum = {
  date: string
  level: 'sector' | 'stock'
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

type StockProfile = {
  id: string
  name: string
  market: 'KOSPI' | 'KOSDAQ'
  sector: string
  baseMarketCap: number
  baseTradingValue: number
  sectorProfileId: string
  beta: number
  tradeBeta: number
  phase: number
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

const stockProfiles: StockProfile[] = [
  ['samsung-electronics', '삼성전자', 'KOSPI', '반도체', 455_000_000_000_000, 1_250_000_000_000, 'semiconductor', 0.95, 0.9, 0.2],
  ['sk-hynix', 'SK하이닉스', 'KOSPI', '반도체', 210_000_000_000_000, 820_000_000_000, 'semiconductor', 1.25, 1.18, 1.1],
  ['hyundai-motor', '현대차', 'KOSPI', '자동차', 58_000_000_000_000, 260_000_000_000, 'auto', 1.05, 0.95, 0.5],
  ['kia', '기아', 'KOSPI', '자동차', 44_000_000_000_000, 210_000_000_000, 'auto', 1.12, 1.02, 1.4],
  ['lg-energy-solution', 'LG에너지솔루션', 'KOSPI', '2차전지', 88_000_000_000_000, 360_000_000_000, 'battery', 1.05, 0.95, 0.8],
  ['samsung-sdi', '삼성SDI', 'KOSPI', '2차전지', 36_000_000_000_000, 190_000_000_000, 'battery', 0.92, 0.9, 1.9],
  ['ecopro-bm', '에코프로비엠', 'KOSDAQ', '2차전지', 18_000_000_000_000, 260_000_000_000, 'battery', 1.42, 1.6, 2.6],
  ['samsung-biologics', '삼성바이오로직스', 'KOSPI', '바이오', 62_000_000_000_000, 120_000_000_000, 'bio', 0.82, 0.82, 0.1],
  ['celltrion', '셀트리온', 'KOSPI', '바이오', 41_000_000_000_000, 190_000_000_000, 'bio', 1.1, 1.05, 1.3],
  ['alteogen', '알테오젠', 'KOSDAQ', '바이오', 16_000_000_000_000, 230_000_000_000, 'bio', 1.55, 1.75, 2.2],
  ['kb-financial', 'KB금융', 'KOSPI', '금융', 38_000_000_000_000, 120_000_000_000, 'finance', 1.02, 0.95, 0.4],
  ['shinhan-financial', '신한지주', 'KOSPI', '금융', 26_000_000_000_000, 92_000_000_000, 'finance', 0.94, 0.88, 1.5],
  ['hana-financial', '하나금융지주', 'KOSPI', '금융', 19_000_000_000_000, 78_000_000_000, 'finance', 1.08, 1.02, 2.4],
  ['hd-hyundai-heavy', 'HD현대중공업', 'KOSPI', '조선', 28_000_000_000_000, 160_000_000_000, 'shipbuilding', 1.15, 1.08, 0.6],
  ['samsung-heavy', '삼성중공업', 'KOSPI', '조선', 10_000_000_000_000, 120_000_000_000, 'shipbuilding', 1.22, 1.18, 1.6],
  ['hanwha-ocean', '한화오션', 'KOSPI', '조선', 12_000_000_000_000, 150_000_000_000, 'shipbuilding', 1.35, 1.28, 2.5],
  ['hanwha-aerospace', '한화에어로스페이스', 'KOSPI', '방산', 17_000_000_000_000, 170_000_000_000, 'defense', 1.35, 1.25, 0.7],
  ['lig-nex1', 'LIG넥스원', 'KOSPI', '방산', 5_400_000_000_000, 70_000_000_000, 'defense', 1.25, 1.32, 1.8],
  ['kai', '한국항공우주', 'KOSPI', '방산', 5_900_000_000_000, 62_000_000_000, 'defense', 1.02, 0.96, 2.8],
  ['naver', 'NAVER', 'KOSPI', '인터넷/게임', 34_000_000_000_000, 150_000_000_000, 'internet-game', 1.02, 0.95, 0.2],
  ['kakao', '카카오', 'KOSPI', '인터넷/게임', 22_000_000_000_000, 150_000_000_000, 'internet-game', 1.18, 1.12, 1.2],
  ['krafton', '크래프톤', 'KOSPI', '인터넷/게임', 13_000_000_000_000, 90_000_000_000, 'internet-game', 0.96, 0.9, 2.1],
  ['ncsoft', '엔씨소프트', 'KOSPI', '인터넷/게임', 4_500_000_000_000, 62_000_000_000, 'internet-game', 1.2, 1.2, 2.9],
  ['lg-hnh', 'LG생활건강', 'KOSPI', '소비재', 5_800_000_000_000, 38_000_000_000, 'consumer', 1.1, 1.0, 0.3],
  ['amorepacific', '아모레퍼시픽', 'KOSPI', '소비재', 7_400_000_000_000, 54_000_000_000, 'consumer', 1.18, 1.12, 1.4],
  ['cj-cheiljedang', 'CJ제일제당', 'KOSPI', '소비재', 5_100_000_000_000, 32_000_000_000, 'consumer', 0.82, 0.78, 2.3],
  ['kepco', '한국전력', 'KOSPI', '유틸리티', 15_000_000_000_000, 70_000_000_000, 'utility', 0.95, 0.9, 0.9],
  ['kogas', '한국가스공사', 'KOSPI', '유틸리티', 3_500_000_000_000, 46_000_000_000, 'utility', 1.12, 1.18, 2.0],
].map(
  ([
    id,
    name,
    market,
    sector,
    baseMarketCap,
    baseTradingValue,
    sectorProfileId,
    beta,
    tradeBeta,
    phase,
  ]) => ({
    id,
    name,
    market,
    sector,
    baseMarketCap,
    baseTradingValue,
    sectorProfileId,
    beta,
    tradeBeta,
    phase,
  }),
) as StockProfile[]

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
  (_, monthIndex) => {
    const sectorRecords = profiles.map((profile, sectorIndex) => {
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
        level: 'sector' as const,
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
    })

    const stockRecords = stockProfiles.map((profile, stockIndex) => {
      const sectorMovement = trendFor(profile.sectorProfileId, monthIndex)
      const return6m =
        sectorMovement.return6m * profile.beta +
        wave(monthIndex, profile.phase, 2.7) * 8
      const tradingValueChange6m =
        sectorMovement.tradingValueChange6m * profile.tradeBeta +
        wave(monthIndex, profile.phase + 0.8, 2.1) * 18
      const capMultiplier =
        1 +
        return6m / 175 +
        wave(monthIndex, stockIndex + profile.phase, 6.2) * 0.07
      const tradingMultiplier =
        1 +
        tradingValueChange6m / 120 +
        wave(monthIndex, stockIndex + profile.phase + 0.5, 2.8) * 0.14

      return {
        date: dateForIndex(monthIndex),
        level: 'stock' as const,
        id: profile.id,
        name: profile.name,
        market: profile.market,
        sector: profile.sector,
        marketCap: Math.round(
          profile.baseMarketCap * clamp(capMultiplier, 0.45, 2.1),
        ),
        tradingValue: Math.round(
          profile.baseTradingValue * clamp(tradingMultiplier, 0.3, 3.2),
        ),
        return6m: Number(clamp(return6m, -65, 95).toFixed(1)),
        tradingValueChange6m: Number(
          clamp(tradingValueChange6m, -70, 180).toFixed(1),
        ),
      }
    })

    return [...sectorRecords, ...stockRecords]
  },
).flat()

export const getUniqueDates = (data: MarketBubbleDatum[]) =>
  Array.from(new Set(data.map((datum) => datum.date))).sort()

export const getDataForDate = (data: MarketBubbleDatum[], date: string) =>
  data.filter((datum) => datum.date === date)

export const getSectorColor = (sector: string) =>
  profiles.find((profile) => profile.sector === sector)?.color ?? '#8ca3bd'
