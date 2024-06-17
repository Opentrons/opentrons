"""Deck data resource provider."""
from dataclasses import dataclass
from typing import List, Optional, cast, Union
from typing_extensions import final

import anyio

from opentrons_shared_data.deck import (
    load as load_deck,
    DEFAULT_DECK_DEFINITION_VERSION,
)
from opentrons_shared_data.deck.dev_types import DeckDefinitionV5
from opentrons.protocols.models import LabwareDefinition
from opentrons.types import DeckSlotName

from ..types import (
    DeckSlotLocation,
    DeckType,
    DeckConfigurationType,
    AddressableAreaLocation,
)
from .labware_data_provider import LabwareDataProvider
from . import deck_configuration_provider


@final
@dataclass(frozen=True)
class DeckFixedLabware:
    """A labware fixture that is always present on a deck."""

    labware_id: str
    location: Union[DeckSlotLocation, AddressableAreaLocation]
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

    async def get_deck_definition(self) -> DeckDefinitionV5:
        """Get a labware definition given the labware's identification."""

        def sync() -> DeckDefinitionV5:
            return load_deck(
                name=self._deck_type.value, version=DEFAULT_DECK_DEFINITION_VERSION
            )

        return await anyio.to_thread.run_sync(sync)

    async def get_deck_fixed_labware(
        self,
        deck_definition: DeckDefinitionV5,
    ) -> List[DeckFixedLabware]:
        """Get a list of all labware fixtures from a given deck definition."""
        labware: List[DeckFixedLabware] = []

        for fixture in deck_definition["locations"]["legacyFixtures"]:
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

    async def get_fixture_peripherals(
        self, deck_definition: DeckDefinitionV5, deck_config: DeckConfigurationType
    ) -> List[DeckFixedLabware]:
        """Get a list of all peripheral labware from a given deck configuration."""
        labware: List[DeckFixedLabware] = []
        for cutout_id, cutout_fixture_id, _ in deck_config:
            peripherals = deck_configuration_provider.get_peripherals_from_fixture(
                cutout_id, cutout_fixture_id, deck_definition
            )
            for p in peripherals:
                location = AddressableAreaLocation(addressableAreaName=p["location"])
                definition = await self._labware_data.get_labware_definition(
                    load_name=p["loadName"],
                    namespace="opentrons",
                    version=1,
                )
                labware.append(
                    DeckFixedLabware(
                        labware_id=p["id"],
                        definition=definition,
                        location=location,
                    )
                )
        return labware

    async def get_all_deck_labware(
        self,
        deck_definition: DeckDefinitionV5,
        deck_config: Optional[DeckConfigurationType],
        load_fixed_trash: bool,
    ) -> List[DeckFixedLabware]:
        """Get a list of all fixed and peripheral labware."""
        fixed_labware = (
            await self.get_deck_fixed_labware(deck_definition)
            if load_fixed_trash
            else []
        )
        peripheral_labware = (
            await self.get_fixture_peripherals(deck_definition, deck_config)
            if deck_config
            else []
        )
        return fixed_labware + peripheral_labware
