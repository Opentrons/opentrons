from dataclasses import dataclass
from typing import List, Dict

from opentrons_shared_data.deck.dev_types import DeckDefinitionV4, AddressableArea

from .deck_data_provider import DeckDataProvider
from opentrons.types import DeckSlotName


@dataclass(frozen=True)
class DeckCutoutFixture:
    name: str
    slot_location: DeckSlotName


class DeckConfigurationProvider:
    """The tech for the deck (configuration). Write something better here."""

    _configuration: Dict[str, DeckCutoutFixture]  # maybe the key can be the DeckSlotEnum i dunno

    def __init__(
        self, deck_definition: DeckDefinitionV4, deck_configuration: List[DeckCutoutFixture]
    ) -> None:
        """Initialize a DeckDataProvider."""
        self._deck_definition = deck_definition
        self._configuration = {
            cutout_fixture.slot_location.id: cutout_fixture for cutout_fixture in deck_configuration
        }

    def get_addressable_areas_for_cutout_fixture(
        self,
        cutout_fixture_id: str,
        deck_slot_id: str
    ) -> List[str]:
        """Get the allowable addressable areas for a cutout fixture loaded on a specific slot."""
        for cutout_fixture in self._deck_definition["cutoutFixtures"]:
            if cutout_fixture_id == cutout_fixture["id"]:
                return cutout_fixture["providesAddressableAreas"].get(deck_slot_id, [])

        return []  # TODO need to decide whether an invalid combo should raise an errror or just return empty list


    def get_configured_addressable_areas(self) -> List[str]:
        configured_addressable_areas = []
        for slot_id, cutout_fixture in self._configuration.items():
            addressable_areas = self.get_addressable_areas_for_cutout_fixture(cutout_fixture.name, slot_id)
            configured_addressable_areas.extend(addressable_areas)
        return configured_addressable_areas


    def get_addressable_area_definition(self, addressable_area_name: str) -> AddressableArea:
        for addressable_area in self._deck_definition["locations"]["addressableAreas"]:
            if addressable_area_name == addressable_area["id"]:
                return addressable_area

        raise ValueError("TODO Put a real error here maybe")
