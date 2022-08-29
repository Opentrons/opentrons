import typing
from typing_extensions import TypedDict, Literal
from datetime import datetime

from opentrons_shared_data.pipette.dev_types import LabwareUri

from .types import AttitudeMatrix, PipetteOffset, GripperCalOffset, SourceType


class CalibrationStatusDict(TypedDict):
    markedBad: bool
    source: typing.Optional[str]
    markedAt: typing.Optional[datetime]


class TipLengthCalibration(TypedDict):
    tipLength: float
    lastModified: datetime
    source: SourceType
    status: CalibrationStatusDict
    uri: typing.Union[LabwareUri, Literal[""]]


class PipetteCalibrationData(TypedDict):
    offset: PipetteOffset
    tiprack: str
    uri: str
    last_modified: datetime
    source: SourceType
    status: CalibrationStatusDict


class GripperCalibrationData(TypedDict):
    offset: GripperCalOffset
    last_modified: datetime
    source: SourceType
    status: CalibrationStatusDict


class DeckCalibrationData(TypedDict):
    attitude: AttitudeMatrix
    last_modified: datetime
    source: SourceType
    pipette_calibrated_with: typing.Optional[str]
    tiprack: typing.Optional[str]
    status: CalibrationStatusDict


PipTipLengthCalibration = typing.Dict[str, TipLengthCalibration]
