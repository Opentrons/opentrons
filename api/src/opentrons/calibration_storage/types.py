import typing

from dataclasses import dataclass
from datetime import datetime
from enum import Enum

AttitudeMatrix = typing.List[typing.List[float]]


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


# TODO(mm, 2023-11-20): Deduplicate this with similar types in robot_server
# and opentrons.protocol_engine.
@dataclass
class CutoutFixturePlacement:
    cutout_fixture_id: str
    cutout_id: str
    opentrons_module_serial_number: typing.Optional[str]
