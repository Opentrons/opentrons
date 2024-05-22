"""This module contains functions that make calls against the various load statements in a protocol.

Example load statements: load_module, load_labware, load_waste_chute, load_pipette, etc.
Example calls: module.labware, waste_chute.top, etc.
This is required to ensure that the loaded entities are recognized by the analysis engine.
"""

import typing

from test_data_generation.python_protocol_generation import ast_helpers as ast_h


def create_call_to_attribute_on_loaded_entity(
    load_statement: ast_h.AssignStatement,
) -> ast_h.CallAttribute:
    """Create a call statement from a load statement."""
    assert isinstance(load_statement.value, ast_h.CallFunction)

    if load_statement.value.what_to_call in ["load_waste_chute", "load_trash_bin"]:
        what_to_call = "location"
    else:
        what_to_call = "api_version"

    return ast_h.CallAttribute(
        call_on=load_statement.var_name,
        what_to_call=what_to_call,
    )


def create_calls_to_loaded_entities(
    load_statements: typing.List[ast_h.AssignStatement],
) -> typing.List[ast_h.CallAttribute]:
    """Create calls to loaded entity from ."""
    return [
        create_call_to_attribute_on_loaded_entity(entity) for entity in load_statements
    ]
