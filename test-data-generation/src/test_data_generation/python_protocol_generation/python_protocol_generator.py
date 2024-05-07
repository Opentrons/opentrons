"""Module for generating Python protocol code from a deck configuration."""

import ast
import astor  # type: ignore
import typing
from .ast_helpers import CanGenerateAST
from test_data_generation.deck_configuration.datashapes import DeckConfiguration
from .generation_phases.load_phase import create_load_statements
from .generation_phases.setup_phase import (
    create_protocol_context_run_function,
    import_protocol_context,
    create_requirements_dict,
)


class PythonProtocolGenerator:
    """Class for generating Python protocol code from a deck configuration."""

    def __init__(
        self,
        deck_configuration: DeckConfiguration,
        api_version: str,
    ) -> None:
        """Initialize the PythonProtocolGenerator.

        Call boilerplate functions to set up the protocol.
        """
        self._top_level_statements: typing.List[CanGenerateAST] = []
        self._deck_configuration = deck_configuration

        self._top_level_statements.extend(
            [
                import_protocol_context(),
                create_requirements_dict("OT-3", api_version),
            ]
        )

    def generate_protocol(self) -> str:
        """Generate the Python protocol code."""
        module = ast.Module(
            body=[statement.generate_ast() for statement in self._top_level_statements]
        )
        run_function = create_protocol_context_run_function().generate_ast()
        load_entries = create_load_statements(self._deck_configuration.slots)
        for entry in load_entries:
            run_function.body.append(entry.generate_ast())
        module.body.append(run_function)

        return str(astor.to_source(module))
