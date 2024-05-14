"""This module provides function to generate the initial setup of an Opentrons protocol."""

import ast
import typing

from test_data_generation.constants import (
    PROTOCOL_CONTEXT_VAR_NAME,
)
from test_data_generation.python_protocol_generation import ast_helpers as ast_h


def create_requirements_dict(
    robot_type: typing.Literal["OT-2", "OT-3"], api_version: str
) -> ast_h.AssignStatement:
    """Create an assignment statement for the requirements dictionary."""
    return ast_h.AssignStatement(
        var_name="requirements",
        value=ast.Expression(
            body=ast.Dict(
                keys=[ast.Constant("robotType"), ast.Constant("apiLevel")],
                values=[ast.Constant(robot_type), ast.Constant(api_version)],
            ),
        ),
    )


def import_protocol_context() -> ast_h.ImportStatement:
    """Create an import statement for the ProtocolContext class."""
    return ast_h.ImportStatement(
        module="opentrons.protocol_api", names=["ProtocolContext"]
    )


def create_protocol_context_run_function() -> ast_h.FunctionDefinition:
    """Create a function definition for the run function of a protocol."""
    return ast_h.FunctionDefinition(
        name="run",
        args=[PROTOCOL_CONTEXT_VAR_NAME],
    )
