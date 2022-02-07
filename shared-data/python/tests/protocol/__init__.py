from typing import List
from pathlib import Path


def list_fixtures(version: int) -> List[Path]:
    base = (
        Path(__file__).parent
        / ".."
        / ".."
        / ".."
        / "protocol"
        / "fixtures"
        / f"{version}"
    )
    return list(base.iterdir())
