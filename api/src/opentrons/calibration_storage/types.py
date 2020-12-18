import typing

from dataclasses import dataclass
from datetime import datetime
from enum import Enum
from os import PathLike

from typing_extensions import Literal
from opentrons_shared_data.pipette.dev_types import LabwareUri

CalibrationID = typing.NewType('CalibrationID', str)
StrPath = typing.Union[str, PathLike]
AttitudeMatrix = typing.List[typing.List[float]]
PipetteOffset = typing.List[float]


class SourceType(str, Enum):
    """Calibration source type"""
    default = "default"
    factory = "factory"
    user = "user"
    calibration_check = "calibration_check"
    legacy = 'legacy'
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
class OffsetData:
    """
    Class to categorize the shape of a
    given calibration data.
    """
    value: typing.List[float]
    last_modified: typing.Optional[datetime]


@dataclass
class TipLengthData:
    """
    Class to categorize the shape of a
    given calibration data.
    """
    value: typing.Optional[float] = None
    last_modified: typing.Optional[datetime] = None


@dataclass
class ParentOptions:
    """
    Class to store whether a labware calibration has
    a module, as well the original parent (slot).
    As of now, the slot is not saved in association
    with labware calibrations.

    The slot value will be the empty string.
    """
    slot: str
    module: str = ''


@dataclass
class LabwareCalibrationTypes:
    """
    Class to categorize what calibration
    data might be stored for a labware.
    """
    offset: OffsetData
    tip_length: TipLengthData


@dataclass
class CalibrationInformation:
    """
    Class to store important calibration
    info for labware.
    """
    calibration: LabwareCalibrationTypes
    parent: ParentOptions
    labware_id: str
    uri: str


@dataclass
class TipLengthCalibration:
    tip_length: float
    source: SourceType
    status: CalibrationStatus
    pipette: str
    tiprack: str
    last_modified: datetime
    uri: typing.Union[LabwareUri, Literal['']]


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
