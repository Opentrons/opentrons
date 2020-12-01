"""Resource providers."""
from __future__ import annotations

from .id_generator import IdGenerator
from .deck_data_provider import DeckDataProvider
from .labware_data_provider import LabwareDataProvider


class ResourceProviders:
    """
    ResourceProviders container class.

    Wraps various data providers that define procedures to pull and generate
    data for engine setup and command execution.
    """

    _id_generator: IdGenerator
    _labware_data: LabwareDataProvider
    _deck_data: DeckDataProvider

    @classmethod
    def create(cls) -> ResourceProviders:
        """Create a ResourceProviders container and its children."""
        id_generator = IdGenerator()
        labware_data = LabwareDataProvider()
        deck_data = DeckDataProvider(labware_data=labware_data)

        return cls(
            id_generator=id_generator,
            labware_data=labware_data,
            deck_data=deck_data,
        )

    def __init__(
        self,
        id_generator: IdGenerator,
        labware_data: LabwareDataProvider,
        deck_data: DeckDataProvider,
    ) -> None:
        """Initialize a ResourceProviders container."""
        self._id_generator = id_generator
        self._labware_data = labware_data
        self._deck_data = deck_data

    @property
    def id_generator(self) -> IdGenerator:
        """Get the unique ID generator resource."""
        return self._id_generator

    @property
    def labware_data(self) -> LabwareDataProvider:
        """Get the labware data provider resource."""
        return self._labware_data

    @property
    def deck_data(self) -> DeckDataProvider:
        """Get the deck data provider resource."""
        return self._deck_data
