"""Deck data resource provider."""
from dataclasses import dataclass
from typing import List, Optional, cast
from typing_extensions import final

from opentrons_shared_data.deck import load as load_deck
from opentrons_shared_data.deck.dev_types import DeckDefinitionV3
from opentrons.protocols.models import LabwareDefinition
from opentrons.types import DeckSlotName
from opentrons.protocols.api_support.constants import deck_type

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

    def __init__(self, labware_data: Optional[LabwareDataProvider] = None) -> None:
        """Initialize a DeckDataProvider."""
        self._labware_data = labware_data or LabwareDataProvider()

    # NOTE(mc, 2020-11-18): async to allow file reading and parsing to be
    # async on a worker thread in the future
    @staticmethod
    async def get_deck_definition() -> DeckDefinitionV3:
        """Get a labware definition given the labware's identification."""
        return load_deck(deck_type(), 3)

    async def get_deck_fixed_labware(
        self,
        deck_definition: DeckDefinitionV3,
    ) -> List[DeckFixedLabware]:
        """Get a list of all labware fixtures from a given deck definition."""
        labware = []

        for fixture in deck_definition["locations"]["fixtures"]:
            labware_id = fixture["id"]
            load_name = cast(Optional[str], fixture.get("labware"))
            slot = cast(Optional[str], fixture.get("slot"))

            if load_name is not None and slot is not None:
                location = DeckSlotLocation(slotName=DeckSlotName.from_primitive(slot))
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
