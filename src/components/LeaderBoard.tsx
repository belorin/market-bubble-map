import type { MarketBubbleDatum } from '../data/sampleMarketData'
import { formatPercent } from '../utils/scales'

type LeaderBoardProps = {
  data: MarketBubbleDatum[]
}

const topFive = (data: MarketBubbleDatum[], sorter: (datum: MarketBubbleDatum) => number) =>
  [...data].sort((a, b) => sorter(b) - sorter(a)).slice(0, 5)

const bottomFive = (
  data: MarketBubbleDatum[],
  sorter: (datum: MarketBubbleDatum) => number,
) => [...data].sort((a, b) => sorter(a) - sorter(b)).slice(0, 5)

export function LeaderBoard({ data }: LeaderBoardProps) {
  const leading = topFive(
    data,
    (datum) => datum.return6m * 1.3 + datum.tradingValueChange6m,
  )
  const trading = topFive(data, (datum) => datum.tradingValueChange6m)
  const drawdown = bottomFive(data, (datum) => datum.return6m)

  return (
    <section className="leaderboards">
      <Board
        title="현재 날짜 기준 주도 섹터 상위 5개"
        data={leading}
        value={(datum) =>
          formatPercent(datum.return6m * 0.55 + datum.tradingValueChange6m * 0.45)
        }
      />
      <Board
        title="거래대금 증가 상위 5개"
        data={trading}
        value={(datum) => formatPercent(datum.tradingValueChange6m)}
      />
      <Board
        title="낙폭 과대 상위 5개"
        data={drawdown}
        value={(datum) => formatPercent(datum.return6m)}
      />
    </section>
  )
}

type BoardProps = {
  title: string
  data: MarketBubbleDatum[]
  value: (datum: MarketBubbleDatum) => string
}

function Board({ title, data, value }: BoardProps) {
  return (
    <div className="board">
      <h3>{title}</h3>
      <ol>
        {data.map((datum) => (
          <li key={datum.id}>
            <span>{datum.name}</span>
            <strong>{value(datum)}</strong>
          </li>
        ))}
      </ol>
    </div>
  )
}
