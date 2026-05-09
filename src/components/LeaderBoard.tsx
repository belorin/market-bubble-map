import { useMemo, useState } from 'react'
import type { MarketBubbleDatum } from '../data/sampleMarketData'
import { formatPercent } from '../utils/scales'

type LeaderBoardProps = {
  data: MarketBubbleDatum[]
}

type RankingTab = 'leading' | 'trading' | 'drawdown'

const topFive = (data: MarketBubbleDatum[], sorter: (datum: MarketBubbleDatum) => number) =>
  [...data].sort((a, b) => sorter(b) - sorter(a)).slice(0, 5)

const bottomFive = (
  data: MarketBubbleDatum[],
  sorter: (datum: MarketBubbleDatum) => number,
) => [...data].sort((a, b) => sorter(a) - sorter(b)).slice(0, 5)

export function LeaderBoard({ data }: LeaderBoardProps) {
  const [activeTab, setActiveTab] = useState<RankingTab>('leading')
  const rankings = useMemo(
    () => ({
      leading: topFive(
        data,
        (datum) => datum.return6m * 1.3 + datum.tradingValueChange6m,
      ),
      trading: topFive(data, (datum) => datum.tradingValueChange6m),
      drawdown: bottomFive(data, (datum) => datum.return6m),
    }),
    [data],
  )
  const valueFormatters: Record<RankingTab, (datum: MarketBubbleDatum) => string> = {
    leading: (datum) =>
      formatPercent(datum.return6m * 0.55 + datum.tradingValueChange6m * 0.45),
    trading: (datum) => formatPercent(datum.tradingValueChange6m),
    drawdown: (datum) => formatPercent(datum.return6m),
  }

  return (
    <section className="leaderboards">
      <div className="leaderboard-heading">
        <h2>요약 랭킹</h2>
        <div className="ranking-tabs" aria-label="랭킹 선택">
          <button
            type="button"
            className={activeTab === 'leading' ? 'active' : ''}
            onClick={() => setActiveTab('leading')}
          >
            주도
          </button>
          <button
            type="button"
            className={activeTab === 'trading' ? 'active' : ''}
            onClick={() => setActiveTab('trading')}
          >
            거래 증가
          </button>
          <button
            type="button"
            className={activeTab === 'drawdown' ? 'active' : ''}
            onClick={() => setActiveTab('drawdown')}
          >
            낙폭 과대
          </button>
        </div>
      </div>
      <Board
        data={rankings[activeTab]}
        value={valueFormatters[activeTab]}
      />
    </section>
  )
}

type BoardProps = {
  data: MarketBubbleDatum[]
  value: (datum: MarketBubbleDatum) => string
}

function Board({ data, value }: BoardProps) {
  return (
    <div className="board">
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
