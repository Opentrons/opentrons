import typing

from dataclasses import dataclass
from datetime import datetime
from os import PathLike


CalibrationID = typing.NewType('CalibrationID', str)
StrPath = typing.Union[str, PathLike]


class TipLengthCalNotFound(Exception):
    pass


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
class CalibrationTypes:
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
    calibration: CalibrationTypes
    parent: ParentOptions
    labware_id: str
    uri: str
