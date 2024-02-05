"""A Protocol-Engine-friendly wrapper for opentrons.motion_planning.deck_conflict."""
from __future__ import annotations
import itertools
import logging
from typing import Collection, Dict, Optional, Tuple, overload, Union, TYPE_CHECKING

from opentrons_shared_data.errors.exceptions import MotionPlanningFailureError

from opentrons.hardware_control.nozzle_manager import NozzleConfigurationType
from opentrons.hardware_control.modules.types import ModuleType
from opentrons.motion_planning import deck_conflict as wrapped_deck_conflict
from opentrons.motion_planning.adjacent_slots_getters import (
    get_north_slot,
    get_west_slot,
    get_east_slot,
    get_south_slot,
)
from opentrons.protocol_engine import (
    StateView,
    DeckSlotLocation,
    ModuleLocation,
    OnLabwareLocation,
    AddressableAreaLocation,
    OFF_DECK_LOCATION,
    WellLocation,
    DropTipWellLocation,
)
from opentrons.protocol_engine.errors.exceptions import LabwareNotLoadedOnModuleError
from opentrons.types import DeckSlotName, StagingSlotName, Point
from ..._trash_bin import TrashBin
from ..._waste_chute import WasteChute

if TYPE_CHECKING:
    from ...labware import Labware


class PartialTipMovementNotAllowedError(MotionPlanningFailureError):
    """Error raised when trying to perform a partial tip movement to an illegal location."""

    def __init__(self, message: str) -> None:
        super().__init__(
            message=message,
        )


class UnsuitableTiprackForPipetteMotion(MotionPlanningFailureError):
    """Error raised when trying to perform a pipette movement to a tip rack, based on adapter status."""

    def __init__(self, message: str) -> None:
        super().__init__(
            message=message,
        )


_log = logging.getLogger(__name__)

# TODO (spp, 2023-12-06): move this to a location like motion planning where we can
#  derive these values from geometry definitions
#  Also, verify y-axis extents values for the nozzle columns.
# Bounding box measurements
A12_column_front_left_bound = Point(x=-11.03, y=2)
A12_column_back_right_bound = Point(x=526.77, y=506.2)

_NOZZLE_PITCH = 9
A1_column_front_left_bound = Point(
    x=A12_column_front_left_bound.x - _NOZZLE_PITCH * 11, y=2
)
A1_column_back_right_bound = Point(
    x=A12_column_back_right_bound.x - _NOZZLE_PITCH * 11, y=506.2
)

# Arbitrary safety margin in z-direction
Z_SAFETY_MARGIN = 10


@overload
def check(
    *,
    engine_state: StateView,
    existing_labware_ids: Collection[str],
    existing_module_ids: Collection[str],
    existing_disposal_locations: Collection[Union[Labware, WasteChute, TrashBin]],
    new_labware_id: str,
) -> None:
    pass


@overload
def check(
    *,
    engine_state: StateView,
    existing_labware_ids: Collection[str],
    existing_module_ids: Collection[str],
    existing_disposal_locations: Collection[Union[Labware, WasteChute, TrashBin]],
    new_module_id: str,
) -> None:
    pass


@overload
def check(
    *,
    engine_state: StateView,
    existing_labware_ids: Collection[str],
    existing_module_ids: Collection[str],
    existing_disposal_locations: Collection[Union[Labware, WasteChute, TrashBin]],
    new_trash_bin: TrashBin,
) -> None:
    pass


def check(
    *,
    engine_state: StateView,
    existing_labware_ids: Collection[str],
    existing_module_ids: Collection[str],
    existing_disposal_locations: Collection[Union[Labware, WasteChute, TrashBin]],
    # TODO(mm, 2023-02-23): This interface is impossible to use correctly. In order
    # to have new_labware_id or new_module_id, the caller needs to have already loaded
    # the new item into Protocol Engine--but then, it's too late to do deck conflict.
    # checking. Find a way to do deck conflict checking before the new item is loaded.
    new_labware_id: Optional[str] = None,
    new_module_id: Optional[str] = None,
    new_trash_bin: Optional[TrashBin] = None,
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
    if new_trash_bin is not None:
        new_location_and_item = _map_disposal_location(new_trash_bin)

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

    all_exisiting_disposal_locations = (
        _map_disposal_location(disposal_location)
        for disposal_location in existing_disposal_locations
    )
    mapped_disposal_locations = (
        m for m in all_exisiting_disposal_locations if m is not None
    )

    existing_items: Dict[
        Union[DeckSlotName, StagingSlotName], wrapped_deck_conflict.DeckItem
    ] = {}
    for existing_location, existing_item in itertools.chain(
        mapped_existing_labware, mapped_existing_modules, mapped_disposal_locations
    ):
        assert existing_location not in existing_items
        existing_items[existing_location] = existing_item

    wrapped_deck_conflict.check(
        existing_items=existing_items,
        new_item=new_item,
        new_location=new_location,
        robot_type=engine_state.config.robot_type,
    )


def check_safe_for_pipette_movement(
    engine_state: StateView,
    pipette_id: str,
    labware_id: str,
    well_name: str,
    well_location: Union[WellLocation, DropTipWellLocation],
) -> None:
    """Check if the labware is safe to move to with a pipette in partial tip configuration.
    Args:
        engine_state: engine state view
        pipette_id: ID of the pipette to be moved
        labware_id: ID of the labware we are moving to
        well_name: Name of the well to move to
        well_location: exact location within the well to move to
    """
    # TODO: either hide unsupported configurations behind an advance setting
    #  or log a warning that deck conflicts cannot be checked for tip config other than
    #  column config with A12 primary nozzle for the 96 channel
    #  or single tip config for 8-channel.
    if engine_state.pipettes.get_channels(pipette_id) == 96:
        _check_deck_conflict_for_96_channel(
            engine_state=engine_state,
            pipette_id=pipette_id,
            labware_id=labware_id,
            well_name=well_name,
            well_location=well_location,
        )
    elif engine_state.pipettes.get_channels(pipette_id) == 8:
        _check_deck_conflict_for_8_channel(
            engine_state=engine_state,
            pipette_id=pipette_id,
            labware_id=labware_id,
            well_name=well_name,
            well_location=well_location,
        )


def check_safe_for_tip_pickup_and_return(
    engine_state: StateView,
    pipette_id: str,
    labware_id: str,
) -> None:
    """Check if the presence or absence of a tiprack adapter might cause any pipette movement issues.

    A 96 channel pipette will pick up tips using cam action when it's configured
    to use ALL nozzles. For this, the tiprack needs to be on the Flex 96 channel tiprack adapter
    or similar or the tips will not be picked up.

    On the other hand, if the pipette is configured with partial nozzle configuration,
    it uses the usual pipette presses to pick the tips up, in which case, having the tiprack
    on the Flex 96 channel tiprack adapter (or similar) will cause the pipette to
    crash against the adapter posts.

    In order to check if the 96-channel can move and pickup/drop tips safely, this method
    checks for the height attribute of the tiprack adapter rather than checking for the
    specific official adapter since users might create custom labware &/or definitions
    compatible with the official adapter.
    """
    if not engine_state.pipettes.get_channels(pipette_id) == 96:
        # Adapters only matter to 96 ch.
        return

    is_partial_config = engine_state.pipettes.get_is_partially_configured(pipette_id)
    tiprack_name = engine_state.labware.get_display_name(labware_id)
    tiprack_parent = engine_state.labware.get_location(labware_id)
    if isinstance(tiprack_parent, OnLabwareLocation):  # tiprack is on an adapter
        is_96_ch_tiprack_adapter = engine_state.labware.get_has_quirk(
            labware_id=tiprack_parent.labwareId, quirk="tiprackAdapterFor96Channel"
        )
        tiprack_height = engine_state.labware.get_dimensions(labware_id).z
        adapter_height = engine_state.labware.get_dimensions(tiprack_parent.labwareId).z
        if is_partial_config and tiprack_height < adapter_height:
            raise PartialTipMovementNotAllowedError(
                f"{tiprack_name} cannot be on an adapter taller than the tip rack"
                f" when picking up fewer than 96 tips."
            )
        elif not is_partial_config and not is_96_ch_tiprack_adapter:
            raise UnsuitableTiprackForPipetteMotion(
                f"{tiprack_name} must be on an Opentrons Flex 96 Tip Rack Adapter"
                f" in order to pick up or return all 96 tips simultaneously."
            )

    elif (
        not is_partial_config
    ):  # tiprack is not on adapter and pipette is in full config
        raise UnsuitableTiprackForPipetteMotion(
            f"{tiprack_name} must be on an Opentrons Flex 96 Tip Rack Adapter"
            f" in order to pick up or return all 96 tips simultaneously."
        )


def _check_deck_conflict_for_96_channel(  # noqa: C901
    engine_state: StateView,
    pipette_id: str,
    labware_id: str,
    well_name: str,
    well_location: Union[WellLocation, DropTipWellLocation],
) -> None:
    """Check if there are any conflicts moving to the given labware with the configuration of 96-ch pipette."""
    if not (
        engine_state.pipettes.get_nozzle_layout_type(pipette_id)
        == NozzleConfigurationType.COLUMN
    ):
        # Checking deck conflicts only for column config
        return

    if isinstance(well_location, DropTipWellLocation):
        # convert to WellLocation
        well_location = engine_state.geometry.get_checked_tip_drop_location(
            pipette_id=pipette_id,
            labware_id=labware_id,
            well_location=well_location,
            partially_configured=True,
        )

    well_location_point = engine_state.geometry.get_well_position(
        labware_id=labware_id, well_name=well_name, well_location=well_location
    )
    primary_nozzle = engine_state.pipettes.get_primary_nozzle(pipette_id)

    if not _is_within_pipette_extents(
        engine_state=engine_state, pipette_id=pipette_id, location=well_location_point
    ):
        raise PartialTipMovementNotAllowedError(
            f"Requested motion with the {primary_nozzle} nozzle column configuration"
            f" is outside of robot bounds for the 96-channel."
        )

    labware_slot = engine_state.geometry.get_ancestor_slot_name(labware_id)

    destination_slot_num = labware_slot.as_int()
    adjacent_slot_num = None
    # TODO (spp, 2023-12-18): change this eventually to "column 1"/"column 12"
    #  via the column mappings in the pipette geometry definitions.
    # if we are handling commands in the trash or in the waste chute, skip these checks
    if primary_nozzle == "A12":
        adjacent_slot_num = get_west_slot(destination_slot_num)
    elif primary_nozzle == "A1":
        adjacent_slot_num = get_east_slot(destination_slot_num)

    def _check_conflict_with_slot_item(
        adjacent_slot: DeckSlotName,
    ) -> None:
        """Raises error if the pipette is expected to collide with adjacent slot items."""
        slot_highest_z = engine_state.geometry.get_highest_z_in_slot(
            DeckSlotLocation(slotName=adjacent_slot)
        )

        pipette_tip = engine_state.pipettes.get_attached_tip(pipette_id)
        tip_length = pipette_tip.length if pipette_tip else 0.0

        if slot_highest_z + Z_SAFETY_MARGIN > well_location_point.z + tip_length:
            raise PartialTipMovementNotAllowedError(
                f"Moving to {engine_state.labware.get_display_name(labware_id)} in slot"
                f" {labware_slot} with pipette column {primary_nozzle} nozzle configuration"
                f" will result in collision with items in deck slot {adjacent_slot}."
            )

    if adjacent_slot_num is None:
        return
    _check_conflict_with_slot_item(
        adjacent_slot=DeckSlotName.from_primitive(
            adjacent_slot_num
        ).to_equivalent_for_robot_type(engine_state.config.robot_type)
    )


def _check_deck_conflict_for_8_channel(
    engine_state: StateView,
    pipette_id: str,
    labware_id: str,
    well_name: str,
    well_location: Union[WellLocation, DropTipWellLocation],
) -> None:
    """Check if there are any conflicts moving to the given labware with the configuration of 8-ch pipette."""
    if not (
        engine_state.pipettes.get_nozzle_layout_type(pipette_id)
        == NozzleConfigurationType.SINGLE
    ):
        # Checking deck conflicts only for single tip config
        return

    if isinstance(well_location, DropTipWellLocation):
        # convert to WellLocation
        well_location = engine_state.geometry.get_checked_tip_drop_location(
            pipette_id=pipette_id,
            labware_id=labware_id,
            well_location=well_location,
            partially_configured=True,
        )

    well_location_point = engine_state.geometry.get_well_position(
        labware_id=labware_id, well_name=well_name, well_location=well_location
    )
    primary_nozzle = engine_state.pipettes.get_primary_nozzle(pipette_id)

    if not _is_within_pipette_extents(
        engine_state=engine_state, pipette_id=pipette_id, location=well_location_point
    ):
        # WARNING: (spp, 2023-11-30: this needs to be wired up to check for
        # 8-channel pipette extents on both OT2 & Flex!!)
        raise PartialTipMovementNotAllowedError(
            f"Requested motion with single {primary_nozzle} nozzle configuration"
            f" is outside of robot bounds for the 8-channel."
        )

    labware_slot = engine_state.geometry.get_ancestor_slot_name(labware_id)
    destination_slot = labware_slot.as_int()
    adjacent_slot_num = None
    # TODO (spp, 2023-12-18): change this eventually to use nozzles from mappings in
    #  the pipette geometry definitions.
    if primary_nozzle == "H1":
        adjacent_slot_num = get_north_slot(destination_slot)
    elif primary_nozzle == "A1":
        adjacent_slot_num = get_south_slot(destination_slot)

    def _check_conflict_with_slot_item(adjacent_slot: DeckSlotName) -> None:
        slot_highest_z = engine_state.geometry.get_highest_z_in_slot(
            DeckSlotLocation(slotName=adjacent_slot)
        )

        pipette_tip = engine_state.pipettes.get_attached_tip(pipette_id)
        tip_length = pipette_tip.length if pipette_tip else 0.0

        if slot_highest_z + Z_SAFETY_MARGIN > well_location_point.z + tip_length:
            raise PartialTipMovementNotAllowedError(
                f"Moving to {engine_state.labware.get_display_name(labware_id)} in slot"
                f" {labware_slot} with pipette nozzle {primary_nozzle} configuration"
                f" will result in collision with items in deck slot {adjacent_slot}."
            )

    if adjacent_slot_num is None:
        return
    _check_conflict_with_slot_item(
        adjacent_slot=DeckSlotName.from_primitive(
            adjacent_slot_num
        ).to_equivalent_for_robot_type(engine_state.config.robot_type)
    )


def _is_within_pipette_extents(
    engine_state: StateView,
    pipette_id: str,
    location: Point,
) -> bool:
    """Whether a given point is within the extents of a configured pipette on the specified robot."""
    robot_type = engine_state.config.robot_type
    pipette_channels = engine_state.pipettes.get_channels(pipette_id)
    nozzle_config = engine_state.pipettes.get_nozzle_layout_type(pipette_id)
    primary_nozzle = engine_state.pipettes.get_primary_nozzle(pipette_id)
    if robot_type == "OT-3 Standard":
        if pipette_channels == 96 and nozzle_config == NozzleConfigurationType.COLUMN:
            # TODO (spp, 2023-12-18): change this eventually to use column mappings in
            #  the pipette geometry definitions.
            if primary_nozzle == "A12":
                return (
                    A12_column_front_left_bound.x
                    <= location.x
                    <= A12_column_back_right_bound.x
                    and A12_column_front_left_bound.y
                    <= location.y
                    <= A12_column_back_right_bound.y
                )
            elif primary_nozzle == "A1":
                return (
                    A1_column_front_left_bound.x
                    <= location.x
                    <= A1_column_back_right_bound.x
                    and A1_column_front_left_bound.y
                    <= location.y
                    <= A1_column_back_right_bound.y
                )
    # TODO (spp, 2023-11-07): check for 8-channel nozzle A1 & H1 extents on Flex & OT2
    return True


def _map_labware(
    engine_state: StateView,
    labware_id: str,
) -> Optional[
    Tuple[Union[DeckSlotName, StagingSlotName], wrapped_deck_conflict.DeckItem]
]:
    location_from_engine = engine_state.labware.get_location(labware_id=labware_id)

    if isinstance(location_from_engine, AddressableAreaLocation):
        # This will be guaranteed to be either deck slot name or staging slot name
        slot: Union[DeckSlotName, StagingSlotName]
        try:
            slot = DeckSlotName.from_primitive(location_from_engine.addressableAreaName)
        except ValueError:
            slot = StagingSlotName.from_primitive(
                location_from_engine.addressableAreaName
            )
        return (
            slot,
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

    elif isinstance(location_from_engine, DeckSlotLocation):
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
    elif module_type == ModuleType.MAGNETIC_BLOCK:
        return (
            mapped_location,
            wrapped_deck_conflict.MagneticBlockModule(
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


def _map_disposal_location(
    disposal_location: Union[Labware, WasteChute, TrashBin],
) -> Optional[Tuple[DeckSlotName, wrapped_deck_conflict.DeckItem]]:
    if isinstance(disposal_location, TrashBin):
        return (
            disposal_location.location,
            wrapped_deck_conflict.TrashBin(name_for_errors="trash bin"),
        )
    else:
        return None


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
