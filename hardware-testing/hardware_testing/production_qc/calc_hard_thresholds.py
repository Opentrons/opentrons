from __future__ import annotations

import argparse
import csv
import re
import statistics
from pathlib import Path
from typing import Dict, List, Tuple


ROW_INDEX = {"A": 0, "B": 1, "C": 2, "D": 3, "E": 4, "F": 5, "G": 6, "H": 7}
FLOAT_RE = re.compile(r"[-+]?\d+(?:\.\d+)?")


def channel_name_from_index(idx_0_based: int) -> str:
    row = "ABCDEFGH"[idx_0_based // 12]
    col = (idx_0_based % 12) + 1
    return f"{row}{col}"


def parse_input_text(text: str) -> Dict[int, List[float]]:
    """Parse A~H row-formatted leak-rate text into 96 channel value lists."""
    values_by_channel: Dict[int, List[float]] = {i: [] for i in range(96)}

    for raw_line in text.splitlines():
        line = raw_line.strip()
        if not line:
            continue
        row_key = line[0].upper()
        if row_key not in ROW_INDEX:
            continue

        nums = [float(x) for x in FLOAT_RE.findall(line)]
        if len(nums) < 12:
            continue
        nums = nums[:12]

        row = ROW_INDEX[row_key]
        for col, v in enumerate(nums):
            ch_idx = row * 12 + col
            values_by_channel[ch_idx].append(v)

    return values_by_channel


def median_and_mad(vals: List[float]) -> Tuple[float, float]:
    med = statistics.median(vals)
    abs_dev = [abs(v - med) for v in vals]
    mad = statistics.median(abs_dev)
    return med, mad


def calc_thresholds(
    values_by_channel: Dict[int, List[float]], mad_k: float
) -> List[Dict[str, float]]:
    rows: List[Dict[str, float]] = []
    for ch_idx in range(96):
        vals = values_by_channel[ch_idx]
        if not vals:
            rows.append(
                {
                    "channel_index": ch_idx + 1,
                    "n": 0,
                    "median": float("nan"),
                    "mad": float("nan"),
                    "hard_threshold": float("nan"),
                    "hard_threshold_mad6": float("nan"),
                }
            )
            continue

        med, mad = median_and_mad(vals)
        hard = med + mad_k * mad
        hard_mad6 = med + 6.0 * mad
        rows.append(
            {
                "channel_index": ch_idx + 1,
                "n": len(vals),
                "median": med,
                "mad": mad,
                "hard_threshold": hard,
                "hard_threshold_mad6": hard_mad6,
            }
        )
    return rows


def write_csv(rows: List[Dict[str, float]], output: Path) -> None:
    with output.open("w", newline="", encoding="utf-8") as f:
        w = csv.writer(f)
        w.writerow(
            [
                "channel",
                "n",
                "median",
                "mad",
                "hard_threshold",
                "hard_threshold_mad6",
                "formula",
                "formula_mad6",
            ]
        )
        for r in rows:
            ch_name = channel_name_from_index(int(r["channel_index"]) - 1)
            if int(r["n"]) == 0:
                w.writerow(
                    [
                        ch_name,
                        0,
                        "",
                        "",
                        "",
                        "",
                        "median + 3*MAD",
                        "median + 6*MAD",
                    ]
                )
                continue
            w.writerow(
                [
                    ch_name,
                    int(r["n"]),
                    round(r["median"], 6),
                    round(r["mad"], 6),
                    round(r["hard_threshold"], 6),
                    round(r["hard_threshold_mad6"], 6),
                    "median + 3*MAD",
                    "median + 6*MAD",
                ]
            )


def main() -> None:
    parser = argparse.ArgumentParser(
        description="Calculate per-channel hard thresholds from 1ul leak-rate text."
    )
    parser.add_argument(
        "--input",
        required=True,
        help="Input txt/csv path containing A~H rows with 12 values each.",
    )
    parser.add_argument(
        "--output",
        default="hard_thresholds_96ch.csv",
        help="Output CSV file path.",
    )
    parser.add_argument(
        "--mad-k",
        type=float,
        default=3.0,
        help="Threshold = median + mad_k * MAD (default: 3.0).",
    )
    args = parser.parse_args()

    input_path = Path(args.input)
    output_path = Path(args.output)
    text = input_path.read_text(encoding="utf-8", errors="ignore")

    values_by_channel = parse_input_text(text)
    rows = calc_thresholds(values_by_channel, args.mad_k)
    write_csv(rows, output_path)

    print(f"Done. Output: {output_path}")
    print("Preview (first 12 channels):")
    for i in range(12):
        r = rows[i]
        ch = channel_name_from_index(i)
        if int(r["n"]) == 0:
            print(f"{ch}: n=0")
        else:
            print(
                f"{ch}: n={int(r['n'])}, median={r['median']:.4f}, "
                f"mad={r['mad']:.4f}, "
                f"hard_3mad={r['hard_threshold']:.4f}, "
                f"hard_6mad={r['hard_threshold_mad6']:.4f}"
            )


if __name__ == "__main__":
    main()
