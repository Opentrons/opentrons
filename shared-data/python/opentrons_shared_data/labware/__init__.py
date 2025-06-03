"""
opentrons_shared_data.labware: types and functions for accessing labware defs
"""

from __future__ import annotations
import json
from typing import Any, Dict, NewType, TYPE_CHECKING, overload, Literal

from .. import load_shared_data

if TYPE_CHECKING:
    from .types import LabwareDefinition, LabwareDefinition2, LabwareDefinition3

Schema = NewType("Schema", Dict[str, Any])


@overload
def load_definition(
    loadname: str, version: int, schema: Literal[2] = 2
) -> LabwareDefinition2:
    ...


@overload
def load_definition(
    loadname: str, version: int, schema: Literal[3]
) -> LabwareDefinition3:
    ...


def load_definition(loadname: str, version: int, schema: int = 2) -> LabwareDefinition:
    return json.loads(
        load_shared_data(f"labware/definitions/{schema}/{loadname}/{version}.json")
    )


def load_schema() -> Schema:
    return json.loads(load_shared_data("labware/schemas/2.json"))
