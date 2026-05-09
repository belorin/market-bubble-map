#!/usr/bin/env python3
"""Static real-data generator for Korean Market Bubble Map.

The React app remains fully static. This script writes
public/data/market-bubbles.json, which the frontend can serve as a static file.

Data source policy:
- Prefer pykrx OHLCV queries for Korean market price and trading value data.
- Do not scrape websites manually.
- Cache raw per-ticker data under data/cache/market/.
- Do not run large collections automatically during npm build.

Market cap note:
In some environments, pykrx market-cap queries return empty data. This first
generator therefore uses OHLCV as the primary real source and estimates market
cap as baseMarketCap * currentClose / firstAvailableClose.
"""

from __future__ import annotations

import argparse
import csv
import json
import math
import re
import sys
import time
from dataclasses import dataclass
from datetime import date, timedelta
from pathlib import Path
from typing import Any


ROOT = Path(__file__).resolve().parents[1]
DEFAULT_STOCK_MAP = ROOT / "scripts" / "stock-sector-map.csv"
DEFAULT_OUTPUT = ROOT / "public" / "data" / "market-bubbles.json"
DEFAULT_CACHE_DIR = ROOT / "data" / "cache" / "market"


@dataclass(frozen=True)
class StockMapRow:
    ticker: str
    name: str
    market: str
    sector: str
    base_market_cap: int


@dataclass(frozen=True)
class TimePoint:
    label: str
    close: float
    trading_value: float
    market_cap: float


def parse_month(value: str) -> date:
    if not re.fullmatch(r"\d{4}-\d{2}", value):
        raise argparse.ArgumentTypeError("날짜는 YYYY-MM 형식이어야 합니다.")
    year, month = value.split("-")
    return date(int(year), int(month), 1)


def add_months(value: date, months: int) -> date:
    month_index = value.year * 12 + value.month - 1 + months
    year = month_index // 12
    month = month_index % 12 + 1
    return date(year, month, 1)


def month_end(value: date) -> date:
    return add_months(value, 1) - timedelta(days=1)


def month_range(start: date, end: date) -> list[date]:
    months: list[date] = []
    cursor = start
    while cursor <= end:
        months.append(cursor)
        cursor = add_months(cursor, 1)
    return months


def week_labels_between(start: date, end: date) -> set[str]:
    pd = get_pandas()
    labels: set[str] = set()
    for week_end in pd.date_range(start=start, end=end, freq="W-SUN"):
        labels.add(str(week_end.to_period("W-SUN")))
    return labels


def yyyymmdd(value: date) -> str:
    return value.strftime("%Y%m%d")


def month_label(value: date) -> str:
    return value.strftime("%Y-%m")


def day_label(value: Any) -> str:
    return value.strftime("%Y-%m-%d")


def read_stock_map(path: Path, sectors: set[str] | None, limit: int | None) -> list[StockMapRow]:
    with path.open("r", encoding="utf-8-sig", newline="") as file:
        rows = []
        for row in csv.DictReader(file):
            if sectors and row["sector"] not in sectors:
                continue
            rows.append(
                StockMapRow(
                    ticker=row["ticker"].zfill(6),
                    name=row["name"],
                    market=row["market"],
                    sector=row["sector"],
                    base_market_cap=int(row["baseMarketCap"]),
                )
            )

    if limit is not None:
        rows = rows[:limit]

    return rows


def normalize_ohlcv(raw: pd.DataFrame) -> pd.DataFrame:
    pd = get_pandas()
    if raw.empty:
        return pd.DataFrame()

    frame = raw.copy()
    frame.index = pd.to_datetime(frame.index)

    close_col = first_existing_column(frame, ["종가", "close", "Close"])
    volume_col = first_existing_column(frame, ["거래량", "volume", "Volume"])
    trading_value_col = first_existing_column(
        frame,
        ["거래대금", "trading_value", "TradingValue", "value"],
    )

    if close_col is None or volume_col is None:
        return pd.DataFrame()

    normalized = pd.DataFrame(index=frame.index)
    normalized["close"] = pd.to_numeric(frame[close_col], errors="coerce")
    normalized["volume"] = pd.to_numeric(frame[volume_col], errors="coerce")

    if trading_value_col is not None:
        normalized["tradingValue"] = pd.to_numeric(
            frame[trading_value_col],
            errors="coerce",
        )
    else:
        normalized["tradingValue"] = normalized["close"] * normalized["volume"]

    normalized = normalized.dropna(subset=["close", "volume", "tradingValue"])
    normalized = normalized[normalized["close"] > 0]
    return normalized.sort_index()


def first_existing_column(frame: pd.DataFrame, names: list[str]) -> str | None:
    for name in names:
        if name in frame.columns:
            return name
    return None


def cache_path(cache_dir: Path, ticker: str, start: date, end: date) -> Path:
    return cache_dir / f"{ticker}_{yyyymmdd(start)}_{yyyymmdd(end)}_ohlcv.csv"


def fetch_ticker_ohlcv(
    ticker: str,
    start: date,
    end: date,
    cache_dir: Path,
    sleep_seconds: float,
) -> pd.DataFrame:
    pd = get_pandas()
    cache_file = cache_path(cache_dir, ticker, start, end)
    if cache_file.exists():
        print(f"캐시 사용: {ticker}")
        return normalize_ohlcv(pd.read_csv(cache_file, index_col=0, parse_dates=True))

    print(f"pykrx 요청: {ticker}")
    try:
        from pykrx import stock
    except ImportError as error:
        raise SystemExit(
            "pykrx가 설치되어 있지 않습니다. `pip install -r scripts/requirements.txt`를 실행하세요."
        ) from error

    raw = stock.get_market_ohlcv_by_date(yyyymmdd(start), yyyymmdd(end), ticker)
    frame = normalize_ohlcv(raw)
    cache_dir.mkdir(parents=True, exist_ok=True)
    frame.to_csv(cache_file, encoding="utf-8")

    if sleep_seconds > 0:
        time.sleep(sleep_seconds)

    return frame


def rows_for_month(frame: pd.DataFrame, month: date) -> pd.DataFrame:
    pd = get_pandas()
    return frame.loc[
        (frame.index >= pd.Timestamp(month))
        & (frame.index <= pd.Timestamp(month_end(month)))
    ]


def row_for_month(frame: pd.DataFrame, month: date) -> Any | None:
    available = rows_for_month(frame, month)
    if available.empty:
        return None
    return available.iloc[-1]


def build_month_point(
    frame: pd.DataFrame,
    month: date,
    base_market_cap: int,
    first_close: float,
) -> TimePoint | None:
    row = row_for_month(frame, month)
    rows = rows_for_month(frame, month)
    if row is None:
        return None

    close = float(row["close"])
    trading_value = float(rows["tradingValue"].sum())
    market_cap = base_market_cap * close / first_close

    if not all(math.isfinite(value) for value in [close, trading_value, market_cap]):
        return None

    return TimePoint(
        label=month_label(month),
        close=close,
        trading_value=trading_value,
        market_cap=market_cap,
    )


def build_week_points(
    frame: pd.DataFrame,
    start: date,
    end: date,
    base_market_cap: int,
    first_close: float,
) -> list[TimePoint]:
    pd = get_pandas()
    if frame.empty:
        return []

    visible = frame.loc[
        (frame.index >= pd.Timestamp(start)) & (frame.index <= pd.Timestamp(end))
    ]
    if visible.empty:
        return []

    points: list[TimePoint] = []
    for _, week_rows in visible.groupby(visible.index.to_period("W-SUN")):
        if week_rows.empty:
            continue
        last_row = week_rows.iloc[-1]
        close = float(last_row["close"])
        trading_value = float(week_rows["tradingValue"].sum())
        market_cap = base_market_cap * close / first_close
        if not all(math.isfinite(value) for value in [close, trading_value, market_cap]):
            continue
        points.append(
            TimePoint(
                label=day_label(week_rows.index[-1]),
                close=close,
                trading_value=trading_value,
                market_cap=market_cap,
            )
        )

    return points


def safe_percent_change(current: float, previous: float) -> float | None:
    if previous <= 0:
        return None
    return (current / previous - 1) * 100


def average_trading_value(points: list[TimePoint]) -> float | None:
    if not points:
        return None
    total = sum(point.trading_value for point in points)
    return total / len(points)


def build_monthly_stock_records(
    stock_row: StockMapRow,
    frame: pd.DataFrame,
    months: list[date],
) -> list[dict[str, Any]]:
    if frame.empty:
        return []

    first_close = float(frame.iloc[0]["close"])
    if first_close <= 0:
        return []

    records: list[dict[str, Any]] = []
    for current_month in months:
        current = build_month_point(
            frame,
            current_month,
            stock_row.base_market_cap,
            first_close,
        )
        previous = build_month_point(
            frame,
            add_months(current_month, -6),
            stock_row.base_market_cap,
            first_close,
        )

        if current is None or previous is None:
            continue

        return_6m = safe_percent_change(current.close, previous.close)
        trading_change_6m = safe_percent_change(
            current.trading_value,
            previous.trading_value,
        )

        if return_6m is None or trading_change_6m is None:
            continue

        records.append(
            {
                "date": current.month,
                "id": stock_row.ticker,
                "name": stock_row.name,
                "market": stock_row.market,
                "sector": stock_row.sector,
                "level": "stock",
                "marketCap": round(current.market_cap),
                "tradingValue": round(current.trading_value),
                "return6m": round(return_6m, 1),
                "tradingValueChange6m": round(trading_change_6m, 1),
                "_currentTradingValueBasis": current.trading_value,
                "_previousTradingValue": previous.trading_value,
            }
        )

    return records


def build_weekly_stock_records(
    stock_row: StockMapRow,
    frame: pd.DataFrame,
    start: date,
    end: date,
) -> list[dict[str, Any]]:
    if frame.empty:
        return []

    first_close = float(frame.iloc[0]["close"])
    if first_close <= 0:
        return []

    points = build_week_points(
        frame,
        frame.index.min().date(),
        end,
        stock_row.base_market_cap,
        first_close,
    )
    records: list[dict[str, Any]] = []

    for index, current in enumerate(points):
        if current.label < start.strftime("%Y-%m-%d"):
            continue

        previous_index = index - 26
        if previous_index < 0:
            continue

        previous = points[previous_index]
        current_avg = average_trading_value(points[max(0, index - 3) : index + 1])
        previous_avg = average_trading_value(
            points[max(0, previous_index - 3) : previous_index + 1]
        )

        if current_avg is None or previous_avg is None:
            continue

        return_6m = safe_percent_change(current.close, previous.close)
        trading_change_6m = safe_percent_change(current_avg, previous_avg)

        if return_6m is None or trading_change_6m is None:
            continue

        records.append(
            {
                "date": current.label,
                "id": stock_row.ticker,
                "name": stock_row.name,
                "market": stock_row.market,
                "sector": stock_row.sector,
                "level": "stock",
                "marketCap": round(current.market_cap),
                "tradingValue": round(current.trading_value),
                "return6m": round(return_6m, 1),
                "tradingValueChange6m": round(trading_change_6m, 1),
                "_currentTradingValueBasis": current_avg,
                "_previousTradingValue": previous_avg,
            }
        )

    return records


def aggregate_sector_records(stock_records: list[dict[str, Any]]) -> list[dict[str, Any]]:
    grouped: dict[tuple[str, str], list[dict[str, Any]]] = {}
    for record in stock_records:
        grouped.setdefault((record["date"], record["sector"]), []).append(record)

    sector_records: list[dict[str, Any]] = []
    for (record_date, sector), records in sorted(grouped.items()):
        market_cap = sum(float(record["marketCap"]) for record in records)
        trading_value = sum(float(record["tradingValue"]) for record in records)
        current_trading_value_basis = sum(
            float(record.get("_currentTradingValueBasis", record["tradingValue"]))
            for record in records
        )
        previous_trading_value = sum(
            float(record.get("_previousTradingValue", 0)) for record in records
        )
        kosdaq_count = sum(1 for record in records if record["market"] == "KOSDAQ")
        market = "KOSDAQ" if kosdaq_count > len(records) / 2 else "KOSPI"
        weighted_return = weighted_average(records, "return6m", "marketCap")

        if previous_trading_value > 0:
            trading_change = (current_trading_value_basis / previous_trading_value - 1) * 100
        else:
            trading_change = weighted_average(records, "tradingValueChange6m", "tradingValue")

        sector_records.append(
            {
                "date": record_date,
                "id": sector_slug(sector),
                "name": sector,
                "market": market,
                "sector": sector,
                "level": "sector",
                "marketCap": round(market_cap),
                "tradingValue": round(trading_value),
                "return6m": round(weighted_return, 1),
                "tradingValueChange6m": round(trading_change, 1),
            }
        )

    return sector_records


def weighted_average(records: list[dict[str, Any]], value_key: str, weight_key: str) -> float:
    total_weight = sum(float(record[weight_key]) for record in records)
    if total_weight <= 0:
        return sum(float(record[value_key]) for record in records) / len(records)
    return sum(float(record[value_key]) * float(record[weight_key]) for record in records) / total_weight


def sector_slug(sector: str) -> str:
    known = {
        "반도체": "semiconductor",
        "자동차": "auto",
        "2차전지": "battery",
        "바이오": "bio",
        "금융": "finance",
        "조선": "shipbuilding",
        "방산": "defense",
        "인터넷/게임": "internet-game",
        "소비재": "consumer",
        "유틸리티": "utility",
    }
    if sector in known:
        return known[sector]
    return re.sub(r"[^a-z0-9-]+", "-", sector.lower()).strip("-") or "sector"


def validate_record(record: dict[str, Any]) -> bool:
    return (
        isinstance(record.get("date"), str)
        and re.fullmatch(r"\d{4}-\d{2}(-\d{2})?", record["date"]) is not None
        and record.get("level") in {"sector", "stock"}
        and isinstance(record.get("id"), str)
        and bool(record["id"])
        and isinstance(record.get("name"), str)
        and bool(record["name"])
        and record.get("market") in {"KOSPI", "KOSDAQ"}
        and isinstance(record.get("sector"), str)
        and bool(record["sector"])
        and is_positive_number(record.get("marketCap"))
        and is_non_negative_number(record.get("tradingValue"))
        and is_finite_number(record.get("return6m"))
        and is_finite_number(record.get("tradingValueChange6m"))
    )


def is_finite_number(value: Any) -> bool:
    return isinstance(value, (int, float)) and math.isfinite(value)


def is_positive_number(value: Any) -> bool:
    return is_finite_number(value) and value > 0


def is_non_negative_number(value: Any) -> bool:
    return is_finite_number(value) and value >= 0


def get_pandas() -> Any:
    try:
        import pandas as pd
    except ImportError as error:
        raise SystemExit(
            "pandas가 설치되어 있지 않습니다. `pip install -r scripts/requirements.txt`를 실행하세요."
        ) from error
    return pd


def strip_internal_fields(record: dict[str, Any]) -> dict[str, Any]:
    return {key: value for key, value in record.items() if not key.startswith("_")}


def write_records(records: list[dict[str, Any]], output: Path) -> None:
    public_records = [strip_internal_fields(record) for record in records]
    invalid_count = sum(1 for record in public_records if not validate_record(record))
    if invalid_count:
        raise SystemExit(f"생성 데이터 검증 실패: {invalid_count}개 레코드가 올바르지 않습니다.")

    output.parent.mkdir(parents=True, exist_ok=True)
    output.write_text(
        json.dumps(public_records, ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8",
    )
    print(f"저장 위치: {output}")


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Korean Market Bubble Map 정적 실데이터 생성기"
    )
    parser.add_argument("--from", dest="from_month", type=parse_month, default=parse_month("2025-01"))
    parser.add_argument("--to", dest="to_month", type=parse_month, default=parse_month("2025-06"))
    parser.add_argument("--limit-tickers", type=int, default=None)
    parser.add_argument("--sectors", type=str, default=None, help="쉼표로 구분한 섹터 목록")
    parser.add_argument(
        "--frequency",
        choices=["monthly", "weekly"],
        default="weekly",
        help="생성 주기",
    )
    parser.add_argument("--sleep", type=float, default=0.4)
    parser.add_argument("--stock-map", type=Path, default=DEFAULT_STOCK_MAP)
    parser.add_argument("--output", type=Path, default=DEFAULT_OUTPUT)
    parser.add_argument("--cache-dir", type=Path, default=DEFAULT_CACHE_DIR)
    parser.add_argument(
        "--sample-only",
        action="store_true",
        help="네트워크 요청 없이 CSV의 기준값으로 작은 형식 확인용 데이터를 생성합니다.",
    )
    return parser.parse_args()


def sample_dates(start: date, end: date, frequency: str) -> list[str]:
    if frequency == "monthly":
        return [month_label(month) for month in month_range(start, end)]

    dates: list[str] = []
    cursor = start
    while cursor <= end:
        dates.append(cursor.strftime("%Y-%m-%d"))
        cursor += timedelta(days=7)
    return dates


def generate_sample_only(
    rows: list[StockMapRow],
    start: date,
    end: date,
    frequency: str,
) -> list[dict[str, Any]]:
    records: list[dict[str, Any]] = []
    for date_index, current_label in enumerate(sample_dates(start, end, frequency)):
        for row_index, stock_row in enumerate(rows):
            movement = math.sin(date_index / 2.1 + row_index * 0.6)
            trading_movement = math.cos(date_index / 1.8 + row_index * 0.4)
            records.append(
                {
                    "date": current_label,
                    "id": stock_row.ticker,
                    "name": stock_row.name,
                    "market": stock_row.market,
                    "sector": stock_row.sector,
                    "level": "stock",
                    "marketCap": round(stock_row.base_market_cap * (1 + movement * 0.08)),
                    "tradingValue": round(stock_row.base_market_cap * 0.002 * (1 + trading_movement * 0.25)),
                    "return6m": round(movement * 18, 1),
                    "tradingValueChange6m": round(trading_movement * 45, 1),
                    "_previousTradingValue": stock_row.base_market_cap * 0.002,
                }
            )
    return records


def main() -> None:
    args = parse_args()
    if args.from_month > args.to_month:
        raise SystemExit("시작 월은 종료 월보다 늦을 수 없습니다.")

    sector_filter = (
        {sector.strip() for sector in args.sectors.split(",") if sector.strip()}
        if args.sectors
        else None
    )
    rows = read_stock_map(args.stock_map, sector_filter, args.limit_tickers)
    if not rows:
        raise SystemExit("읽을 종목이 없습니다. CSV, 섹터 필터, 제한 옵션을 확인하세요.")

    fetch_start = add_months(args.from_month, -7)
    fetch_end = month_end(args.to_month)

    print(f"{len(rows)}개 종목을 읽는 중")

    if args.sample_only:
        stock_records = generate_sample_only(
            rows,
            args.from_month,
            fetch_end,
            args.frequency,
        )
    else:
        stock_records = []
        for row in rows:
            try:
                frame = fetch_ticker_ohlcv(
                    row.ticker,
                    fetch_start,
                    fetch_end,
                    args.cache_dir,
                    args.sleep,
                )
                if frame.empty:
                    print(f"빈 데이터로 건너뜀: {row.ticker} {row.name}")
                    continue
                if args.frequency == "weekly":
                    stock_records.extend(
                        build_weekly_stock_records(
                            row,
                            frame,
                            args.from_month,
                            fetch_end,
                        )
                    )
                else:
                    stock_records.extend(
                        build_monthly_stock_records(
                            row,
                            frame,
                            month_range(args.from_month, args.to_month),
                        )
                    )
            except Exception as error:
                print(f"종목 처리 실패: {row.ticker} {row.name} - {error}", file=sys.stderr)
                continue

    sector_records = aggregate_sector_records(stock_records)
    all_records = sorted(
        [*sector_records, *stock_records],
        key=lambda record: (record["date"], record["level"], record["sector"], record["id"]),
    )

    if not all_records:
        raise SystemExit("생성된 레코드가 없습니다. 기간 또는 종목 목록을 확인하세요.")

    print(f"{len(all_records)}개 레코드 생성")
    write_records(all_records, args.output)


if __name__ == "__main__":
    main()
