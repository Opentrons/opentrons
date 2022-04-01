from typing import List, Tuple

from pathlib import Path


def get_ot_defs() -> List[Tuple[str, int]]:
    def_files = (
        Path(__file__).parent / ".." / ".." / ".." / "labware" / "definitions" / "2"
    ).glob("**/*.json")

    # example filename
    # shared-data/labware/definitions/2/opentrons_96_tiprack_300ul/1.json
    return [(f.parent.name, int(f.stem)) for f in def_files]
