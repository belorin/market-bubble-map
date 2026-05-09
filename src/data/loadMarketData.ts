import {
  sampleMarketData,
  type MarketBubbleDatum,
} from './sampleMarketData'
import { validateMarketData } from '../utils/validateMarketData'

export type MarketDataSource = 'real-json' | 'sample-json' | 'embedded-sample'

export type LoadedMarketData = {
  data: MarketBubbleDatum[]
  source: MarketDataSource
  fallbackNote?: string
}

const sourceLabels: Record<MarketDataSource, string> = {
  'real-json': '실데이터 파일 사용 중',
  'sample-json': '샘플 JSON 사용 중',
  'embedded-sample': '내장 샘플 데이터 사용 중',
}

export const getMarketDataSourceLabel = (source: MarketDataSource) =>
  sourceLabels[source]

const buildDataUrl = (filename: string) =>
  `${import.meta.env.BASE_URL.endsWith('/') ? import.meta.env.BASE_URL : `${import.meta.env.BASE_URL}/`}data/${filename}`

const fetchJsonData = async (filename: string) => {
  const response = await fetch(buildDataUrl(filename), { cache: 'no-store' })

  if (!response.ok) {
    throw new Error(`데이터 파일을 찾을 수 없습니다: ${filename}`)
  }

  const json = (await response.json()) as unknown
  const validated = validateMarketData(json)

  if (!validated) {
    throw new Error(`데이터 형식이 올바르지 않습니다: ${filename}`)
  }

  return validated
}

export const loadMarketData = async (): Promise<LoadedMarketData> => {
  try {
    const data = await fetchJsonData('market-bubbles.json')
    return { data, source: 'real-json' }
  } catch (realDataError) {
    try {
      const data = await fetchJsonData('market-bubbles.sample.json')
      return {
        data,
        source: 'sample-json',
        fallbackNote:
          realDataError instanceof Error
            ? realDataError.message
            : '실데이터 파일을 읽지 못했습니다.',
      }
    } catch {
      return {
        data: sampleMarketData,
        source: 'embedded-sample',
        fallbackNote:
          'JSON 데이터 파일을 읽지 못해 내장 샘플 데이터로 전환했습니다.',
      }
    }
  }
}
