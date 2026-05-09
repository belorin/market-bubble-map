import {
  sampleMarketData,
  type MarketBubbleDatum,
} from './sampleMarketData'
import { validateMarketData } from '../utils/validateMarketData'

export type MarketDataSource =
  | 'real-json'
  | 'sample-json'
  | 'embedded-sample'
  | 'failed'

export type LoadedMarketData = {
  data: MarketBubbleDatum[]
  source: MarketDataSource
  fallbackNote?: string
}

const sourceLabels: Record<MarketDataSource, string> = {
  'real-json': '실데이터 파일 사용 중',
  'sample-json': '샘플 JSON 사용 중',
  'embedded-sample': '내장 샘플 데이터 사용 중',
  failed: '데이터 로딩 실패',
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
  const failures: string[] = []

  try {
    const data = await fetchJsonData('market-bubbles.json')
    return { data, source: 'real-json' }
  } catch (error) {
    failures.push(toErrorMessage(error))
    console.warn('실데이터 JSON을 읽지 못해 다음 데이터 소스로 전환합니다.', error)
  }

  try {
    const data = await fetchJsonData('market-bubbles.sample.json')
    return { data, source: 'sample-json' }
  } catch (error) {
    failures.push(toErrorMessage(error))
    console.warn('샘플 JSON을 읽지 못해 내장 데이터로 전환합니다.', error)
  }

  const embeddedData = validateMarketData(sampleMarketData)

  if (embeddedData) {
    return {
      data: sampleMarketData,
      source: 'embedded-sample',
    }
  }

  return {
    data: [],
    source: 'failed',
    fallbackNote:
      failures.length > 0
        ? '모든 데이터 소스를 읽지 못했습니다. 개발자 콘솔을 확인하세요.'
        : '데이터를 읽지 못했습니다.',
  }
}

const toErrorMessage = (error: unknown) => {
  if (error instanceof Error) {
    return error.message
  }

  return '알 수 없는 데이터 오류가 발생했습니다.'
}
