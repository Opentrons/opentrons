"""This module defines all the parameters that are needed to generate a protocol."""
import dataclasses

from test_data_generation.python_protocol_generation import ast_helpers as ast_h
from test_data_generation.datashapes import DeckConfiguration


@dataclasses.dataclass
class ProtocolConfiguration:
    """Class to represent the parameters needed to generate a protocol."""

    api_version: str
    deck_configuration: DeckConfiguration
    explicit_loads: ast_h.ExplicitLoadStorage = dataclasses.field(default_factory=dict)
    allow_overlapping_loads: bool = False
    add_deck_configuration_comment: bool = False
