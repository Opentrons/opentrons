from pathlib import Path
from typing import List


def list_v2_defs() -> List[str]:
    return [
        deffile.stem
        for deffile in (
            Path(__file__).parent / ".." / ".." / "module" / "definitions" / "2"
        ).iterdir()
    ]


def list_v3_defs() -> List[str]:
    return [
        deffile.stem
        for deffile in (
            Path(__file__).parent / ".." / ".." / "module" / "definitions" / "3"
        ).iterdir()
    ]
