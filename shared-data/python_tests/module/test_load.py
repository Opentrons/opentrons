import json
import pytest

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


@pytest.mark.parametrize("def_name", list_v2_defs())
def test_load_v2_defs(def_name: str) -> None:
    assert load_definition("2", def_name) == json.loads(  # type: ignore [call-overload]
        load_shared_data(f"module/definitions/2/{def_name}.json")
    )


@pytest.mark.parametrize("def_name", ["magdeck", "tempdeck", "thermocycler"])
def test_load_v1_defs(def_name: str) -> None:
    assert (
        load_definition("1", def_name)
        == json.loads(load_shared_data("module/definitions/1.json"))[def_name]
    )


def test_bad_module_name_throws() -> None:
    with pytest.raises(ModuleNotFoundError):
        load_definition("1", "alsjdag")

    with pytest.raises(ModuleNotFoundError):
        load_definition("2", "asdasda")  # type: ignore[call-overload]


@pytest.mark.parametrize("schema_name", ["1", "2", "3"])
def test_load_schema(schema_name: str) -> None:
    assert load_schema(schema_name) == json.loads(  # type: ignore[arg-type]
        load_shared_data(f"module/schemas/{schema_name}.json")
    )
