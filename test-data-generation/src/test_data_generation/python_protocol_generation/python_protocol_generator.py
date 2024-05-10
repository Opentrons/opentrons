"""Module for generating Python protocol code from a deck configuration."""

import ast
import typing

import astor  # type: ignore

from test_data_generation.datashapes import (
    PipetteConfiguration,
)
from test_data_generation.datashapes import (
    DeckConfigurationFixtures as DCF,
)

from ..constants import PipetteNames
from . import ast_helpers as ast_h
from .generation_phases import setup_phase, load_phase, call_phase

from .protocol_configuration import ProtocolConfiguration


class PythonProtocolGenerator:
    """Class for generating Python protocol code from a deck configuration."""

    def __init__(self, protocol_configuration: ProtocolConfiguration) -> None:
        """Initialize the PythonProtocolGenerator.

        Call boilerplate functions to set up the protocol.
        """
        self._top_level_statements: typing.List[ast_h.CanGenerateAST] = []
        self._protocol_configuration = protocol_configuration
        self._top_level_statements.extend(
            [
                setup_phase.import_protocol_context(),
                setup_phase.create_requirements_dict(
                    "OT-3", self._protocol_configuration.api_version
                ),
            ]
        )

        self._pipettes = self._choose_pipettes()

    def _choose_pipettes(self) -> PipetteConfiguration:
        """Choose the pipettes to use based on the deck configuration."""
        if self._protocol_configuration.deck_configuration.d.col3.contents.is_one_of(
            [DCF.WASTE_CHUTE_NO_COVER, DCF.STAGING_AREA_WITH_WASTE_CHUTE_NO_COVER]
        ):
            return PipetteConfiguration(
                left=PipetteNames.NINETY_SIX_CHANNEL, right=None
            )
        else:
            return PipetteConfiguration(
                left=PipetteNames.SINGLE_CHANNEL, right=PipetteNames.MULTI_CHANNEL
            )

    def _generate_run_function_statements(
        self,
    ) -> typing.Sequence[ast.stmt]:
        pipette_load_statements = load_phase.create_pipette_load_statements(
            self._pipettes
        )
        deck_slot_load_statements = load_phase.create_deck_slot_load_statements(
            self._protocol_configuration.deck_configuration.slots,
            self._protocol_configuration.explicit_loads,
            self._protocol_configuration.allow_overlapping_loads,
        )
        calls_to_loaded_entities = call_phase.create_calls_to_loaded_entities(
            pipette_load_statements + deck_slot_load_statements
        )

        return [
            statement.generate_ast()
            for statement in pipette_load_statements
            + deck_slot_load_statements
            + calls_to_loaded_entities
        ]

    def generate_protocol(self) -> str:
        """Generate the Python protocol code."""
        module = ast.Module(
            body=[statement.generate_ast() for statement in self._top_level_statements]
        )
        run_function = setup_phase.create_protocol_context_run_function().generate_ast()

        run_function.body.extend(self._generate_run_function_statements())

        module.body.append(run_function)

        if self._protocol_configuration.add_deck_configuration_comment:
            deck_config_comment = (
                self._protocol_configuration.deck_configuration.comment_string()
            )
        else:
            deck_config_comment = ""
        return deck_config_comment + str(astor.to_source(module))
