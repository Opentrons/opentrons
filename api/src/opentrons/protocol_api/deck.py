"""Deck state accessors for the Protocol API."""
from dataclasses import dataclass
from typing import Iterator, List, Mapping, Optional, Tuple, Union

from opentrons_shared_data.deck.types import SlotDefV3

from opentrons.motion_planning import adjacent_slots_getters
from opentrons.protocols.api_support.types import APIVersion
from opentrons.protocols.api_support.util import APIVersionError
from opentrons.types import DeckLocation, DeckSlotName, StagingSlotName, Location, Point
from opentrons_shared_data.robot.types import RobotType


from .core.common import ProtocolCore
from .core.core_map import LoadedCoreMap
from .core.module import AbstractModuleCore
from .labware import Labware
from .module_contexts import ModuleContext
from ._types import OFF_DECK
from . import validation


DeckItem = Union[Labware, ModuleContext]

STAGING_SLOT_VERSION_GATE = APIVersion(2, 16)


@dataclass(frozen=True)
class CalibrationPosition:
    """A calibration point on the deck of the robot.

    Attributes:
        id: Unique identifier for the calibration point.
        position: The absolute x, y, z coordinate of the point.
        displayName: A human-readable nickname for this point.
    """

    id: str
    position: Tuple[float, float, float]
    displayName: str


def _get_slot_name(
    slot_key: DeckLocation, api_version: APIVersion, robot_type: RobotType
) -> Union[DeckSlotName, StagingSlotName]:
    try:
        slot = validation.ensure_and_convert_deck_slot(
            slot_key, api_version, robot_type
        )
        return slot
    except (TypeError, ValueError) as error:
        raise KeyError(slot_key) from error


class Deck(Mapping[DeckLocation, Optional[DeckItem]]):
    """A dictionary-like object to access Protocol API objects loaded on the deck.

    Accessible via :py:meth:`ProtocolContext.deck`.
    """

    def __init__(
        self,
        protocol_core: ProtocolCore,
        core_map: LoadedCoreMap,
        api_version: APIVersion,
    ) -> None:
        self._protocol_core = protocol_core
        self._core_map = core_map
        self._api_version = api_version

        deck_locations = protocol_core.get_deck_definition()["locations"]

        self._slot_definitions_by_name = self._protocol_core.get_slot_definitions()
        if self._api_version >= STAGING_SLOT_VERSION_GATE:
            self._slot_definitions_by_name.update(
                self._protocol_core.get_staging_slot_definitions()
            )

        self._calibration_positions = [
            CalibrationPosition(
                id=point["id"],
                displayName=point["displayName"],
                position=(
                    point["position"][0],
                    point["position"][1],
                    point["position"][2],
                ),
            )
            for point in deck_locations["calibrationPoints"]
        ]

    def __getitem__(self, key: DeckLocation) -> Optional[DeckItem]:
        """Get the item, if any, located in a given slot."""
        slot_name = _get_slot_name(
            key, self._api_version, self._protocol_core.robot_type
        )
        item_core = self._protocol_core.get_slot_item(slot_name)
        item = self._core_map.get(item_core)

        return item

    def __delitem__(self, key: DeckLocation) -> None:
        if self._api_version == APIVersion(2, 14):
            # __delitem__() support history:
            #
            # * PAPIv<=2.13 (non Protocol Engine): Yes, but that goes through a different Deck class
            # * PAPIv2.14 (Protocol Engine): No
            # * PAPIv2.15 (Protocol Engine): Yes
            raise APIVersionError(
                api_element="Deleting deck elements",
                until_version="2.15",
                current_version=f"{self._api_version}",
            )

        slot_name = _get_slot_name(
            key, self._api_version, self._protocol_core.robot_type
        )
        item_core = self._protocol_core.get_slot_item(slot_name)

        if item_core is None:
            # No-op if trying to delete from an empty slot.
            # This matches pre-Protocol-Engine (PAPIv<=2.13) behavior.
            pass
        elif isinstance(item_core, AbstractModuleCore):
            # Protocol Engine does not support removing modules from the deck.
            # This is a change from pre-Protocol-Engine (PAPIv<=2.13) behavior, unfortunately.
            raise TypeError(
                f"Slot {repr(key)} contains a module, {item_core.get_display_name()}."
                f" You can only delete labware, not modules."
            )
        else:
            self._protocol_core.move_labware(
                item_core,
                new_location=OFF_DECK,
                use_gripper=False,
                pause_for_manual_move=False,
                pick_up_offset=None,
                drop_offset=None,
            )

    def __iter__(self) -> Iterator[str]:
        """Iterate through all deck slots."""
        return iter(self._slot_definitions_by_name)

    def __len__(self) -> int:
        """Get the number of slots on the deck."""
        return len(self._slot_definitions_by_name)

    # todo(mm, 2023-05-08): This may be internal and removable from this public class. Jira RSS-236.
    def right_of(self, slot: DeckLocation) -> Optional[DeckItem]:
        """Get the item directly to the right of the given slot, if any."""
        slot_name = _get_slot_name(
            slot, self._api_version, self._protocol_core.robot_type
        )
        if isinstance(slot_name, DeckSlotName):
            east_slot = adjacent_slots_getters.get_east_slot(slot_name.as_int())
        else:
            east_slot = None

        return self[east_slot] if east_slot is not None else None

    # todo(mm, 2023-05-08): This may be internal and removable from this public class. Jira RSS-236.
    def left_of(self, slot: DeckLocation) -> Optional[DeckItem]:
        """Get the item directly to the left of the given slot, if any."""
        slot_name = _get_slot_name(
            slot, self._api_version, self._protocol_core.robot_type
        )
        west_slot: Optional[DeckLocation]
        if isinstance(slot_name, DeckSlotName):
            west_slot = adjacent_slots_getters.get_west_slot(slot_name.as_int())
        else:
            west_slot = adjacent_slots_getters.get_west_of_staging_slot(slot_name).id

        return self[west_slot] if west_slot is not None else None

    # todo(mm, 2023-05-08): This is undocumented in the public PAPI, but is used in some protocols
    # written by Applications Engineering. Either officially document this, or decide it's internal
    # and remove it from this class. Jira RSS-236.
    def position_for(self, slot: DeckLocation) -> Location:
        """Get the absolute location of a deck slot's front-left corner."""
        slot_name = _get_slot_name(
            slot, self._api_version, self._protocol_core.robot_type
        )
        slot_definition = self._slot_definitions_by_name[slot_name.id]
        x, y, z = slot_definition["position"]
        normalized_slot_name = validation.internal_slot_to_public_string(
            slot_name, self._protocol_core.robot_type
        )
        return Location(point=Point(x, y, z), labware=normalized_slot_name)

    # todo(mm, 2023-05-08): This may be internal and removable from this public class. Jira RSS-236.
    def get_slot_definition(self, slot: DeckLocation) -> SlotDefV3:
        """Get the geometric definition data of a slot."""
        slot_name = _get_slot_name(
            slot, self._api_version, self._protocol_core.robot_type
        )
        return self._slot_definitions_by_name[slot_name.id]

    # todo(mm, 2023-05-08): This may be internal and removable from this public class. Jira RSS-236.
    def get_slot_center(self, slot: DeckLocation) -> Point:
        """Get the absolute coordinates of a slot's center."""
        slot_name = _get_slot_name(
            slot, self._api_version, self._protocol_core.robot_type
        )
        return self._protocol_core.get_slot_center(slot_name)

    # todo(mm, 2023-05-08): This may be internal and removable from this public class. Jira RSS-236.
    @property
    def highest_z(self) -> float:
        """Get the height of the tallest known point on the deck."""
        return self._protocol_core.get_highest_z()

    # todo(mm, 2023-05-08): This appears internal. Remove it from this public class. Jira RSS-236.
    @property
    def slots(self) -> List[SlotDefV3]:
        """Get a list of all slot definitions."""
        return list(self._slot_definitions_by_name.values())

    # todo(mm, 2023-05-08): This appears internal. Remove it from this public class. Jira RSS-236.
    @property
    def calibration_positions(self) -> List[CalibrationPosition]:
        """Get a list of all calibration positions on the deck."""
        return list(self._calibration_positions)
