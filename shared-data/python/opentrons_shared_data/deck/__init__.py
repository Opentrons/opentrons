"""
opentrons_shared_data.deck: types and bindings for deck definitions
"""
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
