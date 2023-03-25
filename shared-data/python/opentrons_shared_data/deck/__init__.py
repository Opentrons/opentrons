"""
opentrons_shared_data.deck: types and bindings for deck definitions
"""
from typing import Dict, NamedTuple, overload, TYPE_CHECKING
from typing_extensions import Final
import json

from .. import load_shared_data

if TYPE_CHECKING:
    from .dev_types import (
        DeckSchema,
        DeckDefinition,
        DeckDefinitionV3,
        DeckSchemaVersion3,
    )

DEFAULT_DECK_DEFINITION_VERSION = 3


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
def load(name: str, version: "DeckSchemaVersion3") -> "DeckDefinitionV3":
    ...


@overload
def load(name: str, version: int) -> "DeckDefinition":
    ...


def load(name, version=DEFAULT_DECK_DEFINITION_VERSION):
    return json.loads(load_shared_data(f"deck/definitions/{version}/{name}.json"))


def load_schema(version: int) -> "DeckSchema":
    return json.loads(load_shared_data(f"deck/schemas/{version}.json"))


def get_calibration_square_position_in_slot(slot: int) -> Offset:
    """Get slot top-left position."""
    deck = load("ot3_standard", version=3)
    slots = deck["locations"]["orderedSlots"]
    s = slots[slot - 1]
    assert s["id"] == str(slot)
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
