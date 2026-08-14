"""Search the labware library for the tallest labware"""

import json
from pathlib import Path

# Path is relative to the repo root; adjust if running from a different cwd.
path = Path(__file__).parents[3] / "shared-data" / "labware" / "definitions" / "2"


def get_z_heights(labware_root: Path) -> list[tuple[float, str, str]]:
    """Walk every labware folder under labware_root, pick the latest version
    JSON in each, and return (z_height, display_name, labware_load_name)
    sorted tallest-first."""
    results = []
    for labware_dir in sorted(labware_root.iterdir()):
        if not labware_dir.is_dir():
            continue
        version_files = sorted(
            labware_dir.glob("*.json"),
            key=lambda f: int(f.stem) if f.stem.isdigit() else 0,
        )
        if not version_files:
            continue
        latest = version_files[-1]
        try:
            data = json.loads(latest.read_text(encoding="utf-8"))
            z = data["dimensions"]["zDimension"]
            name = data["metadata"]["displayName"]
            category = data["metadata"]["displayCategory"]
            if category in ("adapter", "aluminumBlock", "tubeRack", "tipRack", "lid", "trash", "other"):
                continue
            load_name = labware_dir.name
            results.append((z, category, name, load_name))
        except (KeyError, json.JSONDecodeError):
            continue
    results.sort(key=lambda r: r[0], reverse=True)
    return results


def main() -> None:
    heights = get_z_heights(path)
    print(f"{'Z (mm)':>8}  {'Category':<20}  {'Load Name':<55}  Display Name")
    print("-" * 130)
    for z, category, display_name, load_name in heights:
        print(f"{z:>8.2f}  {category:<20}  {load_name:<55}  {display_name}")


if __name__ == "__main__":
    main()

