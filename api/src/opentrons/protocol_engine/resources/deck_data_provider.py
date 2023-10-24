"""Deck data resource provider."""
from dataclasses import dataclass
from typing import List, Optional, cast
from typing_extensions import final

import anyio

from opentrons_shared_data.deck import (
    load as load_deck,
    DEFAULT_DECK_DEFINITION_VERSION,
)
from opentrons_shared_data.deck.dev_types import DeckDefinitionV4
from opentrons.protocols.models import LabwareDefinition
from opentrons.types import DeckSlotName

from ..types import DeckSlotLocation, DeckType
from .labware_data_provider import LabwareDataProvider


@final
@dataclass(frozen=True)
class DeckFixedLabware:
    """A labware fixture that is always present on a deck."""

    labware_id: str
    location: DeckSlotLocation
    definition: LabwareDefinition


class DeckDataProvider:
    """Provider class to wrap deck definition and data retrieval."""

    _labware_data: LabwareDataProvider

    def __init__(
        self, deck_type: DeckType, labware_data: Optional[LabwareDataProvider] = None
    ) -> None:
        """Initialize a DeckDataProvider."""
        self._deck_type = deck_type
        self._labware_data = labware_data or LabwareDataProvider()

    async def get_deck_definition(self) -> DeckDefinitionV4:
        """Get a labware definition given the labware's identification."""

        def sync() -> DeckDefinitionV4:
            return load_deck(name=self._deck_type.value, version=4)

        return await anyio.to_thread.run_sync(sync)
