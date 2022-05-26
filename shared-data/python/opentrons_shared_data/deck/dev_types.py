"""
opentrons_shared_data.deck.dev_types: types for deck defs

This should only be imported if typing.TYPE_CHECKING is True
"""

from typing import Any, Dict, List, NewType, Union
from typing_extensions import Literal, TypedDict

from ..module.dev_types import ModuleType


DeckSchemaVersion3 = Literal[3]
DeckSchemaVersion2 = Literal[2]
DeckSchemaVersion1 = Literal[1]

DeckSchema = NewType("DeckSchema", Dict[str, Any])


RobotModel = Union[Literal["OT-2 Standard"], Literal["OT-3 Standard"]]


class Metadata(TypedDict, total=False):
    displayName: str
    tags: List[str]


class Robot(TypedDict):
    model: RobotModel


class BoundingBox(TypedDict):
    xDimension: float
    yDimension: float
    zDimension: float


class SlotDefV3(TypedDict, total=False):
    id: str
    position: List[float]
    boundingBox: BoundingBox
    displayName: str
    compatibleModuleTypes: List[ModuleType]
    matingSurfaceUnitVector: List[Union[Literal[1], Literal[-1]]]


class CalibrationPoint(TypedDict):
    id: str
    position: List[float]
    displayName: str


class Feature(TypedDict):
    footprint: str


class FixedLabwareBySlot(TypedDict):
    id: str
    displayName: str
    labware: str
    slot: str


class FixedLabwareByPosition(TypedDict):
    id: str
    displayName: str
    labware: str
    position: List[float]


class FixedVolumeBySlot(TypedDict):
    id: str
    displayName: str
    boundingBox: BoundingBox
    slot: str


class FixedVolumeByPosition(TypedDict):
    id: str
    displayName: str
    boundingBox: BoundingBox
    position: List[float]


Fixture = Union[
    FixedLabwareBySlot, FixedLabwareByPosition, FixedVolumeBySlot, FixedVolumeByPosition
]


class LocationsV3(TypedDict):
    orderedSlots: List[SlotDefV3]
    calibrationPoints: List[CalibrationPoint]
    fixtures: List[Fixture]


class DeckDefinitionV3(TypedDict):
    otId: str
    schemaVersion: Literal[3]
    cornerOffsetFromOrigin: List[float]
    dimensions: List[float]
    metadata: Metadata
    robot: Robot
    locations: LocationsV3
    layers: Dict[str, List[Feature]]


DeckDefinition = DeckDefinitionV3
