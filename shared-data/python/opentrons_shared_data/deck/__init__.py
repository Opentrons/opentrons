"""
opentrons_shared_data.deck: types and bindings for deck definitions
"""
from typing import overload, TYPE_CHECKING
import enum
import json

from .. import load_shared_data

class RobotModel(enum.Enum):
    OT2_STANDARD: str = "OT-2 Standard"
    OT3_STANDARD: str = "OT-3 Standard"


if TYPE_CHECKING:
    from .dev_types import (DeckSchema, DeckDefinition,
                            DeckDefinitionV1, DeckDefinitionV2,
                            DeckSchemaVersion1, DeckSchemaVersion2)


@overload
def load(name: str, version: 'DeckSchemaVersion1') -> 'DeckDefinitionV1': ...


@overload
def load(name: str, version: 'DeckSchemaVersion2') -> 'DeckDefinitionV2': ...


@overload
def load(name: str, version: int) -> 'DeckDefinition': ...


def load(name, version=2):
    return json.loads(load_shared_data(
        f'deck/definitions/{version}/{name}.json'))


def load_schema(version: int) -> 'DeckSchema':
    return json.loads(load_shared_data(
        f'deck/schemas/{version}.json'))
