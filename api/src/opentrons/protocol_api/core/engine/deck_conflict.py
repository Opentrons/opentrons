"""A Protocol-Engine-friendly wrapper for opentrons.motion_planning.deck_conflict."""

import itertools
from typing import Collection, Dict, Optional, Tuple, overload

from opentrons.hardware_control.modules.types import ModuleType
from opentrons.motion_planning import deck_conflict as wrapped_deck_conflict
from opentrons.protocol_engine import (
    StateView,
    DeckSlotLocation,
    ModuleLocation,
    OnLabwareLocation,
    AddressableAreaLocation,
    OFF_DECK_LOCATION,
)
from opentrons.protocol_engine.errors.exceptions import LabwareNotLoadedOnModuleError
from opentrons.types import DeckSlotName


@overload
def check(
    *,
    engine_state: StateView,
    existing_labware_ids: Collection[str],
    existing_module_ids: Collection[str],
    new_labware_id: str,
) -> None:
    pass


@overload
def check(
    *,
    engine_state: StateView,
    existing_labware_ids: Collection[str],
    existing_module_ids: Collection[str],
    new_module_id: str,
) -> None:
    pass


def check(
    *,
    engine_state: StateView,
    existing_labware_ids: Collection[str],
    existing_module_ids: Collection[str],
    # TODO(mm, 2023-02-23): This interface is impossible to use correctly. In order
    # to have new_labware_id or new_module_id, the caller needs to have already loaded
    # the new item into Protocol Engine--but then, it's too late to do deck conflict.
    # checking. Find a way to do deck conflict checking before the new item is loaded.
    new_labware_id: Optional[str] = None,
    new_module_id: Optional[str] = None,
) -> None:
    """Check for conflicts between items on the deck.

    This is a Protocol-Engine-friendly wrapper around
    opentrons.motion_planning.deck_conflict.check().

    Params:
        engine_state: An interface to retrieve details about the deck items.
        existing_labware_ids: The Protocol Engine IDs of all labware already loaded.
        existing_module_ids: The Protocol Engine IDs of all modules already loaded.
        new_labware_id: The Protocol Engine ID of a new labware you've just added.
            Mutually exclusive with new_module_id.
        new_module_id: The Protocol EngineID of a new module you've just added.
            Mutually exclusive with new_labware_id.

    Raises:
        opentrons.motion_planning.deck_conflict.DeckConflictError:
            If the newly-added item conflicts with one of the existing items.
    """

    if new_labware_id is not None:
        new_location_and_item = _map_labware(engine_state, new_labware_id)
    if new_module_id is not None:
        new_location_and_item = _map_module(engine_state, new_module_id)

    if new_location_and_item is None:
        # The new item should be excluded from deck conflict checking. Nothing to do.
        return

    new_location, new_item = new_location_and_item

    all_existing_labware = (
        _map_labware(engine_state, labware_id) for labware_id in existing_labware_ids
    )
    mapped_existing_labware = (m for m in all_existing_labware if m is not None)

    all_existing_modules = (
        _map_module(engine_state, module_id) for module_id in existing_module_ids
    )
    mapped_existing_modules = (m for m in all_existing_modules if m is not None)

    existing_items: Dict[DeckSlotName, wrapped_deck_conflict.DeckItem] = {}
    for existing_location, existing_item in itertools.chain(
        mapped_existing_labware, mapped_existing_modules
    ):
        assert existing_location not in existing_items
        existing_items[existing_location] = existing_item

    wrapped_deck_conflict.check(
        existing_items=existing_items,
        new_item=new_item,
        new_location=new_location,
        robot_type=engine_state.config.robot_type,
    )


def _map_labware(
    engine_state: StateView,
    labware_id: str,
) -> Optional[Tuple[DeckSlotName, wrapped_deck_conflict.DeckItem]]:
    location_from_engine = engine_state.labware.get_location(labware_id=labware_id)

    if isinstance(location_from_engine, AddressableAreaLocation):
        # TODO need to deal with staging slots, which will raise the value error we are returning None with below
        try:
            deck_slot = DeckSlotName.from_primitive(
                location_from_engine.addressableAreaName
            )
        except ValueError:
            return None
        location_from_engine = DeckSlotLocation(slotName=deck_slot)

    if isinstance(location_from_engine, DeckSlotLocation):
        # This labware is loaded directly into a deck slot.
        # Map it to a wrapped_deck_conflict.Labware.
        return (
            location_from_engine.slotName,
            wrapped_deck_conflict.Labware(
                name_for_errors=engine_state.labware.get_load_name(
                    labware_id=labware_id
                ),
                highest_z=engine_state.geometry.get_labware_highest_z(
                    labware_id=labware_id
                ),
                uri=engine_state.labware.get_definition_uri(labware_id=labware_id),
                is_fixed_trash=engine_state.labware.is_fixed_trash(
                    labware_id=labware_id
                ),
            ),
        )

    elif isinstance(location_from_engine, ModuleLocation):
        # This labware is loaded atop a module. Don't map it to anything here;
        # let _map_module() pick it up.
        return None

    elif isinstance(location_from_engine, OnLabwareLocation):
        # TODO(jbl 2023-06-08) check if we need to do any logic here or if this is correct
        return None

    elif location_from_engine == OFF_DECK_LOCATION:
        # This labware is off-deck. Exclude it from conflict checking.
        # todo(mm, 2023-02-23): Move this logic into wrapped_deck_conflict.
        return None


def _map_module(
    engine_state: StateView,
    module_id: str,
) -> Optional[Tuple[DeckSlotName, wrapped_deck_conflict.DeckItem]]:
    module_model = engine_state.modules.get_connected_model(module_id=module_id)
    module_type = module_model.as_type()
    mapped_location = engine_state.modules.get_location(module_id=module_id).slotName

    # Use the module model (e.g. "temperatureModuleV1") as the name for error messages
    # because it's convenient for us. Unfortunately, this won't necessarily match
    # the string that the Python protocol author used to load the module.
    name_for_errors = module_model.value

    highest_z_including_labware = _get_module_highest_z_including_labware(
        engine_state=engine_state,
        module_id=module_id,
    )

    if module_type == ModuleType.HEATER_SHAKER:
        return (
            mapped_location,
            wrapped_deck_conflict.HeaterShakerModule(
                name_for_errors=name_for_errors,
                highest_z_including_labware=highest_z_including_labware,
            ),
        )
    elif module_type == ModuleType.THERMOCYCLER:
        return (
            mapped_location,
            wrapped_deck_conflict.ThermocyclerModule(
                name_for_errors=name_for_errors,
                highest_z_including_labware=highest_z_including_labware,
                # Python Protocol API >=v2.14 never allows loading a Thermocycler in
                # its semi configuration.
                is_semi_configuration=False,
            ),
        )
    else:
        return (
            mapped_location,
            wrapped_deck_conflict.OtherModule(
                name_for_errors=name_for_errors,
                highest_z_including_labware=highest_z_including_labware,
            ),
        )


def _deck_slot_to_int(deck_slot_location: DeckSlotLocation) -> int:
    return deck_slot_location.slotName.as_int()


def _get_module_highest_z_including_labware(
    engine_state: StateView, module_id: str
) -> float:
    try:
        labware_id = engine_state.labware.get_id_by_module(module_id=module_id)
    except LabwareNotLoadedOnModuleError:
        # No labware is loaded atop this module.
        # The height should be just the module itself.
        return engine_state.modules.get_overall_height(module_id=module_id)
    else:
        # This module has a labware loaded atop it. The height should include both.
        return engine_state.geometry.get_labware_highest_z(labware_id=labware_id)
