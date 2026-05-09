import type { MarketBubbleDatum } from '../data/sampleMarketData'
import { formatKrw, formatPercent } from '../utils/scales'
import { getBubbleStatus } from '../utils/status'

type InfoPanelProps = {
  datum?: MarketBubbleDatum
  compositionStocks?: MarketBubbleDatum[]
}

export function InfoPanel({ datum, compositionStocks = [] }: InfoPanelProps) {
  if (!datum) {
    return (
      <section className="info-panel">
        <h2>선택 정보</h2>
        <p>버블을 선택하면 상세 정보가 표시됩니다.</p>
      </section>
    )
  }

  const rows = [
    ['이름', datum.name],
    ['보기 단위', datum.level === 'sector' ? '섹터' : '종목'],
    ['시장', datum.market],
    ['섹터', datum.sector],
    ['최근 6개월 수익률', formatPercent(datum.return6m)],
    ['최근 6개월 거래대금 변화율', formatPercent(datum.tradingValueChange6m)],
    ['시가총액', formatKrw(datum.marketCap)],
    ['거래대금', formatKrw(datum.tradingValue)],
  ]
  const compositionNames = compositionStocks.slice(0, 3).map((stock) => stock.name)
  const compositionText =
    compositionStocks.length > 3
      ? `${compositionNames.join(', ')} 외`
      : compositionNames.join(', ')

  return (
    <section className="info-panel">
      <div className="panel-heading">
        <h2>선택 정보</h2>
        <span className="status-chip">{getBubbleStatus(datum)}</span>
      </div>
      <dl>
        {rows.map(([label, value]) => (
          <div key={label} className="info-row">
            <dt>{label}</dt>
            <dd>{value}</dd>
          </div>
        ))}
        <div className="info-row">
          <dt>상태 라벨</dt>
          <dd>{getBubbleStatus(datum)}</dd>
        </div>
        {datum.level === 'sector' ? (
          <>
            <div className="info-row">
              <dt>구성 종목</dt>
              <dd>{compositionStocks.length}개</dd>
            </div>
            {compositionText ? (
              <div className="info-row">
                <dt>구성</dt>
                <dd>{compositionText}</dd>
              </div>
            ) : null}
          </>
        ) : (
          <div className="info-row">
            <dt>데이터 단위</dt>
            <dd>종목 단위 데이터</dd>
          </div>
        )}
      </dl>
      <p className="split-note">
        {datum.level === 'sector'
          ? '대표 종목 기준 집계'
          : '왼쪽은 시가총액, 오른쪽은 거래대금입니다.'}
      </p>
    </section>
  )
}
