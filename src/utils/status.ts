import type { MarketBubbleDatum } from '../data/sampleMarketData'

export type BubbleStatus =
  | '주도'
  | '과열'
  | '회복'
  | '소외'
  | '투매/손바뀜'
  | '중립'

export const getBubbleStatus = (datum: MarketBubbleDatum): BubbleStatus => {
  if (datum.return6m > 30 && datum.tradingValueChange6m > 80) {
    return '과열'
  }

  if (datum.return6m > 20 && datum.tradingValueChange6m > 30) {
    return '주도'
  }

  if (datum.return6m < 0 && datum.tradingValueChange6m > 50) {
    return '투매/손바뀜'
  }

  if (datum.return6m > 0 && datum.tradingValueChange6m > 20) {
    return '회복'
  }

  if (datum.return6m < 0 && datum.tradingValueChange6m < 0) {
    return '소외'
  }

  return '중립'
}
