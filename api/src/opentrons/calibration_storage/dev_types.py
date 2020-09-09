import typing
from typing_extensions import TypedDict
from datetime import datetime

from .types import AttitudeMatrix, PipetteOffset


class TipLengthCalibration(TypedDict):
    tipLength: float
    lastModified: datetime


class ModuleDict(TypedDict):
    parent: str
    fullParent: str


class CalibrationIndexDict(TypedDict):
    """
    The dict that is returned from
    the index.json file.
    """
    uri: str
    slot: str
    module: ModuleDict


class OffsetDict(TypedDict):
    offset: typing.List[float]
    lastModified: datetime


class TipLengthDict(TypedDict):
    length: float
    lastModified: datetime


class CalibrationDict(TypedDict):
    """
    The dict that is returned from a labware
    offset file.
    """
    default: OffsetDict
    tipLength: TipLengthDict


class PipetteCalibrationData(TypedDict):
    offset: PipetteOffset
    tiprack: str
    uri: str
    last_modified: datetime


class DeckCalibrationData(TypedDict):
    attitude: AttitudeMatrix
    last_modified: datetime
    pipette_calibrated_with: typing.Optional[str]
    tiprack: typing.Optional[str]


PipTipLengthCalibration = typing.Dict[str, TipLengthCalibration]
