"""Geometry state getters."""

from dataclasses import dataclass
from functools import cached_property
from logging import getLogger
from typing import Dict, List, Optional, Set, Tuple, TypeVar, Union

from numpy import array, dot
from numpy import double as npdouble
from numpy.typing import NDArray

from opentrons_shared_data.deck.types import CutoutFixture
from opentrons_shared_data.labware.constants import WELL_NAME_PATTERN
from opentrons_shared_data.labware.labware_definition import (
    LabwareDefinition,
    LabwareDefinition2,
    LabwareDefinition3,
)
from opentrons_shared_data.pipette.types import LabwareUri

from .. import errors
from ..errors import (
    InvalidLabwarePositionError,
    LabwareNotLoadedError,
    LabwareNotLoadedOnLabwareError,
    LabwareNotLoadedOnModuleError,
    LabwareNotOnDeckError,
)
from ..resources import (
    deck_configuration_provider,
    fixture_validation,
)
from ..types import (
    OFF_DECK_LOCATION,
    SYSTEM_LOCATION,
    WASTE_CHUTE_LOCATION,
    AccessibleByGripperLocation,
    AddressableArea,
    AddressableAreaLocation,
    AreaType,
    CurrentPipetteLocation,
    CurrentWell,
    DeckSlotLocation,
    GripperMoveType,
    InStackerHopperLocation,
    LabwareLocation,
    LabwareLocationSequence,
    LabwareOffsetLocationSequence,
    LoadedLabware,
    LoadedModule,
    ModuleLocation,
    ModuleModel,
    ModuleOffsetData,
    NotOnDeckLocationSequenceComponent,
    OnAddressableAreaLocationSequenceComponent,
    OnAddressableAreaOffsetLocationSequenceComponent,
    OnCutoutFixtureLocationSequenceComponent,
    OnLabwareLocation,
    OnLabwareLocationSequenceComponent,
    OnLabwareOffsetLocationSequenceComponent,
    OnModuleLocationSequenceComponent,
    OnModuleOffsetLocationSequenceComponent,
    PickUpTipWellLocation,
    PotentialCutoutFixture,
    StagingSlotLocation,
    WellLocation,
    WellOrigin,
    labware_location_is_off_deck,
    labware_location_is_system,
)
from .addressable_areas import AddressableAreaView
from .config import Config
from .containment_utils import is_fully_contained
from .labware import LabwareView
from .labware_origin_math.stackup_origin_to_labware_origin import (
    LabwareOriginContext,
    LabwareStackupAncestorDefinition,
    get_stackup_origin_to_labware_origin,
)
from .modules import ModuleView
from .pipettes import PipetteView
from .wells import WellView
from opentrons.motion_planning.adjacent_slots_getters import get_north_south_slots
from opentrons.types import (
    DeckSlotName,
    ModuleFixtureLocation,
    MountType,
    Point,
    StagingSlotName,
)

_LOG = getLogger(__name__)


@dataclass
class _AbsoluteRobotExtents:
    front_left: Dict[MountType, Point]
    back_right: Dict[MountType, Point]
    deck_extents: Point
    padding_rear: float
    padding_front: float
    padding_left_side: float
    padding_right_side: float


_LabwareLocation = TypeVar("_LabwareLocation", bound=LabwareLocation)


# TODO(mc, 2021-06-03): continue evaluation of which selectors should go here
# vs which selectors should be in LabwareView
class GeometryView:
    """Geometry computed state getters."""

    def __init__(
        self,
        config: Config,
        labware_view: LabwareView,
        well_view: WellView,
        module_view: ModuleView,
        pipette_view: PipetteView,
        addressable_area_view: AddressableAreaView,
    ) -> None:
        """Initialize a GeometryView instance."""
        self._config = config
        self._labware = labware_view
        self._wells = well_view
        self._modules = module_view
        self._pipettes = pipette_view
        self._addressable_areas = addressable_area_view

    @cached_property
    def absolute_deck_extents(self) -> _AbsoluteRobotExtents:
        """The absolute deck extents for a given robot deck."""
        left_offset = self._addressable_areas.mount_offsets["left"]
        right_offset = self._addressable_areas.mount_offsets["right"]

        front_left_abs = {
            MountType.LEFT: Point(left_offset.x, -1 * left_offset.y, left_offset.z),
            MountType.RIGHT: Point(right_offset.x, -1 * right_offset.y, right_offset.z),
        }
        back_right_abs = {
            MountType.LEFT: self._addressable_areas.deck_extents + left_offset,
            MountType.RIGHT: self._addressable_areas.deck_extents + right_offset,
        }
        return _AbsoluteRobotExtents(
            front_left=front_left_abs,
            back_right=back_right_abs,
            deck_extents=self._addressable_areas.deck_extents,
            padding_rear=self._addressable_areas.padding_offsets["rear"],
            padding_front=self._addressable_areas.padding_offsets["front"],
            padding_left_side=self._addressable_areas.padding_offsets["left_side"],
            padding_right_side=self._addressable_areas.padding_offsets["right_side"],
        )

    def get_labware_highest_z(self, labware_id: str) -> float:
        """Get the highest Z-point of a labware."""
        labware_data = self._labware.get(labware_id)
        return self._get_highest_z_from_labware_data(labware_data)

    def _is_obstacle_labware(self, labware_id: str) -> bool:
        """Check if the labware is a deck obstacle."""
        for loc in self.get_location_sequence(labware_id):
            if isinstance(loc, InStackerHopperLocation) or isinstance(
                loc, NotOnDeckLocationSequenceComponent
            ):
                return False
        return True

    def _get_tallest_obstacle_labware(self) -> float:
        """Get the highest Z-point of all labware on the deck."""
        return max(
            (
                self._get_highest_z_from_labware_data(lw_data)
                for lw_data in self._labware.get_all()
                if self._is_obstacle_labware(lw_data.id)
            ),
            default=0.0,
        )

    def _get_tallest_obstacle_module(self) -> float:
        """Get the highest Z-point of all modules on the deck."""
        return max(
            (
                self._modules.get_module_highest_z(module.id, self._addressable_areas)
                for module in self._modules.get_all()
            ),
            default=0.0,
        )

    def _get_tallest_obstacle_fixture(self) -> float:
        """Get the highest Z-point of all fixtures on the deck."""
        all_fixtures = self._addressable_areas.get_all_cutout_fixtures()
        if all_fixtures is None:
            # We're using a simulated deck config (see `Config.use_simulated_deck_config`).
            # We only know the addressable areas referenced by the protocol, not the fixtures
            # providing them. And there is more than one possible configuration of fixtures
            # to provide them. So, we can't know what the highest fixture is. Default to 0.
            #
            # Defaulting to 0 may not be the right thing to do here.
            # For example, suppose a protocol references an addressable area that implies a tall
            # fixture must be on the deck, and then it uses long tips that wouldn't be able to
            # clear the top of that fixture. We should perhaps raise an analysis error for that,
            # but defaulting to 0 here means we won't.
            return 0.0
        return max(
            (
                self._addressable_areas.get_fixture_height(cutout_fixture_name)
                for cutout_fixture_name in all_fixtures
            ),
            default=0.0,
        )

    def get_all_obstacle_highest_z(self) -> float:
        """Get the highest Z-point across all obstacles that the instruments need to fly over."""
        return max(
            self._get_tallest_obstacle_labware(),
            self._get_tallest_obstacle_module(),
            self._get_tallest_obstacle_fixture(),
        )

    def get_highest_z_in_slot(
        self, slot: Union[DeckSlotLocation, StagingSlotLocation]
    ) -> float:
        """Get the highest Z-point of all items stacked in the given deck slot.

        This height includes the height of any module that occupies the given slot
        even if it wasn't loaded in that slot (e.g., thermocycler).
        """
        slot_item = self.get_slot_item(slot.slotName)
        if isinstance(slot_item, LoadedModule):
            # get height of module + all labware on it
            module_id = slot_item.id
            try:
                labware_id = self._labware.get_id_by_module(module_id=module_id)
            except LabwareNotLoadedOnModuleError:
                # For the time being we will ignore column 4 modules in this check to avoid conflating results
                if self._modules.is_column_4_module(slot_item.model) is False:
                    return self._modules.get_module_highest_z(
                        module_id=module_id,
                        addressable_areas=self._addressable_areas,
                    )
            else:
                # For the time being we will ignore column 4 modules in this check to avoid conflating results
                if self._modules.is_column_4_module(slot_item.model) is False:
                    return self.get_highest_z_of_labware_stack(labware_id)
            # todo (cb, 2025-09-15): For now we skip column 4 modules and handle them seperately in
            # get_highest_z_of_column_4_module, so this will return 0. In the future we may want to consolidate
            # this to make it more apparently at this point in the query process.
            return 0
        elif isinstance(slot_item, LoadedLabware):
            # get stacked heights of all labware in the slot
            return self.get_highest_z_of_labware_stack(slot_item.id)
        elif type(slot_item) is dict:
            # TODO (cb, 2024-02-05): Eventually this logic should become the responsibility of bounding box
            # conflict checking, as fixtures may not always be considered as items from slots.
            return self._addressable_areas.get_fixture_height(slot_item["id"])
        else:
            return 0

    def get_highest_z_of_labware_stack(self, labware_id: str) -> float:
        """Get the highest Z-point of the topmost labware in the stack of labware on the given labware.

        If there is no labware on the given labware, returns highest z of the given labware.
        """
        try:
            stacked_labware_id = self._labware.get_id_by_labware(labware_id)
        except LabwareNotLoadedOnLabwareError:
            return self.get_labware_highest_z(labware_id)
        return self.get_highest_z_of_labware_stack(stacked_labware_id)

    def get_highest_z_of_column_4_module(self, module: LoadedModule) -> float:
        """Get the highest Z-point of the topmost labware in the stack of labware on the given column 4 module.

        If there is no labware on the given module, returns highest z of the module.
        """
        if self._modules.is_column_4_module(module.model):
            try:
                labware_id = self._labware.get_id_by_module(module_id=module.id)
            except LabwareNotLoadedOnModuleError:
                return self._modules.get_module_highest_z(
                    module_id=module.id,
                    addressable_areas=self._addressable_areas,
                )
            else:
                return self.get_highest_z_of_labware_stack(labware_id)
        else:
            raise ValueError(
                "Module must be a Column 4 Module to determine maximum z height."
            )

    def get_min_travel_z(
        self,
        pipette_id: str,
        labware_id: str,
        location: Optional[CurrentPipetteLocation],
        minimum_z_height: Optional[float],
    ) -> float:
        """Get the minimum allowed travel height of an arc move."""
        if (
            isinstance(location, CurrentWell)
            and pipette_id == location.pipette_id
            and labware_id == location.labware_id
        ):
            min_travel_z = self.get_labware_highest_z(labware_id)
        else:
            min_travel_z = self.get_all_obstacle_highest_z()
        if minimum_z_height:
            min_travel_z = max(min_travel_z, minimum_z_height)
        return min_travel_z

    def _normalize_module_calibration_offset(
        self,
        module_location: DeckSlotLocation,
        offset_data: Optional[ModuleOffsetData],
    ) -> Point:
        """Normalize the module calibration offset depending on the module location."""
        if not offset_data:
            return Point(x=0, y=0, z=0)
        offset = Point.from_xyz_attrs(offset_data.moduleOffsetVector)
        calibrated_slot = offset_data.location.slotName
        calibrated_slot_column = self.get_slot_column(calibrated_slot)
        current_slot_column = self.get_slot_column(module_location.slotName)
        # make sure that we have valid colums since we cant have modules in the middle of the deck
        assert set([calibrated_slot_column, current_slot_column]).issubset({1, 3}), (
            f"Module calibration offset is an invalid slot {calibrated_slot}"
        )

        # Check if the module has moved from one side of the deck to the other
        if calibrated_slot_column != current_slot_column:
            # Since the module was rotated, the calibration offset vector needs to be rotated by 180 degrees along the z axis
            saved_offset: NDArray[npdouble] = array([offset.x, offset.y, offset.z])
            rotation_matrix: NDArray[npdouble] = array(
                [[-1, 0, 0], [0, -1, 0], [0, 0, 1]]
            )
            new_offset = dot(saved_offset, rotation_matrix)
            offset = Point(x=new_offset[0], y=new_offset[1], z=new_offset[2])
        return offset

    def _get_calibrated_module_offset(self, location: LabwareLocation) -> Point:
        """Get a labware location's underlying calibrated module offset, if it is on a module."""
        if isinstance(location, ModuleLocation):
            module_id = location.moduleId
            module_location = self._modules.get_location(module_id)
            offset_data = self._modules.get_module_calibration_offset(module_id)
            return self._normalize_module_calibration_offset(
                module_location, offset_data
            )
        elif isinstance(
            location, (DeckSlotLocation, AddressableAreaLocation, ModuleFixtureLocation)
        ):
            # TODO we might want to do a check here to make sure addressable area location is a standard deck slot
            #   and raise if its not (or maybe we don't actually care since modules will never be loaded elsewhere)
            return Point(x=0, y=0, z=0)
        elif isinstance(location, OnLabwareLocation):
            labware_data = self._labware.get(location.labwareId)
            return self._get_calibrated_module_offset(labware_data.location)
        elif (
            location == OFF_DECK_LOCATION
            or location == SYSTEM_LOCATION
            or isinstance(location, InStackerHopperLocation)
        ):
            raise errors.LabwareNotOnDeckError(
                "Labware does not have a slot or module associated with it"
                " since it is no longer on the deck."
            )
        elif location == WASTE_CHUTE_LOCATION:
            raise errors.LabwareNotOnDeckError(
                "Labware does not have a slot or module associated with it"
                " since it is in the waste chute."
            )

    def get_labware_origin_position(self, labware_id: str) -> Point:
        """Get the deck coordinates of a labware's origin.

        This includes module calibration but excludes the calibration of the given labware.
        """
        location = self._labware.get(labware_id).location
        definition = self._labware.get_definition(labware_id)
        aa_name = self._get_underlying_addressable_area_name(location)
        # TODO(jh, 08-18-25): Labware locations return the underlying slot as the "on location" for the fixed trash,
        #  but the underlying slot's name does not exist in addressable area state. Getting the addressable area from data is
        #  a workaround. Investigate further.
        addressable_area = self._addressable_areas._get_addressable_area_from_deck_data(
            aa_name, do_compatibility_check=False
        )
        stackup_lw_defs_locs = self._get_stackup_lw_info_top_to_bottom(
            labware_definition=definition, location=location
        )
        underlying_ancestor_def = self._get_stackup_underlying_ancestor_definition(
            location
        )
        module_parent_to_child_offset = self._get_stackup_module_parent_to_child_offset(
            location
        )

        slot_front_left = self._addressable_areas.get_addressable_area_position(aa_name)
        stackup_origin_to_lw_origin = get_stackup_origin_to_labware_origin(
            context=LabwareOriginContext.PIPETTING,
            stackup_lw_info_top_to_bottom=stackup_lw_defs_locs,
            underlying_ancestor_definition=underlying_ancestor_def,
            module_parent_to_child_offset=module_parent_to_child_offset,
            deck_definition=self._addressable_areas.deck_definition,
            slot_name=addressable_area.base_slot,
        )
        module_cal_offset = self._get_calibrated_module_offset(location)

        return slot_front_left + stackup_origin_to_lw_origin + module_cal_offset

    def _get_stackup_lw_info_top_to_bottom(
        self, labware_definition: LabwareDefinition, location: LabwareLocation
    ) -> list[tuple[LabwareDefinition, LabwareLocation]]:
        """Returns info about each labware in the stackup.

        The list is ordered from the top labware to the bottom-most labware.
        The first entry will always be the definition and location of the given labware itself.
        """
        definitions_locations_top_to_bottom: list[
            tuple[LabwareDefinition, LabwareLocation]
        ] = []
        current_location = location
        current_definition = labware_definition

        while True:
            definitions_locations_top_to_bottom.append(
                (current_definition, current_location)
            )

            if isinstance(current_location, OnLabwareLocation):
                current_labware_id = current_location.labwareId
                current_location = self._labware.get(current_labware_id).location
                current_definition = self._labware.get_definition(current_labware_id)
            else:
                break
        return definitions_locations_top_to_bottom

    def _get_stackup_module_parent_to_child_offset(
        self, top_most_lw_location: LabwareLocation
    ) -> Union[Point, None]:
        """Traverse the stackup to find the first parent-to-child module offset, if any."""
        current_location = top_most_lw_location

        while True:
            if isinstance(current_location, ModuleLocation):
                module_parent_to_child_offset = (
                    self._modules.get_nominal_offset_to_child_from_addressable_area(
                        module_id=current_location.moduleId,
                    )
                )
                return module_parent_to_child_offset

            if isinstance(current_location, OnLabwareLocation):
                current_labware_id = current_location.labwareId
                current_labware = self._labware.get(current_labware_id)
                current_location = current_labware.location
            else:
                break

        return None

    def _get_stackup_underlying_ancestor_definition(
        self, top_most_lw_location: LabwareLocation
    ) -> LabwareStackupAncestorDefinition:
        """Traverse the stackup to find the first non-labware definition."""
        current_location = top_most_lw_location
        while True:
            if isinstance(current_location, OnLabwareLocation):
                current_labware_id = current_location.labwareId
                current_labware = self._labware.get(current_labware_id)
                current_location = current_labware.location
            else:
                if isinstance(current_location, ModuleLocation):
                    return self._modules.get_definition(current_location.moduleId)

                elif isinstance(current_location, AddressableAreaLocation):
                    return self._addressable_areas.get_addressable_area(
                        current_location.addressableAreaName
                    )
                elif isinstance(current_location, DeckSlotLocation):
                    return self._addressable_areas.get_slot_definition(
                        current_location.slotName.id
                    )
                elif current_location == WASTE_CHUTE_LOCATION:
                    return self._addressable_areas.get_addressable_area(
                        "gripperWasteChute"
                    )
                else:
                    raise errors.InvalidLabwarePositionError(
                        f"Cannot get ancestor slot of location {current_location}"
                    )

    def _get_underlying_addressable_area_name(self, location: LabwareLocation) -> str:
        if isinstance(location, DeckSlotLocation):
            return location.slotName.id
        elif isinstance(location, AddressableAreaLocation):
            return location.addressableAreaName
        elif isinstance(location, ModuleLocation):
            return self._modules.get_provided_addressable_area(location.moduleId)
        elif isinstance(location, OnLabwareLocation):
            return self.get_ancestor_addressable_area_name(location.labwareId)
        elif location == WASTE_CHUTE_LOCATION:
            return "gripperWasteChute"
        else:
            raise errors.InvalidLabwarePositionError(
                f"Cannot get ancestor slot of location {location}"
            )

    def get_labware_position(self, labware_id: str) -> Point:
        """Get the calibrated origin of the labware."""
        origin_pos = self.get_labware_origin_position(labware_id)
        cal_offset = self._labware.get_labware_offset_vector(labware_id)
        return Point(
            x=origin_pos.x + cal_offset.x,
            y=origin_pos.y + cal_offset.y,
            z=origin_pos.z + cal_offset.z,
        )

    # TODO: Remove this
    def get_well_height(
        self,
        labware_id: str,
        well_name: str,
    ) -> float:
        """Get the height of a specified well for a labware."""
        well_def = self._labware.get_well_definition(labware_id, well_name)
        return well_def.depth

    def _get_highest_z_from_labware_data(self, lw_data: LoadedLabware) -> float:
        if lw_data.location == WASTE_CHUTE_LOCATION:
            # Returns 0 so that the waste chute height is not added to the height of the lbw
            return 0
        labware_pos = self.get_labware_position(lw_data.id)
        z_dim = self._labware.get_dimensions(labware_id=lw_data.id).z
        height_over_labware: float = 0
        if isinstance(lw_data.location, ModuleLocation):
            # Note: when calculating highest z of stacked labware, height-over-labware
            # gets accounted for only if the top labware is directly on the module.
            # So if there's a labware on an adapter on a module, then this
            # over-module-height gets ignored. We currently do not have any modules
            # that use an adapter and has height over labware so this doesn't cause
            # any issues yet. But if we add one in the future then this calculation
            # should be updated.
            module_id = lw_data.location.moduleId
            height_over_labware = self._modules.get_height_over_labware(module_id)
        # todo(mm, 2025-07-31): This math needs updating for schema 2:
        # labware_pos.z is not necessarily the bottom of the labware.
        return labware_pos.z + z_dim + height_over_labware

    # TODO this can be moved?
    def convert_pick_up_tip_well_location(
        self, well_location: PickUpTipWellLocation
    ) -> WellLocation:
        """Convert PickUpTipWellLocation to WellLocation."""
        return WellLocation(
            origin=WellOrigin(well_location.origin.value), offset=well_location.offset
        )

    def get_ancestor_slot_name(
        self, labware_id: str
    ) -> Union[DeckSlotName, StagingSlotName]:
        """Get the slot name of the labware or the module that the labware is on."""
        labware = self._labware.get(labware_id)
        slot_name: Union[DeckSlotName, StagingSlotName]
        if isinstance(labware.location, DeckSlotLocation):
            slot_name = labware.location.slotName
        elif isinstance(labware.location, ModuleLocation):
            module_id = labware.location.moduleId
            slot_name = self._modules.get_location(module_id).slotName
        elif isinstance(labware.location, OnLabwareLocation):
            below_labware_id = labware.location.labwareId
            slot_name = self.get_ancestor_slot_name(below_labware_id)
        elif isinstance(labware.location, AddressableAreaLocation):
            if self._labware.is_absorbance_reader_lid(labware_id):
                raise errors.LocationIsLidDockSlotError(
                    "Cannot get ancestor slot name for labware on lid dock slot."
                )
            slot_name = fixture_validation.get_slot_name_from_addressable_area(
                labware.location.addressableAreaName
            )
        elif labware.location == OFF_DECK_LOCATION:
            raise errors.LabwareNotOnDeckError(
                f"Labware {self._labware.get_display_name(labware_id)} does not have a slot associated with it"
                f" since it is no longer on the deck."
            )
        elif labware.location == WASTE_CHUTE_LOCATION:
            raise errors.LabwareNotOnDeckError(
                f"Labware {self._labware.get_display_name(labware_id)} does not have a slot associated with it"
                f" since it is in the waste chute."
            )
        else:
            _LOG.error(
                f"Unhandled location type in get_ancestor_slot_name: {labware.location}"
            )
            raise errors.InvalidLabwarePositionError(
                f"Cannot get ancestor slot of {self._labware.get_display_name(labware_id)} with location {labware.location}"
            )

        return slot_name

    def get_ancestor_addressable_area_name(self, labware_id: str) -> str:
        """Get the name of the addressable area the labware is eventually on."""
        labware = self._labware.get(labware_id)
        original_display_name = self._labware.get_display_name(labware_id)

        # Track visited IDs to truly detect cycles (A nested on B nested on A)
        seen: Set[str] = set((labware_id,))

        while isinstance(labware.location, OnLabwareLocation):
            parent_id = labware.location.labwareId
            if parent_id in seen:
                raise InvalidLabwarePositionError(
                    f"Cycle detected in labware positioning for {original_display_name}"
                )
            seen.add(parent_id)
            labware = self._labware.get(parent_id)

        # Once we've reached the 'Base' labware of a stack, find the deck anchor
        if isinstance(labware.location, DeckSlotLocation):
            return labware.location.slotName.id

        elif isinstance(labware.location, AddressableAreaLocation):
            return labware.location.addressableAreaName

        elif isinstance(labware.location, ModuleLocation):
            return self._modules.get_provided_addressable_area(
                labware.location.moduleId
            )
        else:
            raise LabwareNotOnDeckError(
                f"Labware {original_display_name} is not loaded on deck",
                details={"eventual-location": repr(labware.location)},
            )

    def get_parent_from_location(self, location: LabwareLocation) -> str:
        """Resolves a LabwareLocation down to its root Addressable Area Name."""
        current_loc = location
        seen: Set[str] = set()

        while isinstance(current_loc, OnLabwareLocation):
            parent_id = current_loc.labwareId
            if parent_id in seen:
                raise InvalidLabwarePositionError(
                    f"Cycle detected in labware positioning at location: {location}"
                )

            seen.add(parent_id)
            parent_labware = self._labware.get(parent_id)
            current_loc = parent_labware.location

        if isinstance(current_loc, DeckSlotLocation):
            return current_loc.slotName.id
        elif isinstance(current_loc, AddressableAreaLocation):
            return current_loc.addressableAreaName
        elif isinstance(current_loc, ModuleFixtureLocation):
            return current_loc.addressable_area_name
        elif isinstance(current_loc, ModuleLocation):
            return self._modules.get_provided_addressable_area(current_loc.moduleId)

        else:
            raise LabwareNotOnDeckError(
                "Provided location is not linked to an addressable area on the deck.",
                details={"terminal-location": repr(current_loc)},
            )

    def get_north_south_neighbors(
        self, location: LabwareLocation
    ) -> List[LoadedLabware]:
        """Return loaded labware whose ancestor slot is north or south of this location."""
        try:
            parent = self.get_parent_from_location(location)
            slot = fixture_validation.get_slot_name_from_addressable_area(parent)
        except (LabwareNotOnDeckError, ValueError):
            return []
        if not isinstance(slot, DeckSlotName):
            return []
        neighbor_ints = set(get_north_south_slots(slot.to_ot3_equivalent().as_int()))
        neighbors: List[LoadedLabware] = []
        for labware in self._labware.get_all():
            try:
                ancestor = self.get_ancestor_slot_name(labware.id)
            except (
                LabwareNotOnDeckError,
                InvalidLabwarePositionError,
                errors.LocationIsLidDockSlotError,
            ):
                continue
            if not isinstance(ancestor, DeckSlotName):
                continue
            if ancestor.to_ot3_equivalent().as_int() in neighbor_ints:
                neighbors.append(labware)
        return neighbors

    def ensure_location_not_occupied(  # noqa: C901
        self,
        location: _LabwareLocation,
        desired_addressable_area: Optional[str] = None,
        labware_definition: Optional[LabwareDefinition] = None,
    ) -> _LabwareLocation:
        """Ensure that the location does not already have either Labware or a Module in it."""
        # Collect set of existing fixtures, if any
        existing_fixtures = self._get_potential_fixtures_for_location_occupation(
            location
        )
        potential_fixtures = (
            self._get_potential_fixtures_for_location_occupation(
                AddressableAreaLocation(addressableAreaName=desired_addressable_area)
            )
            if desired_addressable_area is not None
            else None
        )

        # Handle the checking conflict on an incoming fixture
        if potential_fixtures is not None and isinstance(location, DeckSlotLocation):
            if (
                existing_fixtures is not None
                and not any(
                    location.slotName.id in fixture.provided_addressable_areas
                    for fixture in potential_fixtures[1].intersection(
                        existing_fixtures[1]
                    )
                )
            ) or (
                self._labware.get_by_slot(location.slotName) is not None
                and not any(
                    location.slotName.id in fixture.provided_addressable_areas
                    for fixture in potential_fixtures[1]
                )
            ):
                self._labware.raise_if_labware_in_location(location)
            else:
                self._modules.raise_if_module_in_location(location)

        # Otherwise handle standard conflict checking
        else:
            if isinstance(
                location,
                (
                    DeckSlotLocation,
                    ModuleLocation,
                    OnLabwareLocation,
                    AddressableAreaLocation,
                ),
            ):
                # Check if sibling labware have a 'containedSpace' variable
                # in their definition to do a containment occupancy check.
                # This lets us determine if the empty space (containedSpace) of
                # a labware is able to fit other labware inside of it.
                if labware_definition is not None and isinstance(
                    labware_definition, LabwareDefinition2
                ):
                    children = []
                    for lw in self._labware.get_all():
                        if lw.location == location:
                            children.append(lw)

                    new_labware_def = labware_definition
                    new_contained = new_labware_def.containedSpace

                    # if we have children check if either siblings have 'containedSpace'
                    for child in children:
                        child_def = self._labware.get_definition(child.id)
                        if not isinstance(child_def, LabwareDefinition2):
                            continue
                        existing_contained = child_def.containedSpace

                        # Standard Nesting: Loading a resident into an existing container
                        if existing_contained is not None:
                            if not is_fully_contained(
                                resident_def=new_labware_def,
                                boundary_space=existing_contained,
                            ):
                                raise errors.LabwareIsNotAllowedInLocationError(
                                    f"Labware {new_labware_def.parameters.loadName} does not fit within the "
                                    f"containedSpace of existing {child.loadName}."
                                )
                        # Contained Logic: Loading a container over an existing resident
                        elif new_contained is not None:
                            if not is_fully_contained(
                                resident_def=child_def, boundary_space=new_contained
                            ):
                                raise errors.LocationIsOccupiedError(
                                    f"Cannot contain {child.loadName}; it is too large for the "
                                    f"internal volume of {new_labware_def.parameters.loadName}."
                                )
                        # Strict Occupancy: Neither has a volume
                        else:
                            self._labware.raise_if_labware_in_location(location)

                else:
                    self._labware.raise_if_labware_in_location(location)

            area = (
                location.slotName.id
                if isinstance(location, DeckSlotLocation)
                else (
                    location.addressableAreaName
                    if isinstance(location, AddressableAreaLocation)
                    else None
                )
            )

            if area is not None and (
                existing_fixtures is None
                or not any(
                    area in fixture.provided_addressable_areas
                    for fixture in existing_fixtures[1]
                )
            ):
                if isinstance(location, DeckSlotLocation):
                    self._modules.raise_if_module_in_location(location)
                elif isinstance(location, AddressableAreaLocation):
                    self._modules.raise_if_module_in_location(
                        DeckSlotLocation(
                            slotName=self._addressable_areas.get_addressable_area_base_slot(
                                location.addressableAreaName
                            )
                        )
                    )
        return location

    def _get_potential_fixtures_for_location_occupation(
        self, location: _LabwareLocation
    ) -> Tuple[str, Set[PotentialCutoutFixture]] | None:
        loc: DeckSlotLocation | AddressableAreaLocation | None = None
        if isinstance(location, AddressableAreaLocation):
            # Convert the addressable area into a staging slot if applicable
            slots = StagingSlotName._value2member_map_
            for slot in slots:
                if location.addressableAreaName == slot:
                    loc = DeckSlotLocation(
                        slotName=DeckSlotName(location.addressableAreaName[0] + "3")
                    )
            if loc is None:
                loc = location
        elif isinstance(location, DeckSlotLocation):
            loc = location

        if isinstance(loc, DeckSlotLocation):
            module = self._modules.get_by_slot(loc.slotName)
            if module is not None and self._config.robot_type != "OT-2 Standard":
                fixtures = deck_configuration_provider.get_potential_cutout_fixtures(
                    addressable_area_name=self._modules.ensure_and_convert_module_fixture_location(
                        deck_slot=loc.slotName,
                        model=module.model,
                    ),
                    deck_definition=self._addressable_areas.deck_definition,
                )
            else:
                fixtures = None
        elif isinstance(loc, AddressableAreaLocation):
            fixtures = deck_configuration_provider.get_potential_cutout_fixtures(
                addressable_area_name=loc.addressableAreaName,
                deck_definition=self._addressable_areas.deck_definition,
            )
        else:
            fixtures = None
        return fixtures

    def _get_potential_disposal_location_cutout_fixtures(
        self, slot_name: DeckSlotName
    ) -> CutoutFixture | None:
        for area in self._addressable_areas.get_all():
            if (
                self._addressable_areas.get_addressable_area(area).area_type
                == AreaType.WASTE_CHUTE
                or self._addressable_areas.get_addressable_area(area).area_type
                == AreaType.MOVABLE_TRASH
            ) and slot_name == self._addressable_areas.get_addressable_area_base_slot(
                area
            ):
                # Given we only have one Waste Chute fixture and one type of Trash bin fixture it's
                # fine to return the first result of our potential fixtures here. This will need to
                # change in the future if there multiple trash fixtures that share the same area type.
                potential_fixture = (
                    deck_configuration_provider.get_potential_cutout_fixtures(
                        area, self._addressable_areas.deck_definition
                    )[1].pop()
                )
                return deck_configuration_provider.get_cutout_fixture(
                    potential_fixture.cutout_fixture_id,
                    self._addressable_areas.deck_definition,
                )
        return None

    def get_labware_grip_point(
        self,
        labware_definition: LabwareDefinition,
        location: AccessibleByGripperLocation,
        move_type: GripperMoveType,
        user_additional_offset: Point | None,
    ) -> Point:
        """Get the grip point of the labware as placed on the given location.

        Returns the absolute position of the labware's gripping point as if
        it were placed on the specified location. Labware offset (LPC offset) not included.

        Grip point is the location where critical point of the gripper should move to
        in order to pick/drop the given labware in the specified location.
        It is calculated as the xy center of the slot with z as the point indicated by
        z-position of labware bottom + grip height from labware bottom.
        """
        mod_cal_offset = self._get_calibrated_module_offset(location)
        user_additional_offset = user_additional_offset or Point()
        aa_origin_to_nominal_grip_point = self._get_aa_origin_to_nominal_grip_point(
            labware_definition=labware_definition,
            location=location,
            move_type=move_type,
        )

        return aa_origin_to_nominal_grip_point + mod_cal_offset + user_additional_offset

    def _get_aa_origin_to_nominal_grip_point(
        self,
        labware_definition: LabwareDefinition,
        location: AccessibleByGripperLocation,
        move_type: GripperMoveType,
    ) -> Point:
        """Get the nominal grip point of a labware.

        Does not include module calibration offsets or user additional offsets.
        """
        grip_z_from_lw_origin = self._labware.get_grip_z(labware_definition)
        aa_name = self._get_underlying_addressable_area_name(location)
        addressable_area = self._addressable_areas.get_addressable_area(aa_name)
        stackup_defs_locs = self._get_stackup_lw_info_top_to_bottom(
            labware_definition=labware_definition, location=location
        )
        module_parent_to_child_offset = self._get_stackup_module_parent_to_child_offset(
            location
        )
        underlying_ancestor_def = self._get_stackup_underlying_ancestor_definition(
            location
        )
        context_type = (
            LabwareOriginContext.GRIPPER_PICKING_UP
            if move_type == GripperMoveType.PICK_UP_LABWARE
            else LabwareOriginContext.GRIPPER_DROPPING
        )

        aa_origin_to_lw_origin = get_stackup_origin_to_labware_origin(
            context=context_type,
            module_parent_to_child_offset=module_parent_to_child_offset,
            underlying_ancestor_definition=underlying_ancestor_def,
            stackup_lw_info_top_to_bottom=stackup_defs_locs,
            slot_name=addressable_area.base_slot,
            deck_definition=self._addressable_areas.deck_definition,
        )

        if isinstance(labware_definition, LabwareDefinition2):
            lw_origin_to_aa_origin = self._get_lw_origin_to_parent(
                labware_definition=labware_definition, addressable_area=addressable_area
            )
            aa_origin_to_aa_center = (
                self._addressable_areas.get_addressable_area_center(aa_name)
            )
            aa_center_to_nominal_grip_point = Point(0, 0, grip_z_from_lw_origin)

            return (
                aa_origin_to_lw_origin
                + lw_origin_to_aa_origin
                + aa_origin_to_aa_center
                + aa_center_to_nominal_grip_point
            )

        else:
            assert isinstance(labware_definition, LabwareDefinition3)

            aa_origin = self._addressable_areas.get_addressable_area_position(aa_name)
            lw_origin_to_lw_center = self._get_lw_origin_to_lw_center(
                labware_definition
            )
            lw_origin_to_lw_grip_center = Point(
                x=lw_origin_to_lw_center.x,
                y=lw_origin_to_lw_center.y,
                z=grip_z_from_lw_origin,
            )

            return aa_origin + aa_origin_to_lw_origin + lw_origin_to_lw_grip_center

    def _get_lw_origin_to_lw_center(
        self, labware_definition: LabwareDefinition
    ) -> Point:
        """Get the x,y,z center of the labware."""
        if isinstance(labware_definition, LabwareDefinition2):
            dimensions = labware_definition.dimensions
            x = dimensions.xDimension / 2
            y = dimensions.yDimension / 2
            z = dimensions.zDimension / 2

            return Point(x, y, z)
        else:
            front_right_top = labware_definition.extents.total.frontRightTop
            back_left_bottom = labware_definition.extents.total.backLeftBottom

            x = (front_right_top.x - back_left_bottom.x) / 2
            y = (front_right_top.y - back_left_bottom.y) / 2
            z = (front_right_top.z - back_left_bottom.z) / 2

            return Point(x, y, z)

    def _get_lw_origin_to_parent(
        self, labware_definition: LabwareDefinition, addressable_area: AddressableArea
    ) -> Point:
        if isinstance(labware_definition, LabwareDefinition2):
            return Point(0, 0, 0)
        else:
            bb_y = addressable_area.bounding_box.y
            bb_z = addressable_area.bounding_box.z
            return (
                Point(
                    x=0,
                    y=bb_y,
                    z=bb_z,
                )
                * -1
            )

    def get_extra_waypoints(
        self,
        location: Optional[CurrentPipetteLocation],
        to_slot: Union[DeckSlotName, StagingSlotName],
    ) -> List[Tuple[float, float]]:
        """Get extra waypoints for movement if thermocycler needs to be dodged."""
        if location is not None:
            if isinstance(location, CurrentWell):
                from_slot = self.get_ancestor_slot_name(location.labware_id)
            else:
                from_slot = self._addressable_areas.get_addressable_area_base_slot(
                    location.addressable_area_name
                )
            if self._modules.should_dodge_thermocycler(
                from_slot=from_slot, to_slot=to_slot
            ):
                middle_slot_fixture = (
                    self._addressable_areas.get_fixture_by_deck_slot_name(
                        DeckSlotName.SLOT_C2.to_equivalent_for_robot_type(
                            self._config.robot_type
                        )
                    )
                )
                if middle_slot_fixture is None:
                    middle_slot = DeckSlotName.SLOT_5.to_equivalent_for_robot_type(
                        self._config.robot_type
                    )
                    middle_slot_center = (
                        self._addressable_areas.get_addressable_area_center(
                            addressable_area_name=middle_slot.id,
                        )
                    )
                else:
                    # todo(chb, 2025-07-30): For now we're defaulting to the first addressable area for these center slot fixtures, but
                    # if we ever introduce a fixture in the center slot with many addressable areas that aren't "centered" over the deck
                    # slot we will enter up generating a pretty whacky movement path (potentially dangerous).
                    middle_slot_center = self._addressable_areas.get_addressable_area_center(
                        addressable_area_name=middle_slot_fixture[
                            "providesAddressableAreas"
                        ][
                            deck_configuration_provider.get_cutout_id_by_deck_slot_name(
                                DeckSlotName.SLOT_C2.to_equivalent_for_robot_type(
                                    self._config.robot_type
                                )
                            )
                        ][0],
                    )
                return [(middle_slot_center.x, middle_slot_center.y)]
        return []

    def get_slot_item(
        self, slot_name: Union[DeckSlotName, StagingSlotName]
    ) -> Union[LoadedLabware, LoadedModule, CutoutFixture, None]:
        """Get the top-most item present in a deck slot, if any.

        This includes any module that occupies the given slot even if it wasn't loaded
        in that slot (e.g., thermocycler).
        """
        maybe_labware = self._labware.get_by_slot(
            slot_name=slot_name,
        )

        if isinstance(slot_name, DeckSlotName):
            maybe_fixture = self._addressable_areas.get_fixture_by_deck_slot_name(
                slot_name
            )

            # Ignore generic single slot fixtures
            if maybe_fixture and maybe_fixture["id"] in {
                "singleLeftSlot",
                "singleCenterSlot",
                "singleRightSlot",
            }:
                maybe_fixture = None

            maybe_module = self._modules.get_by_slot(
                slot_name=slot_name,
            ) or self._modules.get_overflowed_module_in_slot(slot_name=slot_name)

            # For situations in which the deck config is none
            if maybe_fixture is None and maybe_labware is None and maybe_module is None:
                # todo(chb 2025-03-19): This can go away once we solve the problem of no deck config in analysis
                maybe_fixture = self._get_potential_disposal_location_cutout_fixtures(
                    slot_name
                )
        else:
            # Modules and fixtures can't be loaded on staging slots
            maybe_fixture = None
            maybe_module = None

        return maybe_labware or maybe_module or maybe_fixture or None

    @staticmethod
    def get_slot_column(slot_name: Union[DeckSlotName, StagingSlotName]) -> int:
        """Get the column number for the specified slot."""
        if isinstance(slot_name, StagingSlotName):
            return 4
        row_col_name = slot_name.to_ot3_equivalent()
        slot_name_match = WELL_NAME_PATTERN.match(row_col_name.value)
        assert slot_name_match is not None, (
            f"Slot name {row_col_name} did not match required pattern; please check labware location."
        )

        row_name, column_name = slot_name_match.group(1, 2)
        return int(column_name)

    @staticmethod
    def ensure_valid_gripper_location(
        location: LabwareLocation,
    ) -> Union[
        DeckSlotLocation,
        ModuleLocation,
        OnLabwareLocation,
        AddressableAreaLocation,
    ]:
        """Ensure valid on-deck location for gripper, otherwise raise error."""
        if location == WASTE_CHUTE_LOCATION:
            raise errors.LabwareMovementNotAllowedError(
                "Labware movements out of the waste chute are not supported using the gripper."
            )
        if not isinstance(
            location,
            (
                DeckSlotLocation,
                ModuleLocation,
                OnLabwareLocation,
                AddressableAreaLocation,
            ),
        ):
            raise errors.LabwareMovementNotAllowedError(
                "Off-deck labware movements are not supported using the gripper."
            )
        return location

    @staticmethod
    def ensure_valid_new_gripper_location(
        location: LabwareLocation,
    ) -> AccessibleByGripperLocation:
        """Ensure valid on-deck location for gripper, otherwise raise error."""
        if (
            not isinstance(
                location,
                (
                    DeckSlotLocation,
                    ModuleLocation,
                    OnLabwareLocation,
                    AddressableAreaLocation,
                ),
            )
            and location != WASTE_CHUTE_LOCATION
        ):
            raise errors.LabwareMovementNotAllowedError(
                "Off-deck labware movements are not supported using the gripper."
            )
        return location

    def get_location_sequence(self, labware_id: str) -> LabwareLocationSequence:
        """Provide the LocationSequence specifying the current position of the labware.

        Elements in this sequence contain instance IDs of things. The chain is valid only until the
        labware is moved.
        """
        return self.get_predicted_location_sequence(
            self._labware.get_location(labware_id)
        )

    def get_predicted_location_sequence(
        self,
        labware_location: LabwareLocation,
        labware_pending_load: dict[str, LoadedLabware] | None = None,
    ) -> LabwareLocationSequence:
        """Get the location sequence for this location. Useful for a labware that hasn't been loaded."""
        return self._recurse_labware_location(
            labware_location, [], labware_pending_load or {}
        )

    def _cutout_fixture_location_sequence_from_addressable_area(
        self, addressable_area_name: str
    ) -> OnCutoutFixtureLocationSequenceComponent:
        (
            cutout_id,
            potential_fixtures,
        ) = self._addressable_areas.get_current_potential_cutout_fixtures_for_addressable_area(
            addressable_area_name
        )
        return OnCutoutFixtureLocationSequenceComponent(
            possibleCutoutFixtureIds=sorted(
                [fixture.cutout_fixture_id for fixture in potential_fixtures]
            ),
            cutoutId=cutout_id,
        )

    def _recurse_labware_location_from_aa_component(
        self,
        labware_location: AddressableAreaLocation,
        building: LabwareLocationSequence,
    ) -> LabwareLocationSequence:
        cutout_location = self._cutout_fixture_location_sequence_from_addressable_area(
            labware_location.addressableAreaName
        )
        # If the labware is loaded on an AA that is a module, we want to respect the convention
        # of giving it an OnModuleLocation.
        possible_module = self._modules.get_by_addressable_area(
            labware_location.addressableAreaName,
            self._addressable_areas.deck_definition,
        )
        if possible_module is not None:
            return building + [
                OnAddressableAreaLocationSequenceComponent(
                    addressableAreaName=labware_location.addressableAreaName
                ),
                OnModuleLocationSequenceComponent(moduleId=possible_module.id),
                cutout_location,
            ]
        else:
            return building + [
                OnAddressableAreaLocationSequenceComponent(
                    addressableAreaName=labware_location.addressableAreaName,
                ),
                cutout_location,
            ]

    def _recurse_labware_location_from_module_component(
        self, labware_location: ModuleLocation, building: LabwareLocationSequence
    ) -> LabwareLocationSequence:
        module_id = labware_location.moduleId
        module_aa = self._modules.get_provided_addressable_area(module_id)
        base_location: (
            OnCutoutFixtureLocationSequenceComponent
            | NotOnDeckLocationSequenceComponent
        ) = self._cutout_fixture_location_sequence_from_addressable_area(module_aa)

        if self._modules.get_deck_supports_module_fixtures():
            # On a deck with modules as cutout fixtures, we want, in order,
            # - the addressable area of the module
            # - the module with its module id, which is what clients want
            # - the cutout
            loc = self._modules.get_location(module_id)
            model = self._modules.get_connected_model(module_id)
            module_aa = self._modules.ensure_and_convert_module_fixture_location(
                loc.slotName, model
            )
            return building + [
                OnAddressableAreaLocationSequenceComponent(
                    addressableAreaName=module_aa
                ),
                OnModuleLocationSequenceComponent(moduleId=module_id),
                base_location,
            ]
        else:
            # If the module isn't a cutout fixture, then we want
            # - the module
            # - the addressable area the module is loaded on
            # - the cutout
            location = self._modules.get_location(module_id)
            return building + [
                OnModuleLocationSequenceComponent(moduleId=module_id),
                OnAddressableAreaLocationSequenceComponent(
                    addressableAreaName=location.slotName.value
                ),
                base_location,
            ]

    def _recurse_labware_location_from_stacker_hopper(
        self,
        labware_location: InStackerHopperLocation,
        building: LabwareLocationSequence,
    ) -> LabwareLocationSequence:
        loc = self._modules.get_location(labware_location.moduleId)
        model = self._modules.get_connected_model(labware_location.moduleId)
        module_aa = self._modules.ensure_and_convert_module_fixture_location(
            loc.slotName, model
        )
        cutout_base = self._cutout_fixture_location_sequence_from_addressable_area(
            module_aa
        )
        return building + [labware_location, cutout_base]

    def _recurse_labware_location(
        self,
        labware_location: LabwareLocation,
        building: LabwareLocationSequence,
        labware_pending_load: dict[str, LoadedLabware],
    ) -> LabwareLocationSequence:
        if isinstance(labware_location, AddressableAreaLocation):
            return self._recurse_labware_location_from_aa_component(
                labware_location, building
            )
        elif labware_location_is_off_deck(
            labware_location
        ) or labware_location_is_system(labware_location):
            return building + [
                NotOnDeckLocationSequenceComponent(logicalLocationName=labware_location)
            ]

        elif isinstance(labware_location, OnLabwareLocation):
            labware = self._get_or_default_labware(
                labware_location.labwareId, labware_pending_load
            )
            return self._recurse_labware_location(
                labware.location,
                building
                + [
                    OnLabwareLocationSequenceComponent(
                        labwareId=labware_location.labwareId, lidId=labware.lid_id
                    )
                ],
                labware_pending_load,
            )
        elif isinstance(labware_location, ModuleLocation):
            return self._recurse_labware_location_from_module_component(
                labware_location, building
            )
        elif isinstance(labware_location, DeckSlotLocation):
            return building + [
                OnAddressableAreaLocationSequenceComponent(
                    addressableAreaName=labware_location.slotName.value,
                ),
                self._cutout_fixture_location_sequence_from_addressable_area(
                    labware_location.slotName.value
                ),
            ]
        elif isinstance(labware_location, InStackerHopperLocation):
            return self._recurse_labware_location_from_stacker_hopper(
                labware_location, building
            )
        elif labware_location == WASTE_CHUTE_LOCATION:
            return [
                NotOnDeckLocationSequenceComponent(
                    logicalLocationName=WASTE_CHUTE_LOCATION
                )
            ]
        else:
            _LOG.warn(f"Unhandled labware location kind: {labware_location}")
            return building

    def get_offset_location(
        self, labware_id: str
    ) -> Optional[LabwareOffsetLocationSequence]:
        """Provide the LegacyLabwareOffsetLocation specifying the current position of the labware.

        If the labware is in a location that cannot be specified by a LabwareOffsetLocationSequence
        (for instance, OFF_DECK) then return None.
        """
        parent_location = self._labware.get_location(labware_id)
        return self.get_projected_offset_location(parent_location)

    def get_projected_offset_location(
        self,
        labware_location: LabwareLocation,
        labware_pending_load: dict[str, LoadedLabware] | None = None,
    ) -> Optional[LabwareOffsetLocationSequence]:
        """Get the offset location that a labware loaded into this location would match.

        `None` indicates that the very concept of a labware offset would not make sense
        for the given location, such as if it's some kind of off-deck location. This
        is a difference from `get_predicted_location_sequence()`, where off-deck
        locations are still represented as lists, but with special final elements.
        """
        return self._recurse_labware_offset_location(
            labware_location, [], labware_pending_load or {}
        )

    def _recurse_labware_offset_location(
        self,
        labware_location: LabwareLocation,
        building: LabwareOffsetLocationSequence,
        labware_pending_load: dict[str, LoadedLabware],
    ) -> LabwareOffsetLocationSequence | None:
        if isinstance(labware_location, DeckSlotLocation):
            return building + [
                OnAddressableAreaOffsetLocationSequenceComponent(
                    addressableAreaName=labware_location.slotName.value
                )
            ]

        elif isinstance(labware_location, ModuleLocation):
            module_id = labware_location.moduleId
            # Allow ModuleNotLoadedError to propagate.
            # Note also that we match based on the module's requested model, not its
            # actual model, to implement robot-server's documented HTTP API semantics.
            module_model = self._modules.get_requested_model(module_id=module_id)

            # If `module_model is None`, it probably means that this module was added by
            # `ProtocolEngine.use_attached_modules()`, instead of an explicit
            # `loadModule` command.
            #
            # This assert should never raise in practice because:
            #   1. `ProtocolEngine.use_attached_modules()` is only used by
            #      robot-server's "stateless command" endpoints, under `/commands`.
            #   2. Those endpoints don't support loading labware, so this code will
            #      never run.
            #
            # Nevertheless, if it does happen somehow, we do NOT want to pass the
            # `None` value along to `LabwareView.find_applicable_labware_offset()`.
            # `None` means something different there, which will cause us to return
            # wrong results.
            assert module_model is not None, (
                "Can't find offsets for labware"
                " that are loaded on modules"
                " that were loaded with ProtocolEngine.use_attached_modules()."
            )

            module_location = self._modules.get_location(module_id=module_id)
            if self._modules.get_deck_supports_module_fixtures():
                module_aa = self._modules.ensure_and_convert_module_fixture_location(
                    module_location.slotName, module_model
                )
            else:
                module_aa = module_location.slotName.value
            return building + [
                OnModuleOffsetLocationSequenceComponent(moduleModel=module_model),
                OnAddressableAreaOffsetLocationSequenceComponent(
                    addressableAreaName=module_aa
                ),
            ]

        elif isinstance(labware_location, OnLabwareLocation):
            parent_labware_id = labware_location.labwareId
            parent_labware = self._get_or_default_labware(
                parent_labware_id, labware_pending_load
            )
            parent_labware_uri = LabwareUri(parent_labware.definitionUri)
            base_location = parent_labware.location
            return self._recurse_labware_offset_location(
                base_location,
                building
                + [
                    OnLabwareOffsetLocationSequenceComponent(
                        labwareUri=parent_labware_uri
                    )
                ],
                labware_pending_load,
            )

        else:  # Off deck
            return None

    def get_height_of_labware_stack(
        self, definitions: list[LabwareDefinition]
    ) -> float:
        """Get the overall height of a stack of labware listed by definition in top-first order."""
        if len(definitions) == 0:
            return 0
        if len(definitions) == 1:
            return self._labware.get_dimensions(labware_definition=definitions[0]).z
        total_height = 0.0
        upper_def: LabwareDefinition = definitions[0]
        for lower_def in definitions[1:]:
            overlap = self._labware.get_labware_overlap_offsets(
                upper_def, lower_def.parameters.loadName
            ).z
            total_height += (
                self._labware.get_dimensions(labware_definition=upper_def).z - overlap
            )
            upper_def = lower_def
        return (
            total_height + self._labware.get_dimensions(labware_definition=upper_def).z
        )
        return total_height + upper_def.dimensions.zDimension

    def get_height_of_stacker_labware_pool(self, module_id: str) -> float:
        """Get the overall height of a stack of labware in a Stacker module."""
        stacker = self._modules.get_flex_stacker_substate(module_id)
        pool_list = stacker.get_pool_definition_ordered_list()
        if not pool_list:
            return 0.0
        return self.get_height_of_labware_stack(pool_list)

    def _get_or_default_labware(
        self, labware_id: str, pending_labware: dict[str, LoadedLabware]
    ) -> LoadedLabware:
        try:
            return self._labware.get(labware_id)
        except LabwareNotLoadedError as lnle:
            try:
                return pending_labware[labware_id]
            except KeyError as ke:
                raise lnle from ke

    def raise_if_labware_inaccessible_by_pipette(  # noqa: C901
        self, labware_id: str
    ) -> None:
        """Raise an error if the specified location cannot be reached via a pipette."""
        labware = self._labware.get(labware_id)
        labware_location = labware.location
        if isinstance(labware_location, OnLabwareLocation):
            return self.raise_if_labware_inaccessible_by_pipette(
                labware_location.labwareId
            )
        elif labware.lid_id is not None:
            raise errors.LocationNotAccessibleByPipetteError(
                f"Cannot move pipette to {labware.loadName} "
                "because labware is currently covered by a lid."
            )
        elif isinstance(labware_location, AddressableAreaLocation):
            if fixture_validation.is_staging_slot(labware_location.addressableAreaName):
                raise errors.LocationNotAccessibleByPipetteError(
                    f"Cannot move pipette to {labware.loadName},"
                    f" labware is on staging slot {labware_location.addressableAreaName}"
                )
            elif fixture_validation.is_stacker_shuttle(
                labware_location.addressableAreaName
            ):
                raise errors.LocationNotAccessibleByPipetteError(
                    f"Cannot move pipette to {labware.loadName} because it is on a stacker shuttle"
                )
        elif (
            labware_location == OFF_DECK_LOCATION or labware_location == SYSTEM_LOCATION
        ):
            raise errors.LocationNotAccessibleByPipetteError(
                f"Cannot move pipette to {labware.loadName}, labware is off-deck."
            )
        elif labware_location == WASTE_CHUTE_LOCATION:
            raise errors.LocationNotAccessibleByPipetteError(
                f"Cannot move pipette to {labware.loadName}, labware is in waste chute."
            )
        elif isinstance(labware_location, ModuleLocation):
            module = self._modules.get(labware_location.moduleId)
            if ModuleModel.is_flex_stacker(module.model):
                raise errors.LocationNotAccessibleByPipetteError(
                    f"Cannot move pipette to {labware.loadName}, labware is on a stacker shuttle"
                )

        elif isinstance(labware_location, InStackerHopperLocation):
            raise errors.LocationNotAccessibleByPipetteError(
                f"Cannot move pipette to {labware.loadName}, labware is in a stacker hopper"
            )
