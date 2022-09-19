import typing

from dataclasses import dataclass
from datetime import datetime
from enum import Enum
from os import PathLike

from typing_extensions import Literal
from opentrons_shared_data.pipette.dev_types import LabwareUri

StrPath = typing.Union[str, PathLike]
AttitudeMatrix = typing.List[typing.List[float]]
InstrumentCalOffset = typing.List[float]


class SourceType(str, Enum):
    """Calibration source type"""

    default = "default"
    factory = "factory"
    user = "user"
    calibration_check = "calibration_check"
    legacy = "legacy"
    unknown = "unknown"


class TipLengthCalNotFound(Exception):
    pass


@dataclass
class CalibrationStatus:
    markedBad: bool = False
    source: typing.Optional[SourceType] = None
    markedAt: typing.Optional[datetime] = None


@dataclass
class UriDetails:
    namespace: str
    load_name: str
    version: int
