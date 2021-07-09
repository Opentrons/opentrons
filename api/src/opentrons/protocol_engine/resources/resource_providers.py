"""Resource providers."""
from __future__ import annotations

from .model_utils import ModelUtils
from .deck_data_provider import DeckDataProvider
from .labware_data_provider import LabwareDataProvider


class ResourceProviders:
    """ResourceProviders container class.

    Wraps various data providers that define procedures to pull and generate
    data for engine setup and command execution.
    """

    _model_utils: ModelUtils
    _labware_data: LabwareDataProvider
    _deck_data: DeckDataProvider

    def __init__(self) -> None:
        """Initialize a ResourceProviders container."""
        self._model_utils = ModelUtils()
        self._labware_data = LabwareDataProvider()
        self._deck_data = DeckDataProvider(labware_data=self._labware_data)

    @property
    def model_utils(self) -> ModelUtils:
        """Get an interface to ID and timestamp generation utilities."""
        return self._model_utils

    @property
    def labware_data(self) -> LabwareDataProvider:
        """Get the labware data provider resource."""
        return self._labware_data

    @property
    def deck_data(self) -> DeckDataProvider:
        """Get the deck data provider resource."""
        return self._deck_data
