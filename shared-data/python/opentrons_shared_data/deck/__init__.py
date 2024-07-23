"""
opentrons_shared_data.deck: types and bindings for deck definitions
"""

from typing import Any, Dict, List, NamedTuple, NewType, cast, overload, Union
from typing_extensions import Final, Literal, TypedDict

from ..module import ModuleType

import json

from .. import get_shared_data_root, load_shared_data

DEFAULT_DECK_DEFINITION_VERSION: Final = 5


class Offset(NamedTuple):
    x: float = 0.0
    y: float = 0.0
    z: float = 0.0


Z_PREP_OFFSET = Offset(x=13, y=13)
CALIBRATION_PROBE_RADIUS: Final[float] = 2
CALIBRATION_SQUARE_DEPTH: Final[float] = -0.25
CALIBRATION_SQUARE_SIZE: Final[float] = 20
CALIBRATION_SQUARE_EDGES: Dict[str, Offset] = {
    "left": Offset(x=-CALIBRATION_SQUARE_SIZE * 0.5),
    "right": Offset(x=CALIBRATION_SQUARE_SIZE * 0.5),
    "top": Offset(y=CALIBRATION_SQUARE_SIZE * 0.5),
    "bottom": Offset(y=-CALIBRATION_SQUARE_SIZE * 0.5),
}


@overload
def load(name: str, version: "DeckSchemaVersion5") -> "DeckDefinitionV5":
    ...


@overload
def load(name: str, version: "DeckSchemaVersion4") -> "DeckDefinitionV4":
    ...


@overload
def load(name: str, version: "DeckSchemaVersion3") -> "DeckDefinitionV3":
    ...


def load(name: str, version: int = DEFAULT_DECK_DEFINITION_VERSION) -> "DeckDefinition":
    return json.loads(  # type: ignore[no-any-return]
        load_shared_data(f"deck/definitions/{version}/{name}.json")
    )


def load_schema(version: int) -> "DeckSchema":
    return cast(
        "DeckSchema", json.loads(load_shared_data(f"deck/schemas/{version}.json"))
    )


def list_names(version: int) -> List[str]:
    """Return all loadable deck definition names, for the given schema version."""
    definitions_directory = (
        get_shared_data_root() / "deck" / "definitions" / f"{version}"
    )
    return [file.stem for file in definitions_directory.iterdir()]


def get_calibration_square_position_in_slot(slot: int) -> Offset:
    """Get the position of an OT-3 deck slot's calibration square.

    Params:
        slot: The slot whose calibration square to retrieve, specified as an OT-2-style slot number.
            For example, specify 5 to get slot C2.
    """
    deck = load("ot3_standard", version=3)
    slots = deck["locations"]["orderedSlots"]

    # Assume that the OT-3 deck definition has the same number of slots, and in the same order,
    # as the OT-2.
    # TODO(mm, 2023-05-22): This assumption will break down when the OT-3 has staging area slots.
    # https://opentrons.atlassian.net/browse/RLAB-345
    s = slots[slot - 1]

    bottom_left = s["position"]
    slot_size_x = s["boundingBox"]["xDimension"]
    slot_size_y = s["boundingBox"]["yDimension"]
    relative_center = [float(slot_size_x) * 0.5, float(slot_size_y) * 0.5, 0]
    square_z = [0, 0, CALIBRATION_SQUARE_DEPTH]
    # add up the elements of each list and return an Offset of the result
    nominal_position = [
        float(sum(x)) for x in zip(bottom_left, relative_center, square_z)
    ]
    return Offset(*nominal_position)


DeckSchemaVersion5 = Literal[5]
DeckSchemaVersion4 = Literal[4]
DeckSchemaVersion3 = Literal[3]
DeckSchemaVersion2 = Literal[2]
DeckSchemaVersion1 = Literal[1]

DeckSchema = NewType("DeckSchema", Dict[str, Any])

DeckSchemaId = Literal["opentronsDeckSchemaV3", "opentronsDeckSchemaV4"]
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


class INode(TypedDict):
    name: str
    type: str
    value: str
    attributes: Dict[str, str]
    # this should be a recursive call to INode but we need to upgrade mypy
    children: List[Dict[str, Any]]


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


class _RequiredAddressableArea(TypedDict):
    id: str
    areaType: str
    offsetFromCutoutFixture: List[float]
    boundingBox: BoundingBox
    displayName: str


class AddressableArea(_RequiredAddressableArea, total=False):
    compatibleModuleTypes: List[ModuleType]
    matingSurfaceUnitVector: List[Union[Literal[1], Literal[-1]]]
    ableToDropTips: bool
    ableToDropLabware: bool


class Cutout(TypedDict):
    id: str
    position: List[float]
    displayName: str


class CutoutFixture(TypedDict):
    id: str
    expectOpentronsModuleSerialNumber: bool
    mayMountTo: List[str]
    displayName: str
    providesAddressableAreas: Dict[str, List[str]]
    fixtureGroup: Dict[str, List[Dict[str, str]]]
    height: float


Fixture = Union[
    FixedLabwareBySlot, FixedLabwareByPosition, FixedVolumeBySlot, FixedVolumeByPosition
]


class LocationsV3(TypedDict):
    orderedSlots: List[SlotDefV3]
    calibrationPoints: List[CalibrationPoint]
    fixtures: List[Fixture]


class LocationsV4(TypedDict):
    addressableAreas: List[AddressableArea]
    calibrationPoints: List[CalibrationPoint]
    cutouts: List[Cutout]
    legacyFixtures: List[Fixture]


class NamedOffset(TypedDict):
    x: float
    y: float
    z: float


class GripperOffsets(TypedDict):
    pickUpOffset: NamedOffset
    dropOffset: NamedOffset


class _RequiredDeckDefinitionV3(TypedDict):
    otId: str
    schemaVersion: Literal[3]
    cornerOffsetFromOrigin: List[float]
    dimensions: List[float]
    metadata: Metadata
    robot: Robot
    locations: LocationsV3
    layers: List[INode]


class DeckDefinitionV3(_RequiredDeckDefinitionV3, total=False):
    gripperOffsets: Dict[str, GripperOffsets]


class _RequiredDeckDefinitionV4(TypedDict):
    otId: str
    schemaVersion: Literal[4]
    cornerOffsetFromOrigin: List[float]
    dimensions: List[float]
    metadata: Metadata
    robot: Robot
    locations: LocationsV4
    cutoutFixtures: List[CutoutFixture]


class DeckDefinitionV4(_RequiredDeckDefinitionV4, total=False):
    gripperOffsets: Dict[str, GripperOffsets]


class _RequiredDeckDefinitionV5(TypedDict):
    otId: str
    schemaVersion: Literal[5]
    cornerOffsetFromOrigin: List[float]
    dimensions: List[float]
    metadata: Metadata
    robot: Robot
    locations: LocationsV4
    cutoutFixtures: List[CutoutFixture]


class DeckDefinitionV5(_RequiredDeckDefinitionV5, total=False):
    gripperOffsets: Dict[str, GripperOffsets]


DeckDefinition = Union[DeckDefinitionV3, DeckDefinitionV4, DeckDefinitionV5]
