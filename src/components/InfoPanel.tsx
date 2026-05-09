import type { MarketBubbleDatum } from '../data/sampleMarketData'
import { formatKrw, formatPercent } from '../utils/scales'
import { getBubbleStatus } from '../utils/status'

type InfoPanelProps = {
  datum?: MarketBubbleDatum
}

export function InfoPanel({ datum }: InfoPanelProps) {
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
      </dl>
      <p className="split-note">
        왼쪽 반원은 시가총액, 오른쪽 반원은 거래대금의 상대 기여도를
        나타냅니다.
      </p>
    </section>
  )
}
