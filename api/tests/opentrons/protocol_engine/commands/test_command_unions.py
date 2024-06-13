"""Unit tests for the `command_unions` module."""

from opentrons.protocol_engine.commands import command_unions
from opentrons.protocol_engine.commands import (
    AspirateCreate,
    AspirateParams,
    CustomCreate,
    CustomParams,
)
from opentrons.util.get_union_elements import get_union_elements


def test_create_types_by_params_type() -> None:
    """CREATE_TYPES_BY_PARAMS_TYPE should map *Params classes to *Create classes.

    We won't test every possible pairing here--just enough to make sure it's basically
    working.
    """
    assert command_unions.CREATE_TYPES_BY_PARAMS_TYPE[AspirateParams] is AspirateCreate
    assert command_unions.CREATE_TYPES_BY_PARAMS_TYPE[CustomParams] is CustomCreate


def test_create_types_by_params_type_is_exhaustive() -> None:
    """CREATE_TYPES_BY_PARAMS_TYPE should have one entry per params type."""
    expected_params_types = frozenset(get_union_elements(command_unions.CommandParams))
    mapped_params_types = frozenset(command_unions.CREATE_TYPES_BY_PARAMS_TYPE.keys())
    assert mapped_params_types == expected_params_types
