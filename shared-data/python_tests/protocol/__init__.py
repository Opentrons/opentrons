from pathlib import Path
from typing import List


def list_fixtures(version: int) -> List[Path]:
    base = Path(__file__).parent / ".." / ".." / "protocol" / "fixtures" / f"{version}"
    return list(base.iterdir())
