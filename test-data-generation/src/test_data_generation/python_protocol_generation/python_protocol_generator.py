"""Module for generating Python protocol code from a deck configuration."""

import ast
import astor  # type: ignore
import typing
from .ast_helpers import CanGenerateAST
from test_data_generation.deck_configuration.datashapes import (
    DeckConfiguration,
    PossibleSlotContents as PSC,
)

from .generation_phases.setup_phase import (
    create_protocol_context_run_function,
    import_protocol_context,
    create_requirements_dict,
)
from .generation_phases.load_phase import (
    create_deck_slot_load_statements,
    create_pipette_load_statements,
)
from .generation_phases.call_phase import create_calls_to_loaded_entities
from .util import PipetteConfiguration, PipetteNames


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

        self._pipettes = self._choose_pipettes()

    def _choose_pipettes(self) -> PipetteConfiguration:
        """Choose the pipettes to use based on the deck configuration."""
        if self._deck_configuration.d.col3.contents.is_one_of(
            [PSC.WASTE_CHUTE_NO_COVER, PSC.STAGING_AREA_WITH_WASTE_CHUTE_NO_COVER]
        ):
            return PipetteConfiguration(
                left=PipetteNames.NINETY_SIX_CHANNEL, right=None
            )
        else:
            return PipetteConfiguration(
                left=PipetteNames.SINGLE_CHANNEL, right=PipetteNames.MULTI_CHANNEL
            )

    def generate_protocol(self) -> str:
        """Generate the Python protocol code."""
        module = ast.Module(
            body=[statement.generate_ast() for statement in self._top_level_statements]
        )
        run_function = create_protocol_context_run_function().generate_ast()
        pipette_load_statements = create_pipette_load_statements(self._pipettes)
        deck_slot_load_statements = create_deck_slot_load_statements(
            self._deck_configuration.slots
        )

        calls_to_loaded_entities = create_calls_to_loaded_entities(
            pipette_load_statements + deck_slot_load_statements
        )

        statements_to_make = (
            pipette_load_statements
            + deck_slot_load_statements
            + calls_to_loaded_entities
        )

        for statement in statements_to_make:
            run_function.body.append(statement.generate_ast())
        module.body.append(run_function)

        return str(astor.to_source(module))
