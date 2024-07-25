# NOTE(mc, 2022-12-05): this module is deprecated;
# do not add to it unless necessary and do not use in new code
import functools
import logging
from collections import UserDict
from typing import Dict, Optional, List, Union, Mapping
from typing_extensions import Protocol, Final

from opentrons_shared_data.deck import load as load_deck

from opentrons_shared_data.deck.types import SlotDefV3
from opentrons_shared_data.labware.types import LabwareUri

from opentrons.hardware_control.modules.types import ModuleType
from opentrons.motion_planning import deck_conflict
from opentrons.protocols.api_support.labware_like import LabwareLike
from opentrons.types import (
    DeckLocation,
    Location,
    Mount,
    Point,
    DeckSlotName,
    StagingSlotName,
)

from opentrons.protocol_api.core.labware import AbstractLabware
from opentrons.protocol_api.deck import CalibrationPosition
from opentrons.protocol_api.labware import load as load_lw, Labware

from .legacy_labware_core import LegacyLabwareCore
from .module_geometry import ModuleGeometry, HeaterShakerGeometry, ThermocyclerGeometry


_log = logging.getLogger(__name__)


# Amount of slots in a single deck row
ROW_LENGTH = 3
FIXED_TRASH_ID = "fixedTrash"


DEFAULT_LEGACY_DECK_DEFINITION_VERSION: Final = 3


class DeckItem(Protocol):
    @property
    def highest_z(self) -> float:
        ...

    @property
    def load_name(self) -> str:
        ...


class Deck(UserDict):  # type: ignore[type-arg]
    data: Dict[int, Optional[DeckItem]]

    def __init__(self, deck_type: str) -> None:
        super().__init__()
        self._definition = load_deck(
            name=deck_type, version=DEFAULT_LEGACY_DECK_DEFINITION_VERSION
        )
        self._positions = {}
        for slot in self._definition["locations"]["orderedSlots"]:
            self.data[int(slot["id"])] = None
            self._positions[int(slot["id"])] = Point(*slot["position"])
        self._highest_z = 0.0
        self._load_fixtures()
        self._thermocycler_present = False

    def _load_fixtures(self) -> None:
        for f in self._definition["locations"]["fixtures"]:
            slot_name = self._check_name(f["slot"])  # type: ignore
            # TODO(mc, 2022-06-15): this loads the fixed trash as an instance of
            # `opentrons.protocol_api.labware.Labware`
            # However, all other labware will be added to the `Deck` as instances of
            # `opentrons.protocol_api.core.labware.AbstractLabware`
            # And modules will be added as instances of
            # `opentrons.protocols.geometry.module_geometry.ModuleGeometry`
            # This mix of public and private interfaces as members of a public
            # `Deck` interface is confusing and should be resolved.
            # If `Deck` is public, all items in a `Deck` should be
            # instances of other public APIs.
            loaded_f = load_lw(
                f["labware"], self.position_for(slot_name)  # type: ignore
            )
            self.__setitem__(slot_name, loaded_f)

    @staticmethod
    @functools.lru_cache(20)
    def _assure_int(key: object) -> int:
        if isinstance(key, str):
            return int(key)
        elif isinstance(key, int):
            return key
        else:
            raise TypeError(type(key))

    def _check_name(self, key: object) -> int:
        should_raise = False
        try:
            key_int = Deck._assure_int(key)
        except Exception:
            _log.exception("Bad slot name: {}".format(key))
            should_raise = True
        should_raise = should_raise or key_int not in self.data
        if should_raise:
            raise ValueError("Unknown slot: {}".format(key))
        else:
            return key_int

    @staticmethod
    def _map_to_conflict_checker_item(item: DeckItem) -> deck_conflict.DeckItem:
        name_for_errors = item.load_name

        # We have to account for both Labware and AbstractLabware because this class
        # inappropriately contains both internal and customer-facing types.
        # See todo comment in self._load_fixtures().
        if isinstance(item, Labware):
            is_fixed_trash = "fixedTrash" in item.quirks
            return deck_conflict.Labware(
                highest_z=item.highest_z,
                name_for_errors=name_for_errors,
                # TODO(mm, 2023-02-16): Refactor item.uri to return LabwareUri.
                uri=LabwareUri(item.uri),
                is_fixed_trash=is_fixed_trash,
            )

        elif isinstance(item, AbstractLabware):
            is_fixed_trash = "fixedTrash" in item.get_quirks()
            return deck_conflict.Labware(
                highest_z=item.highest_z,
                name_for_errors=name_for_errors,
                # TODO(mm, 2023-02-16): Refactor item.uri to return LabwareUri.
                uri=LabwareUri(item.get_uri()),
                is_fixed_trash=is_fixed_trash,
            )

        elif isinstance(item, HeaterShakerGeometry):
            return deck_conflict.HeaterShakerModule(
                highest_z_including_labware=item.highest_z,
                name_for_errors=name_for_errors,
            )

        elif isinstance(item, ThermocyclerGeometry):
            return deck_conflict.ThermocyclerModule(
                highest_z_including_labware=item.highest_z,
                name_for_errors=name_for_errors,
                is_semi_configuration=item.is_semi_configuration,
            )

        elif isinstance(item, ModuleGeometry):
            return deck_conflict.OtherModule(
                highest_z_including_labware=item.highest_z,
                name_for_errors=name_for_errors,
            )

        else:
            assert False, f"Deck item {item} has an unknown type."

    def __getitem__(self, key: DeckLocation) -> Optional[DeckItem]:
        return self.data[self._check_name(key)]

    def __delitem__(self, key: DeckLocation) -> None:
        checked_key = self._check_name(key)
        old = self.data[checked_key]
        self.data[checked_key] = None
        if old:
            self.recalculate_high_z()
            # Update the thermocycler present member
            self._thermocycler_present = any(
                isinstance(item, ThermocyclerGeometry) for item in self.data.values()
            )

    def __setitem__(self, key: DeckLocation, val: DeckItem) -> None:
        slot_key_int = self._check_name(key)
        existing_items: Mapping[
            Union[DeckSlotName, StagingSlotName], deck_conflict.DeckItem
        ] = {
            DeckSlotName.from_primitive(slot): self._map_to_conflict_checker_item(item)
            for slot, item in self.data.items()
            if item is not None
        }

        # will raise DeckConflictError if items conflict
        deck_conflict.check(
            existing_items=existing_items,
            new_location=DeckSlotName.from_primitive(slot_key_int),
            new_item=self._map_to_conflict_checker_item(val),
            robot_type=self._definition["robot"]["model"],
        )

        self.data[slot_key_int] = val
        self.recalculate_high_z()
        self._thermocycler_present = any(
            isinstance(item, ThermocyclerGeometry) for item in self.data.values()
        )

    def __contains__(self, key: object) -> bool:
        try:
            key_int = self._check_name(key)
        except ValueError:
            return False
        return key_int in self.data

    def is_edge_move_unsafe(self, mount: Mount, target: "Labware") -> bool:
        """
        Check if slot next to target labware contains a module. Only relevant
        depending on the mount you are using and the column you are moving
        to inside of the labware.
        """
        slot = LabwareLike(target).first_parent()
        if not slot:
            return False
        if mount is Mount.RIGHT:
            other_labware = self.left_of(slot)
        else:
            other_labware = self.right_of(slot)

        return isinstance(other_labware, ModuleGeometry)

    def right_of(self, slot: str) -> Optional[DeckItem]:
        if int(slot) % ROW_LENGTH == 0:
            # We know we're at the right-most edge
            # of the given row
            return None
        else:
            idx = int(slot) + 1
            return self[str(idx)]

    def left_of(self, slot: str) -> Optional[DeckItem]:
        if int(slot) - 1 % ROW_LENGTH == 0:
            # We know we're at the left-most edge
            # of the given row
            return None
        idx = int(slot) - 1
        if idx < 1:
            return None
        return self[str(idx)]

    def position_for(self, key: DeckLocation) -> Location:
        key_int = self._check_name(key)
        return Location(self._positions[key_int], str(key))

    def recalculate_high_z(self) -> None:
        self._highest_z = 0.0
        for item in [lw for lw in self.data.values() if lw]:
            self._highest_z = max(item.highest_z, self._highest_z)

    def get_slot_definition(self, slot_name: str) -> SlotDefV3:
        slots = self._definition["locations"]["orderedSlots"]
        slot_def = next((slot for slot in slots if slot["id"] == slot_name), None)
        if not slot_def:
            slot_ids = [slot["id"] for slot in slots]
            raise ValueError(
                f"slot {slot_name} could not be found,"
                f"valid deck slots are: {slot_ids}"
            )
        return slot_def

    def get_slot_center(self, slot_name: str) -> Point:
        defn = self.get_slot_definition(slot_name)
        return Point(
            defn["position"][0] + defn["boundingBox"]["xDimension"] / 2,
            defn["position"][1] + defn["boundingBox"]["yDimension"] / 2,
            defn["position"][2] + defn["boundingBox"]["zDimension"] / 2,
        )

    def resolve_module_location(
        self, module_type: ModuleType, location: Optional[DeckLocation]
    ) -> DeckLocation:
        dn_from_type = {
            ModuleType.MAGNETIC: "Magnetic Module",
            ModuleType.THERMOCYCLER: "Thermocycler",
            ModuleType.TEMPERATURE: "Temperature Module",
            ModuleType.HEATER_SHAKER: "Heater-Shaker",
        }
        if isinstance(location, str) or isinstance(location, int):
            slot_def = self.get_slot_definition(str(location))
            compatible_modules = slot_def["compatibleModuleTypes"]
            if module_type.value in compatible_modules:
                return location
            elif (
                self._definition["robot"]["model"] == "OT-3 Standard"
                and ModuleType.to_module_fixture_id(module_type) == slot_def["id"]
            ):
                return location
            else:
                raise ValueError(
                    f"A {dn_from_type[module_type]} cannot be loaded"
                    f" into slot {location}"
                )
        else:
            valid_slots = [
                slot["id"]
                for slot in self.slots
                if module_type.value in slot["compatibleModuleTypes"]
            ]
            if len(valid_slots) == 1:
                return valid_slots[0]
            elif not valid_slots:
                raise ValueError(
                    "A {dn_from_type[module_type]} cannot be used with this deck"
                )
            else:
                raise ValueError(
                    f"{dn_from_type[module_type]}s do not have default"
                    " location, you must specify a slot"
                )

    @property
    def highest_z(self) -> float:
        """Return the tallest known point on the deck."""
        return self._highest_z

    @property
    def slots(self) -> List[SlotDefV3]:
        """Return the definition of the loaded robot deck."""
        return self._definition["locations"]["orderedSlots"]

    @property
    def calibration_positions(self) -> List[CalibrationPosition]:
        raw_positions = self._definition["locations"]["calibrationPoints"]
        return [
            CalibrationPosition(
                id=raw_position["id"],
                displayName=raw_position["displayName"],
                position=(
                    raw_position["position"][0],
                    raw_position["position"][1],
                    raw_position["position"][2],
                ),
            )
            for raw_position in raw_positions
        ]

    def get_calibration_position(self, id: str) -> CalibrationPosition:
        calibration_position = next(
            (pos for pos in self.calibration_positions if pos.id == id), None
        )
        if not calibration_position:
            pos_ids = [pos.id for pos in self.calibration_positions]
            raise ValueError(
                f"calibration position {id} "
                "could not be found, "
                f"valid calibration position ids are: {pos_ids}"
            )
        return calibration_position

    def get_fixed_trash(self) -> Optional[Union[Labware, LegacyLabwareCore]]:
        fixtures = self._definition["locations"]["fixtures"]
        ft = next((f for f in fixtures if f["id"] == FIXED_TRASH_ID), None)

        # NOTE(mc, 2022-12-06): type ignore below because this `Deck` is typed
        # as contiaining `DeckItem` values, but the contents of slot 12
        # will always be limited to either a `Labware` or `LegacyLabwareCore` object
        return self.data[self._check_name(ft.get("slot"))] if ft else None  # type: ignore[return-value]

    def get_non_fixture_slots(self) -> List[int]:
        fixtures = self._definition["locations"]["fixtures"]
        fixture_slots = {
            self._check_name(f.get("slot")) for f in fixtures if f.get("slot")
        }
        return [s for s in self.data.keys() if s not in fixture_slots]

    @property
    def thermocycler_present(self) -> bool:
        """Is a thermocycler present on the deck."""
        return self._thermocycler_present
