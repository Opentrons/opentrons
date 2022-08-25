import typing

from dataclasses import dataclass
from datetime import datetime
from enum import Enum
from os import PathLike

from typing_extensions import Literal
from opentrons_shared_data.pipette.dev_types import LabwareUri

StrPath = typing.Union[str, PathLike]
AttitudeMatrix = typing.List[typing.List[float]]
PipetteOffset = typing.List[float]
GripperCalOffset = typing.List[float]


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


@dataclass
class TipLengthCalibration:
    tip_length: float
    source: SourceType
    status: CalibrationStatus
    pipette: str
    tiprack: str
    last_modified: datetime
    uri: typing.Union[LabwareUri, Literal[""]]


@dataclass
class DeckCalibration:
    attitude: AttitudeMatrix
    source: SourceType
    status: CalibrationStatus
    last_modified: typing.Optional[datetime] = None
    pipette_calibrated_with: typing.Optional[str] = None
    tiprack: typing.Optional[str] = None


@dataclass
class PipetteOffsetByPipetteMount:
    """
    Class to store pipette offset without pipette and mount info
    """

    offset: PipetteOffset
    source: SourceType
    status: CalibrationStatus
    tiprack: typing.Optional[str] = None
    uri: typing.Optional[str] = None
    last_modified: typing.Optional[datetime] = None


@dataclass
class PipetteOffsetCalibration:
    """
    Class to store pipette offset calibration with pipette and mount info
    """

    pipette: str
    mount: str
    offset: PipetteOffset
    tiprack: str
    uri: str
    last_modified: datetime
    source: SourceType
    status: CalibrationStatus


@dataclass
class GripperCalibrationOffset:
    """
    Class to store gripper offset calibration with gripper info
    """

    offset: GripperCalOffset
    source: SourceType
    status: CalibrationStatus
    last_modified: typing.Optional[datetime] = None
