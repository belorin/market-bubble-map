# Korean Market Bubble Map

한국 주식시장 섹터의 6개월 수익률과 거래대금 변화율을 버블 맵으로 보는 정적 프론트엔드 프로토타입입니다.

앱은 백엔드, 인증, 외부 API 호출 없이 Vite가 제공하는 정적 JSON 파일을 읽습니다. 기본 샘플 데이터는 실제 시세가 아닌 프로토타입 데이터이며, 별도 Python 생성기로 `public/data/market-bubbles.json`을 만들면 화면에서 실데이터 파일을 우선 사용합니다.

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
  level: 'sector' | 'stock'
  marketCap: number
  tradingValue: number
  return6m: number
  tradingValueChange6m: number
}
```

JSON이 없거나 형식이 맞지 않으면 앱은 자동으로 샘플 데이터로 전환하고 화면에 데이터 상태를 표시합니다.

## 실데이터 JSON 생성

Python 의존성은 React 앱 실행이나 npm 빌드에는 필요하지 않습니다. 실데이터 JSON을 생성할 때만 설치합니다.

```bash
python3 -m venv .venv
. .venv/bin/activate
pip install -r scripts/requirements.txt
```

작은 테스트:

```bash
python scripts/generate_market_bubbles.py --from 2025-01 --to 2025-03 --limit-tickers 3 --sleep 0.5
```

섹터 제한 예시:

```bash
python scripts/generate_market_bubbles.py --from 2025-01 --to 2025-03 --sectors 반도체,자동차 --sleep 0.5
```

더 긴 기간 생성:

```bash
python scripts/generate_market_bubbles.py --from 2024-01 --to 2026-05
```

생성기는 `scripts/stock-sector-map.csv`를 읽고 `public/data/market-bubbles.json`을 씁니다. 이 파일이 있으면 앱 시작 시 화면에 `실데이터 파일 사용 중`이 표시됩니다.

원천 데이터는 `pykrx`의 KRX/Naver 기반 OHLCV 조회를 사용합니다. 반복 실행으로 원천에 부담을 주지 않도록 원시 종목 데이터는 `data/cache/market/` 아래에 캐시됩니다. `--sleep` 옵션으로 요청 간 대기 시간을 조정할 수 있고, `--limit-tickers`와 `--sectors`로 작은 범위부터 확인하는 것을 권장합니다.

현재 Raspberry Pi 환경에서는 `pykrx`의 시가총액 조회가 빈 데이터로 반환될 수 있어, 생성기는 OHLCV를 기본 원천으로 사용합니다. 가격, 거래량, 거래대금은 pykrx에서 가져오며, 거래대금이 없으면 `종가 × 거래량`으로 추정합니다. 시가총액은 `scripts/stock-sector-map.csv`의 `baseMarketCap`을 기준으로 `baseMarketCap × 현재 종가 / 첫 사용 가능 종가` 방식으로 추정합니다. 첫 실데이터 프로토타입용 추정치이므로 투자 판단에는 사용하지 마세요.

샘플 JSON인 `public/data/market-bubbles.sample.json`은 fallback 용도로 유지됩니다.
