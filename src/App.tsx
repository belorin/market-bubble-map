import { useCallback, useEffect, useMemo, useState } from 'react'
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
import { getTrailPoints, type TrailPeriod } from './utils/trails'

type ViewMode = MarketBubbleDatum['level']

const shouldIgnoreShortcut = (target: EventTarget | null) => {
  if (!(target instanceof HTMLElement)) {
    return false
  }

  return (
    target.isContentEditable ||
    ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName)
  )
}

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
  const [refreshingData, setRefreshingData] = useState(false)
  const [refreshMessage, setRefreshMessage] = useState('')
  const [trailEnabled, setTrailEnabled] = useState(false)
  const [trailPeriod, setTrailPeriod] = useState<TrailPeriod>('3m')
  const [playing, setPlaying] = useState(false)

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
  const earliestDataDate = dates[0] ?? '확인 불가'
  const latestDataDate = dates.at(-1) ?? '확인 불가'
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
  const selectedSectorStocks = useMemo(
    () =>
      selectedDatum?.level === 'sector'
        ? getDataForDate(marketData, selectedDatum.date).filter(
            (datum) =>
              datum.level === 'stock' && datum.sector === selectedDatum.sector,
          )
        : [],
    [marketData, selectedDatum],
  )

  const trailData = useMemo(
    () =>
      trailEnabled
        ? getTrailPoints({
            data: marketData,
            dates,
            currentDate,
            selectedDatum: selectedId ? selectedDatum : undefined,
            period: trailPeriod,
          })
        : [],
    [currentDate, dates, marketData, selectedDatum, trailEnabled, trailPeriod],
  )

  const handleSelectDatum = (datum: MarketBubbleDatum) => {
    setSelectedId(datum.id)
  }

  const moveToPreviousDate = useCallback(() => {
    setSelectedDateIndex((current) => Math.max(0, current - 1))
  }, [])

  const moveToNextDate = useCallback(() => {
    setSelectedDateIndex((current) =>
      dates.length > 0 ? (current + 1) % dates.length : current,
    )
  }, [dates.length])

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (shouldIgnoreShortcut(event.target)) {
        return
      }

      if (event.key === 'Escape' && expandedChartOpen) {
        event.preventDefault()
        setExpandedChartOpen(false)
        return
      }

      if (event.key === ' ' || event.code === 'Space') {
        event.preventDefault()
        setPlaying((current) => !current)
        return
      }

      if (event.key === 'ArrowUp' && !expandedChartOpen) {
        event.preventDefault()
        setExpandedChartOpen(true)
        return
      }

      if (event.key === 'ArrowDown' && expandedChartOpen) {
        event.preventDefault()
        setExpandedChartOpen(false)
        return
      }

      if (event.key === 'ArrowLeft' && dates.length > 0) {
        event.preventDefault()
        setPlaying(false)
        moveToPreviousDate()
        return
      }

      if (event.key === 'ArrowRight' && dates.length > 0) {
        event.preventDefault()
        setPlaying(false)
        moveToNextDate()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [dates.length, expandedChartOpen, moveToNextDate, moveToPreviousDate])

  const handleRefreshData = async () => {
    setRefreshingData(true)
    setRefreshMessage('')

    try {
      const loadedData = await loadMarketData(String(Date.now()))
      const nextDates = getUniqueDates(loadedData.data)
      const currentDateBeforeRefresh = currentDate
      const preservedDateIndex = currentDateBeforeRefresh
        ? nextDates.indexOf(currentDateBeforeRefresh)
        : -1
      setMarketDataState(loadedData)
      setSelectedDateIndex(
        preservedDateIndex >= 0
          ? preservedDateIndex
          : Math.max(0, nextDates.length - 1),
      )
      setSelectedId(null)
      setRefreshMessage('현재 배포된 데이터가 다시 로드되었습니다.')
    } finally {
      setRefreshingData(false)
    }
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
      <ChartSettingToggle
        label="이동 경로"
        valueLabel={trailEnabled ? '켬' : '끔'}
        onToggle={() => setTrailEnabled((current) => !current)}
        ariaLabel="이동 경로 표시 전환"
      />
      <ChartSettingToggle
        label="경로 기간"
        valueLabel={trailPeriod === '3m' ? '3개월' : '6개월'}
        onToggle={() =>
          setTrailPeriod((current) => (current === '3m' ? '6m' : '3m'))
        }
        ariaLabel="경로 기간 전환"
      />
      <span className="keyboard-help">키보드: Space 재생/정지 · ↑ 크게 보기 · ↓ 닫기 · ← 이전 시점 · → 다음 시점</span>
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
        {marketDataState?.source === 'real-json'
          ? '데이터 기준: pykrx OHLCV · 주간 거래대금 합계 · 기준 시총 기반 추정 · 대표 종목 집계'
          : '샘플 데이터 사용 중 · 수치는 실제 시세가 아닌 시각화용 샘플입니다.'}
      </section>

      <section className="data-status" aria-label="데이터 상태">
        {loading || !marketDataState ? (
          <span>데이터를 불러오는 중입니다.</span>
        ) : (
          <>
            <span>데이터 범위: <strong>{earliestDataDate} ~ {latestDataDate}</strong></span>
            <span>최신 시점: <strong>{latestDataDate}</strong></span>
            <span>데이터 상태: <strong>{getMarketDataSourceLabel(marketDataState.source)}</strong></span>
            <button
              type="button"
              onClick={handleRefreshData}
              disabled={refreshingData}
            >
              데이터 새로고침
            </button>
            {refreshMessage ? <span>{refreshMessage}</span> : null}
            {marketDataState.source !== 'real-json' ? (
              <span>서버 데이터 수집은 SSH에서 실행해야 합니다.</span>
            ) : null}
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
              trailData={trailData}
              onSelect={handleSelectDatum}
            />
            <TimelineControl
              dates={dates}
              selectedIndex={selectedDateIndex}
              playing={playing}
              playbackActive={!expandedChartOpen}
              onChange={setSelectedDateIndex}
              onPlayingChange={setPlaying}
            />
          </div>
          <aside className="side-column">
            <InfoPanel datum={selectedDatum} compositionStocks={selectedSectorStocks} />
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
            trailData={trailData}
            variant="expanded"
            onSelect={handleSelectDatum}
          />
          <TimelineControl
            dates={dates}
            selectedIndex={selectedDateIndex}
            playing={playing}
            playbackActive={expandedChartOpen}
            onChange={setSelectedDateIndex}
            onPlayingChange={setPlaying}
          />
        </section>
      ) : null}
    </main>
  )
}

export default App
