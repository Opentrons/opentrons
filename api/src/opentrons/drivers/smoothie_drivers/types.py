from dataclasses import dataclass
from typing import Dict, cast

from opentrons.config.types import AxisDict

AxisSettingType = Dict[str, float]


@dataclass
class AxisCurrentSettings:
    now: AxisSettingType
    saved: AxisSettingType

    def __init__(self, val: AxisDict) -> None:
        self.now = cast(AxisSettingType, val.copy())
        self.saved = cast(AxisSettingType, val.copy())
