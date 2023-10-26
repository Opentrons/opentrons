"""Deck configuration resource provider."""
from dataclasses import dataclass
from typing import List, Dict

from opentrons_shared_data.deck.dev_types import DeckDefinitionV4, AddressableArea

from opentrons.types import DeckSlotName

from ..errors import FixtureDoesNotExistError


@dataclass(frozen=True)
class DeckCutoutFixture:
    """Basic cutout fixture data class."""

    name: str
    slot_location: DeckSlotName


class DeckConfigurationProvider:
    """Provider class to ingest deck configuration data and retrieve relevant deck definition data."""

    # TODO maybe make the key a DeckSlot enum?
    _configuration: Dict[str, DeckCutoutFixture]

    def __init__(
        self,
        deck_definition: DeckDefinitionV4,
        deck_configuration: List[DeckCutoutFixture],
    ) -> None:
        """Initialize a DeckDataProvider."""
        self._deck_definition = deck_definition
        self._configuration = {
            cutout_fixture.slot_location.id: cutout_fixture
            for cutout_fixture in deck_configuration
        }

    def get_addressable_areas_for_cutout_fixture(
        self, cutout_fixture_id: str, deck_slot_id: str
    ) -> List[str]:
        """Get the allowable addressable areas for a cutout fixture loaded on a specific slot."""
        for cutout_fixture in self._deck_definition["cutoutFixtures"]:
            if cutout_fixture_id == cutout_fixture["id"]:
                return cutout_fixture["providesAddressableAreas"].get(deck_slot_id, [])

        # TODO need to decide whether an invalid combo should raise an error or just return empty list
        return []

    def get_configured_addressable_areas(self) -> List[str]:
        """Get a list of all addressable areas the robot is configured for."""
        configured_addressable_areas = []
        for slot_id, cutout_fixture in self._configuration.items():
            addressable_areas = self.get_addressable_areas_for_cutout_fixture(
                cutout_fixture.name, slot_id
            )
            configured_addressable_areas.extend(addressable_areas)
        return configured_addressable_areas

    def get_addressable_area_definition(
        self, addressable_area_name: str
    ) -> AddressableArea:
        """Get the addressable area definition from the relevant deck definition."""
        for addressable_area in self._deck_definition["locations"]["addressableAreas"]:
            if addressable_area_name == addressable_area["id"]:
                return addressable_area

        raise FixtureDoesNotExistError(
            f'Could not resolve "{addressable_area_name}" to a fixture.'
        )
