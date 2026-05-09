import { useEffect, useMemo, useState } from 'react'
import { BubbleChart } from './components/BubbleChart'
import { ChartSettingToggle } from './components/ChartSettingToggle'
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
import type { AxisScaleMode, ChartMetricMode } from './utils/scales'

type ViewMode = MarketBubbleDatum['level']

function App() {
  const [marketDataState, setMarketDataState] =
    useState<LoadedMarketData | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedDateIndex, setSelectedDateIndex] = useState(0)
  const [selectedSector, setSelectedSector] = useState('전체 보기')
  const [viewMode, setViewMode] = useState<ViewMode>('sector')
  const [chartMetricMode, setChartMetricMode] =
    useState<ChartMetricMode>('relative')
  const [axisScaleMode, setAxisScaleMode] =
    useState<AxisScaleMode>('compressed')
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [expandedChartOpen, setExpandedChartOpen] = useState(false)

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

  useEffect(() => {
    if (!expandedChartOpen) {
      return
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setExpandedChartOpen(false)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [expandedChartOpen])

  const selectedDatum =
    currentData.find((datum) => datum.id === selectedId) ?? currentData[0]

  const handleSelectDatum = (datum: MarketBubbleDatum) => {
    setSelectedId(datum.id)
  }

  const chartSettings = (
    <section className="chart-settings-row" aria-label="차트 설정">
      <ChartSettingToggle
        label="보기 단위"
        valueLabel={viewMode === 'sector' ? '섹터' : '종목'}
        onToggle={() =>
          setViewMode((current) => (current === 'sector' ? 'stock' : 'sector'))
        }
        ariaLabel="보기 단위 선택"
      />
      <ChartSettingToggle
        label="자료 기준"
        valueLabel={chartMetricMode === 'relative' ? '변화율' : '규모'}
        onToggle={() =>
          setChartMetricMode((current) =>
            current === 'relative' ? 'absolute' : 'relative',
          )
        }
        ariaLabel="자료 기준 선택"
      />
      <ChartSettingToggle
        label="축 스케일"
        valueLabel={axisScaleMode === 'linear' ? '선형' : '압축'}
        onToggle={() =>
          setAxisScaleMode((current) =>
            current === 'linear' ? 'compressed' : 'linear',
          )
        }
        ariaLabel="축 스케일 선택"
      />
    </section>
  )

  return (
    <main className="app-shell">
      <header className="app-header">
        <div>
          <h1>Korean Market Bubble Map</h1>
          <p className="subtitle">한국 주식시장의 무게중심과 관심 이동</p>
          <p className="axis-guide">변화율과 규모를 전환해 보는 시장 지도입니다.</p>
        </div>
        <div className="date-card">
          <span>현재 선택된 날짜</span>
          <strong>{currentDate ?? '로딩 중'}</strong>
        </div>
      </header>

      <section className="notice">
        샘플 데이터는 프로토타입용입니다.
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
            {chartSettings}
            <SectorFilter
              sectors={sectors}
              selectedSector={selectedSector}
              onChange={setSelectedSector}
            />
            <section className="chart-action-row" aria-label="차트 작업">
              <button
                type="button"
                className="expand-button"
                onClick={() => setExpandedChartOpen(true)}
              >
                차트 크게 보기
              </button>
            </section>
            <BubbleChart
              data={currentData}
              selectedId={selectedDatum?.id}
              selectedSector={selectedSector}
              chartMetricMode={chartMetricMode}
              axisScaleMode={axisScaleMode}
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
      {expandedChartOpen && !loading && marketDataState?.source !== 'failed' ? (
        <section className="chart-overlay" role="dialog" aria-modal="true" aria-label="확대 차트">
          <div className="overlay-header">
            <div>
              <strong>현재 날짜 {currentDate}</strong>
            </div>
            <button type="button" onClick={() => setExpandedChartOpen(false)}>
              닫기
            </button>
          </div>
          <div className="overlay-controls">
            {chartSettings}
          </div>
          <BubbleChart
            data={currentData}
            selectedId={selectedDatum?.id}
            selectedSector={selectedSector}
            chartMetricMode={chartMetricMode}
            axisScaleMode={axisScaleMode}
            variant="expanded"
            onSelect={handleSelectDatum}
          />
          <TimelineControl
            dates={dates}
            selectedIndex={selectedDateIndex}
            onChange={setSelectedDateIndex}
          />
        </section>
      ) : null}
    </main>
  )
}

export default App
