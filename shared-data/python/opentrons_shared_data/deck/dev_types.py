"""
opentrons_shared_data.deck.dev_types: types for deck defs

This should only be imported if typing.TYPE_CHECKING is True
"""

from typing import Any, Dict, List, NewType, Union
from typing_extensions import Literal, TypedDict

from ..module.dev_types import ModuleType


DeckSchemaVersion2 = Literal[2]
DeckSchemaVersion1 = Literal[1]

DeckSchema = NewType('DeckSchema', Dict[str, Any])


class Metadata(TypedDict, total=False):
    displayName: str
    tags: List[str]


class Robot(TypedDict):
    model: Literal['OT-2 Standard']


class BoundingBox(TypedDict):
    xDimension: float
    yDimension: float
    zDimension: float


class SlotDefV1(TypedDict, total=False):
    id: str
    position: List[float]
    boundingBox: BoundingBox
    compatibleModules: List[Union[
        Literal['magdeck'], Literal['tempdeck'], Literal['thermocycler']]]
    matingSurfaceUnitVector: List[Union[Literal[1], Literal[-1]]]
    displayName: str


class SlotDefV2(TypedDict, total=False):
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


Fixture = Union[FixedLabwareBySlot, FixedLabwareByPosition,
                FixedVolumeBySlot, FixedVolumeByPosition]


class LocationsV1(TypedDict):
    orderedSlots: List[SlotDefV1]
    calibrationPoints: List[CalibrationPoint]
    fixtures: List[Fixture]


class LocationsV2(TypedDict):
    orderedSlots: List[SlotDefV2]
    calibrationPoints: List[CalibrationPoint]
    fixtures: List[Fixture]


class FeatureV1(TypedDict):
    footprint: str


class FeatureV2(TypedDict, total=False):
    footprint: str
    correspondingLocation: str


class DeckDefinitionV1(TypedDict, total=False):
    otId: str
    schemaVersion: Literal[1]
    cornerOffsetFromOrigin: List[float]
    dimensions: List[float]
    metadata: Metadata
    robot: Robot
    locations: LocationsV1
    layers: Dict[str, List[FeatureV1]]


class DeckDefinitionV2(TypedDict):
    otId: str
    schemaVersion: Literal[2]
    cornerOffsetFromOrigin: List[float]
    dimensions: List[float]
    metadata: Metadata
    robot: Robot
    locations: LocationsV2
    layers: Dict[str, List[FeatureV1]]


DeckDefinition = Union[DeckDefinitionV1, DeckDefinitionV2]
