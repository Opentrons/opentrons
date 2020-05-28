import typing

from opentrons.types import Point, Mount
from enum import Enum, auto
from uuid import uuid4, UUID
from dataclasses import dataclass
from opentrons.hardware_control.types import CriticalPoint

if typing.TYPE_CHECKING:
    from opentrons.protocol_api.labware import LabwareDefinition


@dataclass
class LabwareInfo:
    """
    This class purely maps to :py:class:`.models.LabwareStatus` and is
    intended to inform a client about the tipracks required for a session.

    :note: The UUID class is utilized here instead of UUID4 for type checking
    as UUID4 is only valid in pydantic models.
    """
    alternatives: typing.List[str]
    forMounts: typing.List[Mount]
    loadName: str
    slot: str
    namespace: str
    version: str
    id: UUID
    definition: 'LabwareDefinition'


@dataclass
class CheckMove:
    position: Point = Point(0, 0, 0)
    locationId: UUID = uuid4()


@dataclass
class Moves:
    """A mapping of calibration check state to gantry move parameters"""
    preparingFirstPipette: CheckMove = CheckMove()
    preparingSecondPipette: CheckMove = CheckMove()
    joggingFirstPipetteToHeight: CheckMove = CheckMove()
    joggingFirstPipetteToPointOne: CheckMove = CheckMove()
    joggingFirstPipetteToPointTwo: CheckMove = CheckMove()
    joggingFirstPipetteToPointThree: CheckMove = CheckMove()
    joggingSecondPipetteToHeight: CheckMove = CheckMove()
    joggingSecondPipetteToPointOne: CheckMove = CheckMove()


class DeckCalibrationError(Enum):
    UNKNOWN = auto()
    BAD_INSTRUMENT_OFFSET = auto()
    BAD_DECK_TRANSFORM = auto()

    def __str__(self):
        return self.name


class PipetteRank(str, Enum):
    """The rank in the order of pipettes to use within flow"""
    first = 1
    second = 2

    def __str__(self):
        return self.name

    def __ge__(self, other):
        if self.__class__ is other.__class__:
            return self.value >= other.value
        return NotImplemented

    def __gt__(self, other):
        if self.__class__ is other.__class__:
            return self.value > other.value
        return NotImplemented

    def __le__(self, other):
        if self.__class__ is other.__class__:
            return self.value <= other.value
        return NotImplemented

    def __lt__(self, other):
        if self.__class__ is other.__class__:
            return self.value < other.value
        return NotImplemented


@dataclass
class PipetteInfo:
    rank: PipetteRank
    mount: Mount
    tiprack_id: typing.Optional[UUID]
    critical_point: typing.Optional[CriticalPoint]


@dataclass
class PipetteStatus:
    model: str
    name: str
    tip_length: float
    mount: str
    has_tip: bool
    rank: str
    tiprack_id: typing.Optional[UUID]
