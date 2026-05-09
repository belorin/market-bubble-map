import type { MarketBubbleDatum } from '../data/sampleMarketData'

export type TrailPeriod = '3m' | '6m'

export const getTrailPoints = ({
  data,
  dates,
  currentDate,
  selectedDatum,
  period,
}: {
  data: MarketBubbleDatum[]
  dates: string[]
  currentDate?: string
  selectedDatum?: MarketBubbleDatum
  period: TrailPeriod
}) => {
  if (!currentDate || !selectedDatum) {
    return []
  }

  const currentIndex = dates.indexOf(currentDate)
  if (currentIndex < 0) {
    return []
  }

  const windowSize = getWindowSize(currentDate, period)
  const startIndex = Math.max(0, currentIndex - windowSize)
  const dateWindow = dates.slice(startIndex, currentIndex + 1)

  return dateWindow
    .map((date) =>
      data.find(
        (datum) =>
          datum.date === date &&
          datum.id === selectedDatum.id &&
          datum.level === selectedDatum.level,
      ),
    )
    .filter((datum): datum is MarketBubbleDatum => Boolean(datum))
}

const getWindowSize = (date: string, period: TrailPeriod) => {
  const weekly = isWeeklyDate(date)

  if (period === '3m') {
    return weekly ? 13 : 3
  }

  return weekly ? 26 : 6
}

const isWeeklyDate = (date: string) => /^\d{4}-\d{2}-\d{2}$/.test(date)
