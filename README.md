# Korean Market Bubble Map

한국 주식시장 섹터의 6개월 수익률과 거래대금 변화율을 버블 맵으로 보는 정적 프론트엔드 프로토타입입니다.

현재 데이터는 실제 시세가 아닌 샘플 데이터입니다. 앱은 백엔드, 인증, 외부 API 호출 없이 Vite가 제공하는 정적 JSON 파일을 읽습니다.

## 실행

```bash
npm install
npm run dev
```

프로덕션 빌드:

```bash
npm run build
```

이 앱은 `/market-bubble/` 하위 경로 배포를 기준으로 `vite.config.ts`에 `base: '/market-bubble/'`가 설정되어 있습니다. `dist/` 내용을 `/var/www/html/market-bubble/`에 복사하면 정적 배포 형태로 동작합니다.

## 데이터 파일

앱 시작 시 다음 순서로 데이터를 읽습니다.

1. `public/data/market-bubbles.json`
2. `public/data/market-bubbles.sample.json`
3. `src/data/sampleMarketData.ts`

실제 또는 생성된 정적 데이터는 `public/data/market-bubbles.json`에 두면 됩니다. 파일은 `MarketBubbleDatum[]` JSON 배열이어야 합니다.

```ts
type MarketBubbleDatum = {
  date: string
  id: string
  name: string
  market: 'KOSPI' | 'KOSDAQ'
  sector: string
  marketCap: number
  tradingValue: number
  return6m: number
  tradingValueChange6m: number
}
```

JSON이 없거나 형식이 맞지 않으면 앱은 자동으로 샘플 데이터로 전환하고 화면에 데이터 상태를 표시합니다.

## 정적 데이터 생성 실험

초기 실험용 스크립트는 `scripts/generate_market_bubbles.py`에 있습니다. 현재는 큰 수집 작업을 하지 않으며 `--sample-only` 모드만 지원합니다.

```bash
python3 scripts/generate_market_bubbles.py --sample-only
```

위 명령은 `scripts/sector-map.csv`를 읽어 `public/data/market-bubbles.json`을 생성합니다.

향후 `pykrx`와 `FinanceDataReader`를 이용해 종목별 시가총액, 거래대금, 가격 데이터를 수집하고 섹터 단위로 집계하는 로직을 이 스크립트에 추가할 예정입니다. Python 의존성 후보는 `scripts/requirements.txt`에 정리되어 있으며, npm 빌드에는 사용되지 않습니다.
