"""Basic addressable area data state and store."""
from dataclasses import dataclass
from typing import Dict, List, Optional, Set, Union

from opentrons_shared_data.robot.dev_types import RobotType
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
    AddressableAreaDoesNotExistError,
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
    """The addressable areas that have been loaded so far.

    When `use_simulated_deck_config` is `False`, these are the addressable areas that the
    deck configuration provided.

    When `use_simulated_deck_config` is `True`, these are the addressable areas that have been
    referenced by the protocol so far.
    """

    potential_cutout_fixtures_by_cutout_id: Dict[str, Set[PotentialCutoutFixture]]

    deck_definition: DeckDefinitionV4

    deck_configuration: Optional[DeckConfigurationType]
    """The host robot's full deck configuration.

    If `use_simulated_deck_config` is `True`, this is meaningless and this value is undefined.
    In practice it will probably be `None` or `[]`.

    If `use_simulated_deck_config` is `False`, this will be non-`None`.
    """

    robot_type: RobotType

    use_simulated_deck_config: bool
    """See `Config.use_simulated_deck_config`."""


_OT2_ORDERED_SLOTS = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11", "12"]
_FLEX_ORDERED_SLOTS = [
    "D1",
    "D2",
    "D3",
    "C1",
    "C2",
    "C3",
    "B1",
    "B2",
    "B3",
    "A1",
    "A2",
    "A3",
]
_FLEX_ORDERED_STAGING_SLOTS = ["D4", "C4", "B4", "A4"]


def _get_conflicting_addressable_areas_error_string(
    potential_cutout_fixtures: Set[PotentialCutoutFixture],
    loaded_addressable_areas: Dict[str, AddressableArea],
    deck_definition: DeckDefinitionV4,
) -> str:
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
    display_names = {
        loaded_addressable_areas[area].display_name for area in loaded_areas_on_cutout
    }
    return ", ".join(display_names)


# This is a temporary shim while Protocol Engine's conflict-checking code
# can only take deck slots as input.
# Long-term solution: Check for conflicts based on bounding boxes, not slot adjacencies.
# Shorter-term: Change the conflict-checking code to take cutouts instead of deck slots.
CUTOUT_TO_DECK_SLOT_MAP: Dict[str, DeckSlotName] = {
    # OT-2
    "cutout1": DeckSlotName.SLOT_1,
    "cutout2": DeckSlotName.SLOT_2,
    "cutout3": DeckSlotName.SLOT_3,
    "cutout4": DeckSlotName.SLOT_4,
    "cutout5": DeckSlotName.SLOT_5,
    "cutout6": DeckSlotName.SLOT_6,
    "cutout7": DeckSlotName.SLOT_7,
    "cutout8": DeckSlotName.SLOT_8,
    "cutout9": DeckSlotName.SLOT_9,
    "cutout10": DeckSlotName.SLOT_10,
    "cutout11": DeckSlotName.SLOT_11,
    "cutout12": DeckSlotName.FIXED_TRASH,
    # Flex
    "cutoutA1": DeckSlotName.SLOT_A1,
    "cutoutA2": DeckSlotName.SLOT_A2,
    "cutoutA3": DeckSlotName.SLOT_A3,
    "cutoutB1": DeckSlotName.SLOT_B1,
    "cutoutB2": DeckSlotName.SLOT_B2,
    "cutoutB3": DeckSlotName.SLOT_B3,
    "cutoutC1": DeckSlotName.SLOT_C1,
    "cutoutC2": DeckSlotName.SLOT_C2,
    "cutoutC3": DeckSlotName.SLOT_C3,
    "cutoutD1": DeckSlotName.SLOT_D1,
    "cutoutD2": DeckSlotName.SLOT_D2,
    "cutoutD3": DeckSlotName.SLOT_D3,
}


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
            deck_configuration=deck_configuration,
            loaded_addressable_areas_by_name=loaded_addressable_areas_by_name,
            potential_cutout_fixtures_by_cutout_id={},
            deck_definition=deck_definition,
            robot_type=config.robot_type,
            use_simulated_deck_config=config.use_simulated_deck_config,
        )

    def handle_action(self, action: Action) -> None:
        """Modify state in reaction to an action."""
        if isinstance(action, UpdateCommandAction):
            self._handle_command(action.command)
        if isinstance(action, PlayAction):
            current_state = self._state
            if (
                action.deck_configuration is not None
                and not self._state.use_simulated_deck_config
            ):
                self._state.deck_configuration = action.deck_configuration
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
        """Return all addressable areas provided by the given deck configuration."""
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
            base_slot = CUTOUT_TO_DECK_SLOT_MAP[cutout_id]
            for addressable_area_name in provided_addressable_areas:
                addressable_areas.append(
                    deck_configuration_provider.get_addressable_area_from_name(
                        addressable_area_name=addressable_area_name,
                        cutout_position=cutout_position,
                        base_slot=base_slot,
                        deck_definition=deck_definition,
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
            cutout_id = self._validate_addressable_area_for_simulation(
                addressable_area_name
            )

            cutout_position = deck_configuration_provider.get_cutout_position(
                cutout_id, self._state.deck_definition
            )
            base_slot = CUTOUT_TO_DECK_SLOT_MAP[cutout_id]
            addressable_area = (
                deck_configuration_provider.get_addressable_area_from_name(
                    addressable_area_name=addressable_area_name,
                    cutout_position=cutout_position,
                    base_slot=base_slot,
                    deck_definition=self._state.deck_definition,
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
            # Get the existing potential cutout fixtures for the addressable area already loaded on this cutout
            existing_potential_fixtures = (
                self._state.potential_cutout_fixtures_by_cutout_id[cutout_id]
            )
            # Get common cutout fixture that supplies existing addressable areas and the one being loaded
            remaining_fixtures = existing_potential_fixtures.intersection(
                set(potential_fixtures)
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
            return self._get_addressable_area_from_deck_data(addressable_area_name)

    def get_all(self) -> List[str]:
        """Get a list of all loaded addressable area names."""
        return list(self._state.loaded_addressable_areas_by_name)

    def get_all_cutout_fixtures(self) -> Optional[List[str]]:
        """Get the names of all fixtures present in the host robot's deck configuration.

        If `use_simulated_deck_config` is `True` (see `Config`), we don't have a
        meaningful concrete layout of fixtures, so this will return `None`.
        """
        if self._state.use_simulated_deck_config:
            return None
        else:
            assert self._state.deck_configuration is not None
            return [
                cutout_fixture_id
                for _, cutout_fixture_id in self._state.deck_configuration
            ]

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

    def _check_if_area_is_compatible_with_potential_fixtures(
        self,
        area_name: str,
        cutout_id: str,
        potential_fixtures: Set[PotentialCutoutFixture],
    ) -> None:
        if cutout_id in self._state.potential_cutout_fixtures_by_cutout_id:
            if not self._state.potential_cutout_fixtures_by_cutout_id[
                cutout_id
            ].intersection(potential_fixtures):
                loaded_areas_on_cutout = (
                    _get_conflicting_addressable_areas_error_string(
                        self._state.potential_cutout_fixtures_by_cutout_id[cutout_id],
                        self._state.loaded_addressable_areas_by_name,
                        self.state.deck_definition,
                    )
                )
                area_display_name = (
                    deck_configuration_provider.get_addressable_area_display_name(
                        area_name, self.state.deck_definition
                    )
                )
                raise IncompatibleAddressableAreaError(
                    f"Cannot use {area_display_name}, not compatible with one or more of"
                    f" the following fixtures: {loaded_areas_on_cutout}"
                )

    def _get_addressable_area_from_deck_data(
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

        self._check_if_area_is_compatible_with_potential_fixtures(
            addressable_area_name, cutout_id, potential_fixtures
        )

        cutout_position = deck_configuration_provider.get_cutout_position(
            cutout_id, self._state.deck_definition
        )
        base_slot = CUTOUT_TO_DECK_SLOT_MAP[cutout_id]
        return deck_configuration_provider.get_addressable_area_from_name(
            addressable_area_name=addressable_area_name,
            cutout_position=cutout_position,
            base_slot=base_slot,
            deck_definition=self._state.deck_definition,
        )

    def get_addressable_area_base_slot(
        self, addressable_area_name: str
    ) -> DeckSlotName:
        """Get the base slot the addressable area is associated with."""
        addressable_area = self.get_addressable_area(addressable_area_name)
        return addressable_area.base_slot

    def get_addressable_area_position(self, addressable_area_name: str) -> Point:
        """Get the position of an addressable area.

        This does not require the addressable area to be in the deck configuration.
        This is primarily used to support legacy fixed trash labware without
        modifying the deck layout to remove the similar, but functionally different,
        trashBinAdapter cutout fixture.

        Besides that instance, for movement purposes, this should only be called for
        areas that have been pre-validated, otherwise there could be the risk of collision.
        """
        addressable_area = self._get_addressable_area_from_deck_data(
            addressable_area_name
        )
        position = addressable_area.position
        return Point(x=position.x, y=position.y, z=position.z)

    def get_addressable_area_move_to_location(
        self, addressable_area_name: str
    ) -> Point:
        """Get the move-to position (top center) for an addressable area."""
        addressable_area = self.get_addressable_area(addressable_area_name)
        position = addressable_area.position
        bounding_box = addressable_area.bounding_box
        return Point(
            x=position.x + bounding_box.x / 2,
            y=position.y + bounding_box.y / 2,
            z=position.z + bounding_box.z,
        )

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

    def get_fixture_height(self, cutout_fixture_name: str) -> float:
        """Get the z height of a cutout fixture."""
        cutout_fixture = deck_configuration_provider.get_cutout_fixture(
            cutout_fixture_name, self._state.deck_definition
        )
        return cutout_fixture["height"]

    def get_slot_definition(self, slot_id: str) -> SlotDefV3:
        """Get the definition of a slot in the deck.

        This does not require that the slot exist in deck configuration.
        """
        try:
            addressable_area = self._get_addressable_area_from_deck_data(slot_id)
        except AddressableAreaDoesNotExistError:
            raise SlotDoesNotExistError(
                f"Slot ID {slot_id} does not exist in deck {self._state.deck_definition['otId']}"
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

    def get_deck_slot_definitions(self) -> Dict[str, SlotDefV3]:
        """Get all standard slot definitions available in the deck definition."""
        if self._state.robot_type == "OT-2 Standard":
            slots = _OT2_ORDERED_SLOTS
        else:
            slots = _FLEX_ORDERED_SLOTS
        return {slot_name: self.get_slot_definition(slot_name) for slot_name in slots}

    def get_staging_slot_definitions(self) -> Dict[str, SlotDefV3]:
        """Get all staging slot definitions available in the deck definition."""
        if self._state.robot_type == "OT-3 Standard":
            return {
                slot_name: self.get_slot_definition(slot_name)
                for slot_name in _FLEX_ORDERED_STAGING_SLOTS
            }
        else:
            return {}

    def raise_if_area_not_in_deck_configuration(
        self, addressable_area_name: str
    ) -> None:
        """Raise error if an addressable area is not compatible with or in the deck configuration.

        For simulated runs/analysis, this will raise if the given addressable area is not compatible with other
        previously referenced addressable areas, for example if a movable trash in A1 is in state, referencing the
        deck slot A1 will raise since those two can't exist in any deck configuration combination.

        For an on robot run, it will check if it is in the robot's deck configuration, if not it will raise an error.
        """
        if self._state.use_simulated_deck_config:
            (
                cutout_id,
                potential_fixtures,
            ) = deck_configuration_provider.get_potential_cutout_fixtures(
                addressable_area_name, self._state.deck_definition
            )

            self._check_if_area_is_compatible_with_potential_fixtures(
                addressable_area_name, cutout_id, potential_fixtures
            )
        else:
            if (
                addressable_area_name
                not in self._state.loaded_addressable_areas_by_name
            ):
                raise AreaNotInDeckConfigurationError(
                    f"{addressable_area_name} not provided by deck configuration."
                )
