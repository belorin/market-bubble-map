#!/usr/bin/env python3
"""Experimental static data generator for Korean Market Bubble Map.

This script does not run during npm build and does not require API keys.
The first supported mode is --sample-only, which writes synthetic sector-level
records in the same MarketBubbleDatum JSON format used by the frontend.

Future work:
- Use pykrx to collect listed company market capitalization and price history.
- Optionally use FinanceDataReader for complementary price/index metadata.
- Aggregate company-level records into the sector map in sector-map.csv.
- Compute six-month return and six-month trading-value change per sector.
"""

from __future__ import annotations

import argparse
import csv
import json
import math
from dataclasses import dataclass
from datetime import date
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
DEFAULT_SECTOR_MAP = ROOT / "scripts" / "sector-map.csv"
DEFAULT_OUTPUT = ROOT / "public" / "data" / "market-bubbles.json"


@dataclass(frozen=True)
class SectorProfile:
    id: str
    name: str
    market: str
    sector: str
    base_market_cap: int
    base_trading_value: int


def clamp(value: float, minimum: float, maximum: float) -> float:
    return min(maximum, max(minimum, value))


def wave(index: int, phase: float, size: float) -> float:
    return math.sin(index / size + phase)


def month_label(start_year: int, month_index: int) -> str:
    year = start_year + month_index // 12
    month = month_index % 12 + 1
    return f"{year}-{month:02d}"


def read_sector_map(path: Path) -> list[SectorProfile]:
    with path.open("r", encoding="utf-8", newline="") as file:
        rows = csv.DictReader(file)
        return [
            SectorProfile(
                id=row["id"],
                name=row["name"],
                market=row["market"],
                sector=row["sector"],
                base_market_cap=int(row["base_market_cap"]),
                base_trading_value=int(row["base_trading_value"]),
            )
            for row in rows
        ]


def trend_for(sector_id: str, index: int) -> tuple[float, float]:
    year_progress = index / 12
    soft_noise = wave(index, len(sector_id) * 0.7, 2.4) * 7

    if sector_id == "semiconductor":
        lift = -14 if index < 25 else 5 if index < 36 else 32 if index < 55 else 24
        return (
            lift + soft_noise + wave(index, 0.4, 4.6) * 9,
            (-8 if index < 25 else 22 if index < 36 else 68)
            + wave(index, 0.9, 3.4) * 23,
        )
    if sector_id == "battery":
        lift = 38 if index < 34 else 4 if index < 47 else 13
        return (
            lift + soft_noise + wave(index, 1.8, 3.9) * 14,
            (86 if index < 34 else 18 if index < 47 else 34)
            + wave(index, 2.4, 2.8) * 31,
        )
    if sector_id == "shipbuilding":
        return (
            -8 + year_progress * 7.5 + soft_noise,
            4 + year_progress * 16 + wave(index, 1.1, 3.6) * 18,
        )
    if sector_id == "defense":
        return (
            -3 + year_progress * 6.7 + soft_noise,
            8 + year_progress * 14 + wave(index, 2.1, 3.2) * 22,
        )
    if sector_id == "bio":
        spike = 64 if index % 17 < 3 else 0
        return (
            wave(index, 0.2, 2.3) * 24 + soft_noise - 3,
            12 + spike + wave(index, 1.3, 1.9) * 35 + soft_noise,
        )
    if sector_id == "finance":
        return (4 + wave(index, 0.7, 5.8) * 8, 3 + wave(index, 1.9, 6.2) * 14)
    if sector_id == "internet-game":
        return (
            (20 if index < 16 else -24 if index < 38 else -6)
            + wave(index, 2.3, 3.2) * 13,
            (36 if index < 16 else -22 if index < 38 else 12)
            + wave(index, 0.6, 2.9) * 21,
        )
    if sector_id == "auto":
        return (
            (6 if index < 25 else 22 if index < 54 else 12)
            + wave(index, 1.2, 4.4) * 12,
            (8 if index < 25 else 42 if index < 54 else 24)
            + wave(index, 2.2, 4.2) * 18,
        )
    if sector_id == "consumer":
        return (6 + wave(index, 0.1, 5.6) * 9, 4 + wave(index, 1.5, 5.1) * 13)
    if sector_id == "utility":
        return (1 + wave(index, 2.8, 6.8) * 6, -2 + wave(index, 0.8, 5.9) * 9)

    return (0, 0)


def generate_sample_records(profiles: list[SectorProfile]) -> list[dict[str, object]]:
    records: list[dict[str, object]] = []
    month_count = 65

    for month_index in range(month_count):
        for sector_index, profile in enumerate(profiles):
            return_6m, trading_change_6m = trend_for(profile.id, month_index)
            cap_multiplier = (
                1
                + return_6m / 180
                + wave(month_index, sector_index + 0.4, 7.8) * 0.06
            )
            trading_multiplier = (
                1
                + trading_change_6m / 130
                + wave(month_index, sector_index + 1.2, 3.3) * 0.12
            )
            records.append(
                {
                    "date": month_label(2021, month_index),
                    "id": profile.id,
                    "name": profile.name,
                    "market": profile.market,
                    "sector": profile.sector,
                    "marketCap": round(
                        profile.base_market_cap * clamp(cap_multiplier, 0.55, 1.9)
                    ),
                    "tradingValue": round(
                        profile.base_trading_value
                        * clamp(trading_multiplier, 0.38, 2.8)
                    ),
                    "return6m": round(clamp(return_6m, -55, 78), 1),
                    "tradingValueChange6m": round(
                        clamp(trading_change_6m, -58, 155), 1
                    ),
                }
            )

    return records


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Experimental static JSON generator for the bubble map."
    )
    parser.add_argument(
        "--sample-only",
        action="store_true",
        help="Write synthetic sample records instead of collecting real market data.",
    )
    parser.add_argument("--sector-map", type=Path, default=DEFAULT_SECTOR_MAP)
    parser.add_argument("--output", type=Path, default=DEFAULT_OUTPUT)
    return parser.parse_args()


def main() -> None:
    args = parse_args()

    if not args.sample_only:
        raise SystemExit(
            "실험 단계입니다. 현재는 --sample-only 모드만 지원합니다."
        )

    profiles = read_sector_map(args.sector_map)
    records = generate_sample_records(profiles)
    args.output.parent.mkdir(parents=True, exist_ok=True)
    args.output.write_text(
        json.dumps(records, ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8",
    )
    print(f"{len(records)}개 레코드를 {args.output}에 저장했습니다.")


if __name__ == "__main__":
    main()
