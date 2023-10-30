"""Deck configuration resource provider."""
from dataclasses import dataclass
from typing import List, Set, Dict

from opentrons_shared_data.deck.dev_types import DeckDefinitionV4, AddressableArea


from ..errors import FixtureDoesNotExistError


@dataclass(frozen=True)
class DeckCutoutFixture:
    """Basic cutout fixture data class."""

    name: str
    # TODO(jbl 10-30-2023) this is in reference to the cutout ID that is supplied in mayMountTo in the definition.
    #   We might want to make this not a string.
    cutout_slot_location: str


class DeckConfigurationProvider:
    """Provider class to ingest deck configuration data and retrieve relevant deck definition data."""

    _configuration: Dict[str, DeckCutoutFixture]

    def __init__(
        self,
        deck_definition: DeckDefinitionV4,
        deck_configuration: List[DeckCutoutFixture],
    ) -> None:
        """Initialize a DeckDataProvider."""
        self._deck_definition = deck_definition
        self._configuration = {
            cutout_fixture.cutout_slot_location: cutout_fixture
            for cutout_fixture in deck_configuration
        }

    def get_addressable_areas_for_cutout_fixture(
        self, cutout_fixture_id: str, cutout_id: str
    ) -> Set[str]:
        """Get the allowable addressable areas for a cutout fixture loaded on a specific cutout slot."""
        for cutout_fixture in self._deck_definition["cutoutFixtures"]:
            if cutout_fixture_id == cutout_fixture["id"]:
                return set(
                    cutout_fixture["providesAddressableAreas"].get(cutout_id, [])
                )

        raise FixtureDoesNotExistError(
            f'Could not resolve "{cutout_fixture_id}" to a fixture.'
        )

    def get_configured_addressable_areas(self) -> Set[str]:
        """Get a list of all addressable areas the robot is configured for."""
        configured_addressable_areas = set()
        for cutout_id, cutout_fixture in self._configuration.items():
            addressable_areas = self.get_addressable_areas_for_cutout_fixture(
                cutout_fixture.name, cutout_id
            )
            configured_addressable_areas.update(addressable_areas)
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
