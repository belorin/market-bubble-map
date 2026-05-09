import { useMemo, useState } from 'react'
import { BubbleChart } from './components/BubbleChart'
import { InfoPanel } from './components/InfoPanel'
import { LeaderBoard } from './components/LeaderBoard'
import { SectorFilter } from './components/SectorFilter'
import { TimelineControl } from './components/TimelineControl'
import {
  getDataForDate,
  getUniqueDates,
  sampleMarketData,
  sectors,
  type MarketBubbleDatum,
} from './data/sampleMarketData'

function App() {
  const dates = useMemo(() => getUniqueDates(sampleMarketData), [])
  const [selectedDateIndex, setSelectedDateIndex] = useState(dates.length - 1)
  const [selectedSector, setSelectedSector] = useState('전체 보기')
  const currentDate = dates[selectedDateIndex]
  const currentData = useMemo(
    () => getDataForDate(sampleMarketData, currentDate),
    [currentDate],
  )
  const [selectedId, setSelectedId] = useState<string | null>(
    currentData[0]?.id ?? null,
  )

  const selectedDatum =
    currentData.find((datum) => datum.id === selectedId) ?? currentData[0]

  const handleSelectDatum = (datum: MarketBubbleDatum) => {
    setSelectedId(datum.id)
  }

  return (
    <main className="app-shell">
      <header className="app-header">
        <div>
          <h1>Korean Market Bubble Map</h1>
          <p className="subtitle">한국 주식시장의 무게중심과 관심 이동</p>
          <p className="axis-guide">
            X축은 최근 6개월 수익률, Y축은 최근 6개월 거래대금 변화율입니다.
          </p>
        </div>
        <div className="date-card">
          <span>선택 날짜</span>
          <strong>{currentDate}</strong>
        </div>
      </header>

      <section className="notice">
        현재 화면은 실제 시세가 아닌 샘플 데이터로 구성된 시각화
        프로토타입입니다.
      </section>

      <section className="workbench">
        <div className="chart-column">
          <SectorFilter
            sectors={sectors}
            selectedSector={selectedSector}
            onChange={setSelectedSector}
          />
          <BubbleChart
            data={currentData}
            selectedId={selectedDatum?.id}
            selectedSector={selectedSector}
            onSelect={handleSelectDatum}
          />
          <TimelineControl
            dates={dates}
            selectedIndex={selectedDateIndex}
            onChange={setSelectedDateIndex}
          />
        </div>
        <aside className="side-column">
          <InfoPanel datum={selectedDatum} />
          <LeaderBoard data={currentData} />
        </aside>
      </section>
    </main>
  )
}

export default App
