from dataclasses import dataclass

from opentrons.config.types import AxisDict


@dataclass
class AxisCurrentSettings:
    now: AxisDict
    saved: AxisDict

    def __init__(self, val: AxisDict) -> None:
        self.now = val.copy()
        self.saved = val.copy()
