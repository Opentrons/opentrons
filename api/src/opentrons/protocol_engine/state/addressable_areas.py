"""Basic addressable area data state and store."""
from dataclasses import dataclass
from typing import Dict, Set, Union, List, Tuple

from opentrons_shared_data.deck.dev_types import DeckDefinitionV4

from ..commands import (
    Command,
    LoadLabwareResult,
    LoadModuleResult,
    MoveLabwareResult,
    MoveToAddressableAreaResult,
)
from ..resources import deck_configuration_provider
from ..types import (
    DeckSlotLocation,
    AddressableAreaLocation,
    AddressableArea,
    PotentialCutoutFixture,
)
from ..actions import Action, UpdateCommandAction
from .config import Config
from .abstract_store import HasState, HandlesActions


@dataclass
class AddressableAreaState:
    """State of all loaded addressable area resources."""

    loaded_addressable_areas_by_name: Dict[str, AddressableArea]
    potential_cutout_fixtures_by_cutout_id: Dict[str, Set[PotentialCutoutFixture]]
    deck_definition: DeckDefinitionV4
    deck_config_loaded: bool


# TODO make the below some sort of better type
DeckConfiguration = List[Tuple[str, str]]


class AddressableAreaStore(HasState[AddressableAreaState], HandlesActions):
    """Addressable area state container."""

    _state: AddressableAreaState

    def __init__(
        self,
        deck_configuration: DeckConfiguration,
        config: Config,
        deck_definition: DeckDefinitionV4,
    ) -> None:
        """Initialize an addressable area store and its state."""
        self._deck_definition = deck_definition
        self._config = config

        if self._config.use_virtual_pipettes:
            loaded_addressable_areas_by_name = {}
        else:
            addressable_areas = self._load_addressable_areas_from_deck_configuration(
                deck_configuration
            )
            loaded_addressable_areas_by_name = {
                area.area_name: area for area in addressable_areas
            }

        self._state = AddressableAreaState(
            loaded_addressable_areas_by_name=loaded_addressable_areas_by_name,
            potential_cutout_fixtures_by_cutout_id={},
            deck_definition=deck_definition,
            deck_config_loaded=self._config.use_virtual_pipettes,
        )

    def handle_action(self, action: Action) -> None:
        """Modify state in reaction to an action."""
        if isinstance(action, UpdateCommandAction):
            self._handle_command(action.command)
        # TODO have an action to reload the deck configuration.

    def _handle_command(self, command: Command) -> None:
        """Modify state in reaction to a command."""
        if isinstance(command.result, LoadLabwareResult):
            location = command.params.location
            if isinstance(location, (DeckSlotLocation, AddressableAreaLocation)):
                self._check_location_is_addressable_area(location)

        elif isinstance(command.result, MoveLabwareResult):
            location = command.params.newLocation
            if isinstance(location, (DeckSlotLocation, AddressableAreaLocation)):
                self._check_location_is_addressable_area(location)

        elif isinstance(command.result, LoadModuleResult):
            self._check_location_is_addressable_area(command.params.location)

        elif isinstance(command.result, MoveToAddressableAreaResult):
            addressable_area_name = command.params.addressableAreaName
            self._check_location_is_addressable_area(addressable_area_name)

    def _check_location_is_addressable_area(
        self, location: Union[DeckSlotLocation, AddressableAreaLocation, str]
    ) -> None:
        if isinstance(location, DeckSlotLocation):
            addressable_area_name = location.slotName.id
        elif isinstance(location, AddressableAreaLocation):
            addressable_area_name = location.addressableAreaName
        else:
            addressable_area_name = location

        if addressable_area_name not in self._state.loaded_addressable_areas_by_name:
            # TODO we might not need this check since referencing it earlier will raise an error, but just in case
            #   I'm putting this here (commented out) for now
            # if not self._config.use_virtual_pipettes:
            #     raise RuntimeError("Non-existent addressable area")
            cutout_id = self._validate_addressable_area_for_simulation(
                addressable_area_name
            )
            cutout_position = deck_configuration_provider.get_cutout_position(
                cutout_id, self._state.deck_definition
            )
            addressable_area = (
                deck_configuration_provider.get_addressable_area_from_name(
                    addressable_area_name, cutout_position, self._state.deck_definition
                )
            )
            self._state.loaded_addressable_areas_by_name[
                addressable_area.area_name
            ] = addressable_area

    def _load_addressable_areas_from_deck_configuration(
        self, deck_config: DeckConfiguration
    ) -> List[AddressableArea]:
        """Load all provided addressable areas with a valid deck configuration."""
        # TODO uncomment once execute is hooked up with this properly
        # assert (
        #     len(deck_config) == 12
        # ), f"{len(deck_config)} cutout fixture ids provided."
        addressable_areas = []
        for cutout_id, cutout_fixture_id in deck_config:
            # TODO potentially make this more performant rather than iterating through cutout fixtures every loop
            cutout_fixture = deck_configuration_provider.get_cutout_fixtures_by_id(
                cutout_fixture_id, self._deck_definition
            )
            addressable_areas.extend(
                deck_configuration_provider.get_addressable_areas_from_cutout_and_cutout_fixture(
                    cutout_id, cutout_fixture, self._deck_definition
                )
            )
        return addressable_areas

    def _validate_addressable_area_for_simulation(
        self, addressable_area_name: str
    ) -> str:
        """Given an addressable area name, validate it can exist on the deck and return cutout id associated with it."""
        (
            cutout_id,
            potential_fixtures,
        ) = deck_configuration_provider.get_potential_cutout_fixtures(
            addressable_area_name, self._deck_definition
        )

        if cutout_id in self._state.potential_cutout_fixtures_by_cutout_id:
            existing_potential_fixtures = (
                self._state.potential_cutout_fixtures_by_cutout_id[cutout_id]
            )
            remaining_fixtures = existing_potential_fixtures.intersection(
                set(potential_fixtures)
            )
            if not remaining_fixtures:
                raise RuntimeError("Invalid fixtures")
            self._state.potential_cutout_fixtures_by_cutout_id[
                cutout_id
            ] = remaining_fixtures
        else:
            self._state.potential_cutout_fixtures_by_cutout_id[cutout_id] = set(
                potential_fixtures
            )
        return cutout_id


class AddressableAreaView(HasState[AddressableAreaState]):
    """Read-only addressable area state view."""

    _state: AddressableAreaState

    def __init__(self, state: AddressableAreaState) -> None:
        """Initialize the computed view of addressable area state.

        Arguments:
            state: Addressable area state dataclass used for all calculations.
        """
        self._state = state

    def get_addressable_area(self, addressable_area_name: str) -> AddressableArea:
        """Get addressable area"""
        if self._state.deck_config_loaded:
            return self.get_loaded_addressable_area(addressable_area_name)
        else:
            return self.get_addressable_area_for_simulation(addressable_area_name)

    def get_loaded_addressable_area(
        self, addressable_area_name: str
    ) -> AddressableArea:
        """Get an addressable area that has been loaded into state. Will raise error if it does not exist."""
        try:
            return self._state.loaded_addressable_areas_by_name[addressable_area_name]
        except KeyError:
            raise RuntimeError("Addressable area is not configured for this robot")

    def get_addressable_area_for_simulation(
        self, addressable_area_name: str
    ) -> AddressableArea:
        """Get an addressable area that may not have been already loaded for a simulated run.

        Since this may be the first time this addressable area has been called, and it might not exist in the store
        yet (and if not won't until the result completes), we have to check if it is theoretically possible and then
        get the area data from the deck configuration provider.
        """
        if addressable_area_name in self._state.loaded_addressable_areas_by_name:
            return self._state.loaded_addressable_areas_by_name[addressable_area_name]

        (
            cutout_id,
            potential_fixtures,
        ) = deck_configuration_provider.get_potential_cutout_fixtures(
            addressable_area_name, self._state.deck_definition
        )

        if cutout_id in self._state.potential_cutout_fixtures_by_cutout_id:
            if not self._state.potential_cutout_fixtures_by_cutout_id[
                cutout_id
            ].intersection(potential_fixtures):
                raise RuntimeError("Fixture not allowed")

        cutout_position = deck_configuration_provider.get_cutout_position(
            cutout_id, self._state.deck_definition
        )
        return deck_configuration_provider.get_addressable_area_from_name(
            addressable_area_name, cutout_position, self._state.deck_definition
        )
