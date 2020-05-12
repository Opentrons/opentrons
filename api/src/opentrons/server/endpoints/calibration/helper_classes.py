import typing

from opentrons.types import Point
from enum import Enum, auto
from uuid import uuid4, UUID
from dataclasses import dataclass

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
    forPipettes: typing.List[UUID]
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
