import typing

from dataclasses import dataclass
from datetime import datetime
from enum import Enum

AttitudeMatrix = typing.List[typing.List[float]]

TiprackHash = typing.NewType("TiprackHash", str)
PipetteId = typing.NewType("PipetteId", str)
GripperId = typing.NewType("GripperId", str)


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
