"""
opentrons_shared_data.deck: types and bindings for deck definitions
"""
from enum import Enum
from typing import overload, TYPE_CHECKING
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


class DefinitionName(Enum):
    OT2_STANDARD = "ot2_standard"
    OT2_SHORT_TRASH = "ot2_short_trash"
    OT3_STANDARD = "ot3_standard"


@overload
def load(name: DefinitionName, version: "DeckSchemaVersion3") -> "DeckDefinitionV3":
    ...


@overload
def load(name: DefinitionName, version: int) -> "DeckDefinition":
    ...


def load(name, version=DEFAULT_DECK_DEFINITION_VERSION):
    file_name = f"{name.value}.json"
    file_path = f"deck/definitions/{version}/{file_name}"
    return json.loads(load_shared_data(file_path))


def load_schema(version: int) -> "DeckSchema":
    return json.loads(load_shared_data(f"deck/schemas/{version}.json"))
