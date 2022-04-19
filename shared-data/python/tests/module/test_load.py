import json
import pytest
from typing import List

from opentrons_shared_data.module import (
    load_definition,
    load_schema,
    ModuleNotFoundError,
)
from opentrons_shared_data import load_shared_data

from . import list_v2_defs, list_v3_defs


@pytest.mark.parametrize("def_name", list_v3_defs())
def test_load_v3_defs(def_name: str) -> None:
    """Test that all v3 definitions load correctly."""
    assert load_definition("3", def_name) == json.loads(
        load_shared_data(f"module/definitions/3/{def_name}.json")
    )


@pytest.mark.parametrize("defname", list_v2_defs())
def test_load_v2_defs(defname):
    assert load_definition("2", defname) == json.loads(
        load_shared_data(f"module/definitions/2/{defname}.json")
    )


@pytest.mark.parametrize("defname", ["magdeck", "tempdeck", "thermocycler"])
def test_load_v1_defs(defname):
    assert (
        load_definition("1", defname)
        == json.loads(load_shared_data("module/definitions/1.json"))[defname]
    )


def test_bad_module_name_throws():
    with pytest.raises(ModuleNotFoundError):
        load_definition("1", "alsjdag")

    with pytest.raises(ModuleNotFoundError):
        load_definition("2", "asdasda")  # type: ignore[call-overload]


@pytest.mark.parametrize("schemaname", ["1", "2"])
def test_load_schema(schemaname):
    assert load_schema(schemaname) == json.loads(
        load_shared_data(f"module/schemas/{schemaname}.json")
    )
