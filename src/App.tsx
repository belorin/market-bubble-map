import { useEffect, useMemo, useState } from 'react'
import { BubbleChart } from './components/BubbleChart'
import { InfoPanel } from './components/InfoPanel'
import { LeaderBoard } from './components/LeaderBoard'
import { SectorFilter } from './components/SectorFilter'
import { TimelineControl } from './components/TimelineControl'
import {
  getMarketDataSourceLabel,
  loadMarketData,
  type LoadedMarketData,
} from './data/loadMarketData'
import {
  getDataForDate,
  getUniqueDates,
  sectors,
  type MarketBubbleDatum,
} from './data/sampleMarketData'

type ViewMode = MarketBubbleDatum['level']

function App() {
  const [marketDataState, setMarketDataState] =
    useState<LoadedMarketData | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedDateIndex, setSelectedDateIndex] = useState(0)
  const [selectedSector, setSelectedSector] = useState('전체 보기')
  const [viewMode, setViewMode] = useState<ViewMode>('sector')
  const [selectedId, setSelectedId] = useState<string | null>(null)

  useEffect(() => {
    let active = true

    loadMarketData()
      .then((loadedData) => {
        if (!active) {
          return
        }

        setMarketDataState(loadedData)
        setSelectedDateIndex(Math.max(0, getUniqueDates(loadedData.data).length - 1))
        setSelectedId(null)
      })
      .finally(() => {
        if (active) {
          setLoading(false)
        }
      })

    return () => {
      active = false
    }
  }, [])

  const marketData = marketDataState?.data ?? []
  const dates = useMemo(() => getUniqueDates(marketData), [marketData])
  const currentDate = dates[selectedDateIndex]
  const currentData = useMemo(
    () =>
      currentDate
        ? getDataForDate(marketData, currentDate).filter(
            (datum) => datum.level === viewMode,
          )
        : [],
    [currentDate, marketData, viewMode],
  )

  useEffect(() => {
    setSelectedId(null)
  }, [viewMode])

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
          <span>현재 선택된 날짜</span>
          <strong>{currentDate ?? '로딩 중'}</strong>
        </div>
      </header>

      <section className="notice">
        현재 화면은 실제 시세가 아닌 샘플 데이터로 구성된 시각화
        프로토타입입니다.
      </section>

      <section className="data-status" aria-label="데이터 상태">
        {loading || !marketDataState ? (
          <span>데이터를 불러오는 중입니다.</span>
        ) : (
          <>
            <strong>{getMarketDataSourceLabel(marketDataState.source)}</strong>
            {marketDataState.source === 'failed' && marketDataState.fallbackNote ? (
              <span>{marketDataState.fallbackNote}</span>
            ) : null}
          </>
        )}
      </section>

      {loading || !marketDataState ? (
        <section className="loading-panel">시각화 데이터를 준비하는 중입니다.</section>
      ) : marketDataState.source === 'failed' ? (
        <section className="loading-panel">표시할 수 있는 데이터가 없습니다.</section>
      ) : (
        <section className="workbench">
          <div className="chart-column">
            <section className="view-toggle" aria-label="보기 단위">
              <span>보기 단위:</span>
              <button
                type="button"
                className={viewMode === 'sector' ? 'active' : ''}
                onClick={() => setViewMode('sector')}
              >
                섹터
              </button>
              <button
                type="button"
                className={viewMode === 'stock' ? 'active' : ''}
                onClick={() => setViewMode('stock')}
              >
                종목
              </button>
            </section>
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
      )}
    </main>
  )
}

export default App
