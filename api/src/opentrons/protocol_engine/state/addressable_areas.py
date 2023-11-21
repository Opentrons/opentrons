"""Basic addressable area data state and store."""
from dataclasses import dataclass
from typing import Dict, Set, Union, List

from opentrons_shared_data.deck.dev_types import DeckDefinitionV4, SlotDefV3

from opentrons.types import Point, DeckSlotName

from ..commands import (
    Command,
    LoadLabwareResult,
    LoadModuleResult,
    MoveLabwareResult,
    MoveToAddressableAreaResult,
)
from ..errors import (
    IncompatibleAddressableAreaError,
    AreaNotInDeckConfigurationError,
    SlotDoesNotExistError,
)
from ..resources import deck_configuration_provider
from ..types import (
    DeckSlotLocation,
    AddressableAreaLocation,
    AddressableArea,
    PotentialCutoutFixture,
    DeckConfigurationType,
)
from ..actions import Action, UpdateCommandAction, PlayAction
from .config import Config
from .abstract_store import HasState, HandlesActions


@dataclass
class AddressableAreaState:
    """State of all loaded addressable area resources."""

    loaded_addressable_areas_by_name: Dict[str, AddressableArea]
    potential_cutout_fixtures_by_cutout_id: Dict[str, Set[PotentialCutoutFixture]]
    deck_definition: DeckDefinitionV4
    use_simulated_deck_config: bool


def _get_conflicting_addressable_areas(
    potential_cutout_fixtures: Set[PotentialCutoutFixture],
    loaded_addressable_areas: Set[str],
    deck_definition: DeckDefinitionV4,
) -> Set[str]:
    loaded_areas_on_cutout = set()
    for fixture in potential_cutout_fixtures:
        loaded_areas_on_cutout.update(
            deck_configuration_provider.get_provided_addressable_area_names(
                fixture.cutout_fixture_id,
                fixture.cutout_id,
                deck_definition,
            )
        )
    loaded_areas_on_cutout.intersection_update(loaded_addressable_areas)
    return loaded_areas_on_cutout


class AddressableAreaStore(HasState[AddressableAreaState], HandlesActions):
    """Addressable area state container."""

    _state: AddressableAreaState

    def __init__(
        self,
        deck_configuration: DeckConfigurationType,
        config: Config,
        deck_definition: DeckDefinitionV4,
    ) -> None:
        """Initialize an addressable area store and its state."""
        if config.use_simulated_deck_config:
            loaded_addressable_areas_by_name = {}
        else:
            loaded_addressable_areas_by_name = (
                self._get_addressable_areas_from_deck_configuration(
                    deck_configuration,
                    deck_definition,
                )
            )
        self._state = AddressableAreaState(
            loaded_addressable_areas_by_name=loaded_addressable_areas_by_name,
            potential_cutout_fixtures_by_cutout_id={},
            deck_definition=deck_definition,
            use_simulated_deck_config=config.use_simulated_deck_config,
        )

    def handle_action(self, action: Action) -> None:
        """Modify state in reaction to an action."""
        if isinstance(action, UpdateCommandAction):
            self._handle_command(action.command)
        if isinstance(action, PlayAction):
            current_state = self._state
            if action.deck_configuration is not None:
                self._state.loaded_addressable_areas_by_name = (
                    self._get_addressable_areas_from_deck_configuration(
                        deck_config=action.deck_configuration,
                        deck_definition=current_state.deck_definition,
                    )
                )

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

    @staticmethod
    def _get_addressable_areas_from_deck_configuration(
        deck_config: DeckConfigurationType, deck_definition: DeckDefinitionV4
    ) -> Dict[str, AddressableArea]:
        """Load all provided addressable areas with a valid deck configuration."""
        # TODO uncomment once execute is hooked up with this properly
        # assert (
        #     len(deck_config) == 12
        # ), f"{len(deck_config)} cutout fixture ids provided."
        addressable_areas = []
        for cutout_id, cutout_fixture_id in deck_config:
            provided_addressable_areas = (
                deck_configuration_provider.get_provided_addressable_area_names(
                    cutout_fixture_id, cutout_id, deck_definition
                )
            )
            cutout_position = deck_configuration_provider.get_cutout_position(
                cutout_id, deck_definition
            )
            for addressable_area_name in provided_addressable_areas:
                addressable_areas.append(
                    deck_configuration_provider.get_addressable_area_from_name(
                        addressable_area_name,
                        cutout_position,
                        deck_definition,
                    )
                )
        return {area.area_name: area for area in addressable_areas}

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
            # TODO Uncomment this out once robot server side stuff is hooked up
            # if not self._state.use_simulated_deck_config:
            #     raise AreaNotInDeckConfigurationError(
            #         f"{addressable_area_name} not provided by deck configuration."
            #     )
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

    def _validate_addressable_area_for_simulation(
        self, addressable_area_name: str
    ) -> str:
        """Given an addressable area name, validate it can exist on the deck and return cutout id associated with it."""
        (
            cutout_id,
            potential_fixtures,
        ) = deck_configuration_provider.get_potential_cutout_fixtures(
            addressable_area_name, self._state.deck_definition
        )

        if cutout_id in self._state.potential_cutout_fixtures_by_cutout_id:
            existing_potential_fixtures = (
                self._state.potential_cutout_fixtures_by_cutout_id[cutout_id]
            )
            remaining_fixtures = existing_potential_fixtures.intersection(
                set(potential_fixtures)
            )
            if not remaining_fixtures:
                loaded_areas_on_cutout = _get_conflicting_addressable_areas(
                    existing_potential_fixtures,
                    set(self.state.loaded_addressable_areas_by_name),
                    self._state.deck_definition,
                )
                raise IncompatibleAddressableAreaError(
                    f"Cannot load {addressable_area_name}, not compatible with one or more of"
                    f" the following areas: {loaded_areas_on_cutout}"
                )
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
        """Get addressable area."""
        if not self._state.use_simulated_deck_config:
            return self._get_loaded_addressable_area(addressable_area_name)
        else:
            return self._get_addressable_area_for_simulation(addressable_area_name)

    def get_all(self) -> List[str]:
        """Get a list of all loaded addressable area names."""
        return list(self._state.loaded_addressable_areas_by_name)

    def _get_loaded_addressable_area(
        self, addressable_area_name: str
    ) -> AddressableArea:
        """Get an addressable area that has been loaded into state. Will raise error if it does not exist."""
        try:
            return self._state.loaded_addressable_areas_by_name[addressable_area_name]
        except KeyError:
            raise AreaNotInDeckConfigurationError(
                f"{addressable_area_name} not provided by deck configuration."
            )

    def _get_addressable_area_for_simulation(
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
                loaded_areas_on_cutout = _get_conflicting_addressable_areas(
                    self._state.potential_cutout_fixtures_by_cutout_id[cutout_id],
                    set(self._state.loaded_addressable_areas_by_name),
                    self.state.deck_definition,
                )
                raise IncompatibleAddressableAreaError(
                    f"Cannot load {addressable_area_name}, not compatible with one or more of"
                    f" the following areas: {loaded_areas_on_cutout}"
                )

        cutout_position = deck_configuration_provider.get_cutout_position(
            cutout_id, self._state.deck_definition
        )
        return deck_configuration_provider.get_addressable_area_from_name(
            addressable_area_name, cutout_position, self._state.deck_definition
        )

    def get_addressable_area_position(self, addressable_area_name: str) -> Point:
        """Get the position of an addressable area."""
        # TODO This should be the regular `get_addressable_area` once Robot Server deck config and tests is hooked up
        addressable_area = self._get_addressable_area_for_simulation(
            addressable_area_name
        )
        position = addressable_area.position
        return Point(x=position.x, y=position.y, z=position.z)

    def get_addressable_area_center(self, addressable_area_name: str) -> Point:
        """Get the (x, y, z) position of the center of the area."""
        addressable_area = self.get_addressable_area(addressable_area_name)
        position = addressable_area.position
        bounding_box = addressable_area.bounding_box
        return Point(
            x=position.x + bounding_box.x / 2,
            y=position.y + bounding_box.y / 2,
            z=position.z,
        )

    def get_addressable_area_height(self, addressable_area_name: str) -> float:
        """Get the z height of an addressable area."""
        addressable_area = self.get_addressable_area(addressable_area_name)
        return addressable_area.bounding_box.z

    def get_slot_definition(self, slot: DeckSlotName) -> SlotDefV3:
        """Get the definition of a slot in the deck."""
        try:
            # TODO This should be the regular `get_addressable_area` once Robot Server deck config and tests is hooked up
            addressable_area = self._get_addressable_area_for_simulation(slot.id)
        except (AreaNotInDeckConfigurationError, IncompatibleAddressableAreaError):
            raise SlotDoesNotExistError(
                f"Slot ID {slot.id} does not exist in deck {self._state.deck_definition['otId']}"
            )
        position = addressable_area.position
        bounding_box = addressable_area.bounding_box
        return {
            "id": addressable_area.area_name,
            "position": [position.x, position.y, position.z],
            "boundingBox": {
                "xDimension": bounding_box.x,
                "yDimension": bounding_box.y,
                "zDimension": bounding_box.z,
            },
            "displayName": addressable_area.display_name,
            "compatibleModuleTypes": addressable_area.compatible_module_types,
        }
