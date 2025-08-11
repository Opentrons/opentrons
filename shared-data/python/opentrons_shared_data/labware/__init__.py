"""
opentrons_shared_data.labware: types and functions for accessing labware defs
"""

from __future__ import annotations

from functools import lru_cache
import json
from itertools import chain
from typing import Any, Iterable, NewType, TYPE_CHECKING, overload, Literal

from opentrons_shared_data.load import get_shared_data_root

from .. import load_shared_data

if TYPE_CHECKING:
    from .types import LabwareDefinition, LabwareDefinition2, LabwareDefinition3

Schema = NewType("Schema", dict[str, Any])


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


@lru_cache(maxsize=1)
def list_definitions(schemas: Iterable[int] = [2, 3]) -> set[tuple[str, int, int]]:
    """Return (load_name, version, schema) for all labware definitions in shared-data."""

    def list_definitions_for_schema(schema: int) -> Iterable[tuple[str, int, int]]:
        root_for_schema = (
            get_shared_data_root() / "labware" / "definitions" / str(schema)
        )
        files = root_for_schema.glob("*/*.json")
        return ((file.parent.name, int(file.stem), schema) for file in files)

    return set(
        chain.from_iterable(list_definitions_for_schema(schema) for schema in schemas)
    )
