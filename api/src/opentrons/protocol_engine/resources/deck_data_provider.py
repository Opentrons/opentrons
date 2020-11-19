"""Deck data resource provider."""
from dataclasses import dataclass
from typing import List
from typing_extensions import final

from opentrons_shared_data.deck import load as load_deck
from opentrons_shared_data.deck.dev_types import DeckDefinitionV2
from opentrons_shared_data.labware.dev_types import LabwareDefinition
from opentrons.types import DeckSlotName
from opentrons.protocols.api_support.constants import STANDARD_DECK, SHORT_TRASH_DECK

from ..types import DeckSlotLocation
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

    def __init__(self, labware_data: LabwareDataProvider) -> None:
        """Initialize a DeckDataProvider."""
        self._labware_data = labware_data

    # NOTE(mc, 2020-11-18): async to allow file reading and parsing to be
    # async on a worker thread in the future
    async def get_deck_definition(
        self,
        *,
        short_fixed_trash: bool = False,
    ) -> DeckDefinitionV2:
        """Get a labware definition given the labware's identification."""
        deck_load_name = SHORT_TRASH_DECK if short_fixed_trash else STANDARD_DECK
        return load_deck(deck_load_name, 2)

    async def get_deck_fixed_labware(
        self,
        deck_definition: DeckDefinitionV2
    ) -> List[DeckFixedLabware]:
        """Get a list of all labware fixtures from a given deck definition."""
        labware = []

        for fixture in deck_definition["locations"]["fixtures"]:
            labware_id = fixture["id"]
            load_name = fixture.get("labware")  # type: ignore[misc]
            slot = fixture.get("slot")  # type: ignore[misc]

            if load_name is not None and slot is not None:
                location = DeckSlotLocation(slot=DeckSlotName.from_string(slot))
                definition = await self._labware_data.get_labware_definition(
                    load_name=load_name,
                    namespace="opentrons",
                    version=1,
                )

                labware.append(
                    DeckFixedLabware(
                        labware_id=labware_id,
                        definition=definition,
                        location=location,
                    )
                )

        return labware
