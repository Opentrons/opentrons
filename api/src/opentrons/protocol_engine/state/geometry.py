"""Geometry state getters."""
import enum
from numpy import array, dot, double as npdouble
from numpy.typing import NDArray
from typing import Optional, List, Tuple, Union, cast, TypeVar, Dict
from dataclasses import dataclass
from functools import cached_property

from opentrons.types import Point, DeckSlotName, StagingSlotName, MountType

from opentrons_shared_data.labware.constants import WELL_NAME_PATTERN
from opentrons_shared_data.deck.types import CutoutFixture
from opentrons_shared_data.pipette import PIPETTE_X_SPAN
from opentrons_shared_data.pipette.types import ChannelCount

from .. import errors
from ..errors import (
    LabwareNotLoadedOnLabwareError,
    LabwareNotLoadedOnModuleError,
    LabwareMovementNotAllowedError,
)
from ..resources import fixture_validation
from ..types import (
    OFF_DECK_LOCATION,
    LoadedLabware,
    LoadedModule,
    WellLocation,
    DropTipWellLocation,
    WellOrigin,
    DropTipWellOrigin,
    WellOffset,
    DeckSlotLocation,
    ModuleLocation,
    OnLabwareLocation,
    LabwareLocation,
    LabwareOffsetVector,
    ModuleOffsetVector,
    ModuleOffsetData,
    CurrentWell,
    CurrentPipetteLocation,
    TipGeometry,
    LabwareMovementOffsetData,
    OnDeckLabwareLocation,
    AddressableAreaLocation,
    AddressableOffsetVector,
    StagingSlotLocation,
    LabwareOffsetLocation,
)
from .config import Config
from .labware import LabwareView
from .modules import ModuleView
from .pipettes import PipetteView
from .addressable_areas import AddressableAreaView


SLOT_WIDTH = 128
_PIPETTE_HOMED_POSITION_Z = (
    248.0  # Height of the bottom of the nozzle without the tip attached when homed
)


class _TipDropSection(enum.Enum):
    """Well sections to drop tips in."""

    LEFT = "left"
    RIGHT = "right"


class _GripperMoveType(enum.Enum):
    """Types of gripper movement."""

    PICK_UP_LABWARE = enum.auto()
    DROP_LABWARE = enum.auto()


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
        module_view: ModuleView,
        pipette_view: PipetteView,
        addressable_area_view: AddressableAreaView,
    ) -> None:
        """Initialize a GeometryView instance."""
        self._config = config
        self._labware = labware_view
        self._modules = module_view
        self._pipettes = pipette_view
        self._addressable_areas = addressable_area_view
        self._last_drop_tip_location_spot: Dict[str, _TipDropSection] = {}

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

    def get_all_obstacle_highest_z(self) -> float:
        """Get the highest Z-point across all obstacles that the instruments need to fly over."""
        highest_labware_z = max(
            (
                self._get_highest_z_from_labware_data(lw_data)
                for lw_data in self._labware.get_all()
                if lw_data.location != OFF_DECK_LOCATION
            ),
            default=0.0,
        )

        # Fixme (spp, 2023-12-04): the overall height is not the true highest z of modules
        #  on a Flex.
        highest_module_z = max(
            (
                self._modules.get_overall_height(module.id)
                for module in self._modules.get_all()
            ),
            default=0.0,
        )

        cutout_fixture_names = self._addressable_areas.get_all_cutout_fixtures()
        if cutout_fixture_names is None:
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
            highest_fixture_z = 0.0
        else:
            highest_fixture_z = max(
                (
                    self._addressable_areas.get_fixture_height(cutout_fixture_name)
                    for cutout_fixture_name in cutout_fixture_names
                ),
                default=0.0,
            )

        return max(
            highest_labware_z,
            highest_module_z,
            highest_fixture_z,
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
                return self._modules.get_module_highest_z(
                    module_id=module_id,
                    addressable_areas=self._addressable_areas,
                )
            else:
                return self.get_highest_z_of_labware_stack(labware_id)
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

    def get_labware_parent_nominal_position(self, labware_id: str) -> Point:
        """Get the position of the labware's uncalibrated parent slot (deck, module, or another labware)."""
        try:
            slot_name = self.get_ancestor_slot_name(labware_id).id
        except errors.LocationIsStagingSlotError:
            slot_name = self._get_staging_slot_name(labware_id)
        slot_pos = self._addressable_areas.get_addressable_area_position(slot_name)
        labware_data = self._labware.get(labware_id)
        offset = self._get_labware_position_offset(labware_id, labware_data.location)

        return Point(
            slot_pos.x + offset.x,
            slot_pos.y + offset.y,
            slot_pos.z + offset.z,
        )

    def _get_labware_position_offset(
        self, labware_id: str, labware_location: LabwareLocation
    ) -> LabwareOffsetVector:
        """Gets the offset vector of a labware on the given location.

        NOTE: Not to be confused with LPC offset.
        - For labware on Deck Slot: returns an offset of (0, 0, 0)
        - For labware on a Module: returns the nominal offset for the labware's position
          when placed on the specified module (using slot-transformed labwareOffset
          from the module's definition with any stacking overlap).
          Does not include module calibration offset or LPC offset.
        - For labware on another labware: returns the nominal offset for the labware
          as placed on the specified labware, taking into account any offsets for labware
          on modules as well as stacking overlaps.
          Does not include module calibration offset or LPC offset.
        """
        if isinstance(labware_location, (AddressableAreaLocation, DeckSlotLocation)):
            return LabwareOffsetVector(x=0, y=0, z=0)
        elif isinstance(labware_location, ModuleLocation):
            module_id = labware_location.moduleId
            module_offset = self._modules.get_nominal_module_offset(
                module_id=module_id, addressable_areas=self._addressable_areas
            )
            module_model = self._modules.get_connected_model(module_id)
            stacking_overlap = self._labware.get_module_overlap_offsets(
                labware_id, module_model
            )
            return LabwareOffsetVector(
                x=module_offset.x - stacking_overlap.x,
                y=module_offset.y - stacking_overlap.y,
                z=module_offset.z - stacking_overlap.z,
            )
        elif isinstance(labware_location, OnLabwareLocation):
            on_labware = self._labware.get(labware_location.labwareId)
            on_labware_dimensions = self._labware.get_dimensions(on_labware.id)
            stacking_overlap = self._labware.get_labware_overlap_offsets(
                labware_id=labware_id, below_labware_name=on_labware.loadName
            )
            labware_offset = LabwareOffsetVector(
                x=stacking_overlap.x,
                y=stacking_overlap.y,
                z=on_labware_dimensions.z - stacking_overlap.z,
            )
            return labware_offset + self._get_labware_position_offset(
                on_labware.id, on_labware.location
            )
        else:
            raise errors.LabwareNotOnDeckError(
                f"Cannot access labware {labware_id} since it is not on the deck. "
                f"Either it has been loaded off-deck or its been moved off-deck."
            )

    def _normalize_module_calibration_offset(
        self,
        module_location: DeckSlotLocation,
        offset_data: Optional[ModuleOffsetData],
    ) -> ModuleOffsetVector:
        """Normalize the module calibration offset depending on the module location."""
        if not offset_data:
            return ModuleOffsetVector(x=0, y=0, z=0)
        offset = offset_data.moduleOffsetVector
        calibrated_slot = offset_data.location.slotName
        calibrated_slot_column = self.get_slot_column(calibrated_slot)
        current_slot_column = self.get_slot_column(module_location.slotName)
        # make sure that we have valid colums since we cant have modules in the middle of the deck
        assert set([calibrated_slot_column, current_slot_column]).issubset(
            {1, 3}
        ), f"Module calibration offset is an invalid slot {calibrated_slot}"

        # Check if the module has moved from one side of the deck to the other
        if calibrated_slot_column != current_slot_column:
            # Since the module was rotated, the calibration offset vector needs to be rotated by 180 degrees along the z axis
            saved_offset: NDArray[npdouble] = array([offset.x, offset.y, offset.z])
            rotation_matrix: NDArray[npdouble] = array(
                [[-1, 0, 0], [0, -1, 0], [0, 0, 1]]
            )
            new_offset = dot(saved_offset, rotation_matrix)
            offset = ModuleOffsetVector(
                x=new_offset[0], y=new_offset[1], z=new_offset[2]
            )
        return offset

    def _get_calibrated_module_offset(
        self, location: LabwareLocation
    ) -> ModuleOffsetVector:
        """Get a labware location's underlying calibrated module offset, if it is on a module."""
        if isinstance(location, ModuleLocation):
            module_id = location.moduleId
            module_location = self._modules.get_location(module_id)
            offset_data = self._modules.get_module_calibration_offset(module_id)
            return self._normalize_module_calibration_offset(
                module_location, offset_data
            )
        elif isinstance(location, (DeckSlotLocation, AddressableAreaLocation)):
            # TODO we might want to do a check here to make sure addressable area location is a standard deck slot
            #   and raise if its not (or maybe we don't actually care since modules will never be loaded elsewhere)
            return ModuleOffsetVector(x=0, y=0, z=0)
        elif isinstance(location, OnLabwareLocation):
            labware_data = self._labware.get(location.labwareId)
            return self._get_calibrated_module_offset(labware_data.location)
        elif location == OFF_DECK_LOCATION:
            raise errors.LabwareNotOnDeckError(
                "Labware does not have a slot or module associated with it"
                " since it is no longer on the deck."
            )

    def get_labware_parent_position(self, labware_id: str) -> Point:
        """Get the calibrated position of the labware's parent slot (deck or module)."""
        parent_pos = self.get_labware_parent_nominal_position(labware_id)
        labware_data = self._labware.get(labware_id)
        cal_offset = self._get_calibrated_module_offset(labware_data.location)

        return Point(
            x=parent_pos.x + cal_offset.x,
            y=parent_pos.y + cal_offset.y,
            z=parent_pos.z + cal_offset.z,
        )

    def get_labware_origin_position(self, labware_id: str) -> Point:
        """Get the position of the labware's origin, without calibration."""
        slot_pos = self.get_labware_parent_position(labware_id)
        origin_offset = self._labware.get_definition(labware_id).cornerOffsetFromSlot

        return Point(
            x=slot_pos.x + origin_offset.x,
            y=slot_pos.y + origin_offset.y,
            z=slot_pos.z + origin_offset.z,
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

    def get_well_position(
        self,
        labware_id: str,
        well_name: str,
        well_location: Optional[WellLocation] = None,
    ) -> Point:
        """Given relative well location in a labware, get absolute position."""
        labware_pos = self.get_labware_position(labware_id)
        well_def = self._labware.get_well_definition(labware_id, well_name)
        well_depth = well_def.depth

        offset = WellOffset(x=0, y=0, z=well_depth)
        if well_location is not None:
            offset = well_location.offset
            if well_location.origin == WellOrigin.TOP:
                offset = offset.copy(update={"z": offset.z + well_depth})
            elif well_location.origin == WellOrigin.CENTER:
                offset = offset.copy(update={"z": offset.z + well_depth / 2.0})

        return Point(
            x=labware_pos.x + offset.x + well_def.x,
            y=labware_pos.y + offset.y + well_def.y,
            z=labware_pos.z + offset.z + well_def.z,
        )

    def get_nominal_well_position(
        self,
        labware_id: str,
        well_name: str,
    ) -> Point:
        """Get the well position without calibration offsets."""
        parent_pos = self.get_labware_parent_nominal_position(labware_id)
        origin_offset = self._labware.get_definition(labware_id).cornerOffsetFromSlot
        well_def = self._labware.get_well_definition(labware_id, well_name)
        return Point(
            x=parent_pos.x + origin_offset.x + well_def.x,
            y=parent_pos.y + origin_offset.y + well_def.y,
            z=parent_pos.z + origin_offset.z + well_def.z + well_def.depth,
        )

    def get_relative_well_location(
        self,
        labware_id: str,
        well_name: str,
        absolute_point: Point,
    ) -> WellLocation:
        """Given absolute position, get relative location of a well in a labware."""
        well_absolute_point = self.get_well_position(labware_id, well_name)
        delta = absolute_point - well_absolute_point

        return WellLocation(offset=WellOffset(x=delta.x, y=delta.y, z=delta.z))

    def get_well_height(
        self,
        labware_id: str,
        well_name: str,
    ) -> float:
        """Get the height of a specified well for a labware."""
        well_def = self._labware.get_well_definition(labware_id, well_name)
        return well_def.depth

    def _get_highest_z_from_labware_data(self, lw_data: LoadedLabware) -> float:
        labware_pos = self.get_labware_position(lw_data.id)
        definition = self._labware.get_definition(lw_data.id)
        z_dim = definition.dimensions.zDimension
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
        return labware_pos.z + z_dim + height_over_labware

    def get_nominal_effective_tip_length(
        self,
        pipette_id: str,
        labware_id: str,
    ) -> float:
        """Given a labware and a pipette's config, get the nominal effective tip length.

        Effective tip length is the nominal tip length less the distance the
        tip overlaps with the pipette nozzle. This does not take calibrated
        tip lengths into account.
        """
        labware_uri = self._labware.get_definition_uri(labware_id)
        nominal_overlap = self._pipettes.get_nominal_tip_overlap(
            pipette_id=pipette_id, labware_uri=labware_uri
        )

        return self._labware.get_tip_length(
            labware_id=labware_id, overlap=nominal_overlap
        )

    def get_nominal_tip_geometry(
        self,
        pipette_id: str,
        labware_id: str,
        well_name: Optional[str],
    ) -> TipGeometry:
        """Given a labware, well, and hardware pipette config, get the tip geometry.

        Tip geometry includes effective tip length, tip diameter, and tip volume,
        which is all data required by the hardware controller for proper tip handling.

        This geometry data is based solely on labware and pipette definitions and
        does not take calibrated tip lengths into account.
        """
        effective_length = self.get_nominal_effective_tip_length(
            pipette_id=pipette_id,
            labware_id=labware_id,
        )
        well_def = self._labware.get_well_definition(labware_id, well_name)

        if well_def.shape != "circular":
            raise errors.LabwareIsNotTipRackError(
                f"Well {well_name} in labware {labware_id} is not circular."
            )

        return TipGeometry(
            length=effective_length,
            diameter=well_def.diameter,  # type: ignore[arg-type]
            # TODO(mc, 2020-11-12): WellDefinition type says totalLiquidVolume
            #  is a float, but hardware controller expects an int
            volume=int(well_def.totalLiquidVolume),
        )

    def get_checked_tip_drop_location(
        self,
        pipette_id: str,
        labware_id: str,
        well_location: DropTipWellLocation,
        partially_configured: bool = False,
    ) -> WellLocation:
        """Get tip drop location given labware and hardware pipette.

        This makes sure that the well location has an appropriate origin & offset
        if one is not already set previously.
        """
        if (
            self._labware.get_definition(labware_id).parameters.isTiprack
            and partially_configured
        ):
            raise errors.UnexpectedProtocolError(
                "Cannot return tip to a tiprack while the pipette is configured for partial tip."
            )
        if well_location.origin != DropTipWellOrigin.DEFAULT:
            return WellLocation(
                origin=WellOrigin(well_location.origin.value),
                offset=well_location.offset,
            )

        if self._labware.get_definition(labware_id).parameters.isTiprack:
            z_offset = self._labware.get_tip_drop_z_offset(
                labware_id=labware_id,
                length_scale=self._pipettes.get_return_tip_scale(pipette_id),
                additional_offset=well_location.offset.z,
            )
        else:
            # return to top if labware is not tip rack
            z_offset = well_location.offset.z

        return WellLocation(
            origin=WellOrigin.TOP,
            offset=WellOffset(
                x=well_location.offset.x,
                y=well_location.offset.y,
                z=z_offset,
            ),
        )

    # TODO(jbl 11-30-2023) fold this function into get_ancestor_slot_name see RSS-411
    def _get_staging_slot_name(self, labware_id: str) -> str:
        """Get the staging slot name that the labware is on."""
        labware_location = self._labware.get(labware_id).location
        if isinstance(labware_location, OnLabwareLocation):
            below_labware_id = labware_location.labwareId
            return self._get_staging_slot_name(below_labware_id)
        elif isinstance(
            labware_location, AddressableAreaLocation
        ) and fixture_validation.is_staging_slot(labware_location.addressableAreaName):
            return labware_location.addressableAreaName
        else:
            raise ValueError(
                "Cannot get staging slot name for labware not on staging slot."
            )

    def get_ancestor_slot_name(self, labware_id: str) -> DeckSlotName:
        """Get the slot name of the labware or the module that the labware is on."""
        labware = self._labware.get(labware_id)
        slot_name: DeckSlotName

        if isinstance(labware.location, DeckSlotLocation):
            slot_name = labware.location.slotName
        elif isinstance(labware.location, ModuleLocation):
            module_id = labware.location.moduleId
            slot_name = self._modules.get_location(module_id).slotName
        elif isinstance(labware.location, OnLabwareLocation):
            below_labware_id = labware.location.labwareId
            slot_name = self.get_ancestor_slot_name(below_labware_id)
        elif isinstance(labware.location, AddressableAreaLocation):
            area_name = labware.location.addressableAreaName
            # TODO we might want to eventually return some sort of staging slot name when we're ready to work through
            #   the linting nightmare it will create
            if fixture_validation.is_staging_slot(area_name):
                raise errors.LocationIsStagingSlotError(
                    "Cannot get ancestor slot name for labware on staging slot."
                )
            slot_name = DeckSlotName.from_primitive(area_name)
        elif labware.location == OFF_DECK_LOCATION:
            raise errors.LabwareNotOnDeckError(
                f"Labware {labware_id} does not have a slot associated with it"
                f" since it is no longer on the deck."
            )

        return slot_name

    def ensure_location_not_occupied(
        self, location: _LabwareLocation
    ) -> _LabwareLocation:
        """Ensure that the location does not already have either Labware or a Module in it."""
        # TODO (spp, 2023-11-27): Slot locations can also be addressable areas
        #  so we will need to cross-check against items loaded in both location types.
        #  Something like 'check if an item is in lists of both- labware on addressable areas
        #  as well as labware on slots'. Same for modules.
        if isinstance(
            location,
            (
                DeckSlotLocation,
                ModuleLocation,
                OnLabwareLocation,
                AddressableAreaLocation,
            ),
        ):
            self._labware.raise_if_labware_in_location(location)
        if isinstance(location, DeckSlotLocation):
            self._modules.raise_if_module_in_location(location)
        return location

    def get_labware_grip_point(
        self,
        labware_id: str,
        location: Union[
            DeckSlotLocation, ModuleLocation, OnLabwareLocation, AddressableAreaLocation
        ],
    ) -> Point:
        """Get the grip point of the labware as placed on the given location.

        Returns the absolute position of the labware's gripping point as if
        it were placed on the specified location. Labware offset (LPC offset) not included.

        Grip point is the location where critical point of the gripper should move to
        in order to pick/drop the given labware in the specified location.
        It is calculated as the xy center of the slot with z as the point indicated by
        z-position of labware bottom + grip height from labware bottom.
        """
        grip_height_from_labware_bottom = (
            self._labware.get_grip_height_from_labware_bottom(labware_id)
        )
        location_name: str

        if isinstance(location, DeckSlotLocation):
            location_name = location.slotName.id
            offset = LabwareOffsetVector(x=0, y=0, z=0)
        elif isinstance(location, AddressableAreaLocation):
            location_name = location.addressableAreaName
            if fixture_validation.is_gripper_waste_chute(location_name):
                drop_labware_location = (
                    self._addressable_areas.get_addressable_area_move_to_location(
                        location_name
                    )
                )
                return drop_labware_location + Point(z=grip_height_from_labware_bottom)
            # Location should have been pre-validated so this will be a deck/staging area slot
            else:
                offset = LabwareOffsetVector(x=0, y=0, z=0)
        else:
            if isinstance(location, ModuleLocation):
                location_name = self._modules.get_location(
                    location.moduleId
                ).slotName.id
            else:  # OnLabwareLocation
                location_name = self.get_ancestor_slot_name(location.labwareId).id
            labware_offset = self._get_labware_position_offset(labware_id, location)
            # Get the calibrated offset if the on labware location is on top of a module, otherwise return empty one
            cal_offset = self._get_calibrated_module_offset(location)
            offset = LabwareOffsetVector(
                x=labware_offset.x + cal_offset.x,
                y=labware_offset.y + cal_offset.y,
                z=labware_offset.z + cal_offset.z,
            )

        location_center = self._addressable_areas.get_addressable_area_center(
            location_name
        )
        return Point(
            location_center.x + offset.x,
            location_center.y + offset.y,
            location_center.z + offset.z + grip_height_from_labware_bottom,
        )

    def get_extra_waypoints(
        self, location: Optional[CurrentPipetteLocation], to_slot: DeckSlotName
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
                middle_slot = DeckSlotName.SLOT_5.to_equivalent_for_robot_type(
                    self._config.robot_type
                )
                middle_slot_center = (
                    self._addressable_areas.get_addressable_area_center(
                        addressable_area_name=middle_slot.id,
                    )
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
        else:
            # Modules and fixtures can't be loaded on staging slots
            maybe_fixture = None
            maybe_module = None

        return maybe_labware or maybe_module or maybe_fixture or None

    @staticmethod
    def get_slot_column(slot_name: DeckSlotName) -> int:
        """Get the column number for the specified slot."""
        row_col_name = slot_name.to_ot3_equivalent()
        slot_name_match = WELL_NAME_PATTERN.match(row_col_name.value)
        assert (
            slot_name_match is not None
        ), f"Slot name {row_col_name} did not match required pattern; please check labware location."

        row_name, column_name = slot_name_match.group(1, 2)
        return int(column_name)

    def get_next_tip_drop_location(
        self, labware_id: str, well_name: str, pipette_id: str
    ) -> DropTipWellLocation:
        """Get the next location within the specified well to drop the tip into.

        In order to prevent tip stacking, we will alternate between two tip drop locations:
        1. location in left section: a safe distance from left edge of the well
        2. location in right section: a safe distance from right edge of the well

        This safe distance for most cases would be a location where all tips drop
        reliably inside the labware's well. This can be calculated based off of the
        span of a pipette, including all its tips, in the x-direction.

        But we also need to account for the not-so-uncommon case of a left pipette
        trying to drop tips in a labware in the rightmost deck column and vice versa.
        If this labware extends beyond a regular deck slot, like the Flex's default trash,
        then even after keeping a margin for x-span of a pipette, we will get
        a location that's unreachable for the pipette. In such cases, we try to drop tips
        at the rightmost location that a left pipette is able to reach,
        and leftmost location that a right pipette is able to reach respectively.

        In these calculations we assume that the critical point of a pipette
        is considered to be the midpoint of the pipette's tip for single channel,
        and the midpoint of the entire tip assembly for multi-channel pipettes.
        We also assume that the pipette_x_span includes any safety margins required.
        """
        if not self._labware.is_fixed_trash(labware_id=labware_id):
            # In order to avoid the complexity of finding tip drop locations for
            # variety of labware with different well configs, we will allow
            # location cycling only for fixed trash labware right now.
            # TODO (spp, 2023-09-12): update this to possibly a labware-width based check,
            #  or a 'trash' quirk check, once movable trash is implemented.
            return DropTipWellLocation(
                origin=DropTipWellOrigin.DEFAULT,
                offset=WellOffset(x=0, y=0, z=0),
            )

        well_x_dim = self._labware.get_well_size(
            labware_id=labware_id, well_name=well_name
        )[0]
        pipette_channels = self._pipettes.get_config(pipette_id).channels
        pipette_mount = self._pipettes.get_mount(pipette_id)

        labware_slot_column = self.get_slot_column(
            slot_name=self.get_ancestor_slot_name(labware_id)
        )

        if self._last_drop_tip_location_spot.get(labware_id) == _TipDropSection.RIGHT:
            # Drop tip in LEFT section
            x_offset = self._get_drop_tip_well_x_offset(
                tip_drop_section=_TipDropSection.LEFT,
                well_x_dim=well_x_dim,
                pipette_channels=pipette_channels,
                pipette_mount=pipette_mount,
                labware_slot_column=labware_slot_column,
            )
            self._last_drop_tip_location_spot[labware_id] = _TipDropSection.LEFT
        else:
            # Drop tip in RIGHT section
            x_offset = self._get_drop_tip_well_x_offset(
                tip_drop_section=_TipDropSection.RIGHT,
                well_x_dim=well_x_dim,
                pipette_channels=pipette_channels,
                pipette_mount=pipette_mount,
                labware_slot_column=labware_slot_column,
            )
            self._last_drop_tip_location_spot[labware_id] = _TipDropSection.RIGHT

        return DropTipWellLocation(
            origin=DropTipWellOrigin.TOP,
            offset=WellOffset(
                x=x_offset,
                y=0,
                z=0,
            ),
        )

    # TODO find way to combine this with above
    def get_next_tip_drop_location_for_addressable_area(
        self,
        addressable_area_name: str,
        pipette_id: str,
    ) -> AddressableOffsetVector:
        """Get the next location within the specified well to drop the tip into.

        See the doc-string for `get_next_tip_drop_location` for more info on execution.
        """
        area_x_dim = self._addressable_areas.get_addressable_area(
            addressable_area_name
        ).bounding_box.x

        pipette_channels = self._pipettes.get_config(pipette_id).channels
        pipette_mount = self._pipettes.get_mount(pipette_id)

        labware_slot_column = self.get_slot_column(
            slot_name=self._addressable_areas.get_addressable_area_base_slot(
                addressable_area_name
            )
        )

        if (
            self._last_drop_tip_location_spot.get(addressable_area_name)
            == _TipDropSection.RIGHT
        ):
            # Drop tip in LEFT section
            x_offset = self._get_drop_tip_well_x_offset(
                tip_drop_section=_TipDropSection.LEFT,
                well_x_dim=area_x_dim,
                pipette_channels=pipette_channels,
                pipette_mount=pipette_mount,
                labware_slot_column=labware_slot_column,
            )
            self._last_drop_tip_location_spot[
                addressable_area_name
            ] = _TipDropSection.LEFT
        else:
            # Drop tip in RIGHT section
            x_offset = self._get_drop_tip_well_x_offset(
                tip_drop_section=_TipDropSection.RIGHT,
                well_x_dim=area_x_dim,
                pipette_channels=pipette_channels,
                pipette_mount=pipette_mount,
                labware_slot_column=labware_slot_column,
            )
            self._last_drop_tip_location_spot[
                addressable_area_name
            ] = _TipDropSection.RIGHT

        return AddressableOffsetVector(x=x_offset, y=0, z=0)

    @staticmethod
    def _get_drop_tip_well_x_offset(
        tip_drop_section: _TipDropSection,
        well_x_dim: float,
        pipette_channels: int,
        pipette_mount: MountType,
        labware_slot_column: int,
    ) -> float:
        """Get the well x offset for DropTipWellLocation."""
        drop_location_margin_from_labware_edge = (
            PIPETTE_X_SPAN[cast(ChannelCount, pipette_channels)] / 2
        )
        if tip_drop_section == _TipDropSection.LEFT:
            if (
                well_x_dim > SLOT_WIDTH
                and pipette_channels != 96
                and pipette_mount == MountType.RIGHT
                and labware_slot_column == 1
            ):
                # Pipette might not reach the default left spot so use a different left spot
                x_well_offset = (
                    -well_x_dim / 2 + drop_location_margin_from_labware_edge * 2
                )
            else:
                x_well_offset = -well_x_dim / 2 + drop_location_margin_from_labware_edge
                if x_well_offset > 0:
                    x_well_offset = 0
        else:
            if (
                well_x_dim > SLOT_WIDTH
                and pipette_channels != 96
                and pipette_mount == MountType.LEFT
                and labware_slot_column == 3
            ):
                # Pipette might not reach the default right spot so use a different right spot
                x_well_offset = (
                    -well_x_dim / 2
                    + SLOT_WIDTH
                    - drop_location_margin_from_labware_edge
                )
            else:
                x_well_offset = well_x_dim / 2 - drop_location_margin_from_labware_edge
                if x_well_offset < 0:
                    x_well_offset = 0
        return x_well_offset

    def get_final_labware_movement_offset_vectors(
        self,
        from_location: OnDeckLabwareLocation,
        to_location: OnDeckLabwareLocation,
        additional_offset_vector: LabwareMovementOffsetData,
    ) -> LabwareMovementOffsetData:
        """Calculate the final labware offset vector to use in labware movement."""
        pick_up_offset = (
            self.get_total_nominal_gripper_offset_for_move_type(
                location=from_location, move_type=_GripperMoveType.PICK_UP_LABWARE
            )
            + additional_offset_vector.pickUpOffset
        )
        drop_offset = (
            self.get_total_nominal_gripper_offset_for_move_type(
                location=to_location, move_type=_GripperMoveType.DROP_LABWARE
            )
            + additional_offset_vector.dropOffset
        )

        return LabwareMovementOffsetData(
            pickUpOffset=pick_up_offset, dropOffset=drop_offset
        )

    @staticmethod
    def ensure_valid_gripper_location(
        location: LabwareLocation,
    ) -> Union[
        DeckSlotLocation, ModuleLocation, OnLabwareLocation, AddressableAreaLocation
    ]:
        """Ensure valid on-deck location for gripper, otherwise raise error."""
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

    def get_total_nominal_gripper_offset_for_move_type(
        self, location: OnDeckLabwareLocation, move_type: _GripperMoveType
    ) -> LabwareOffsetVector:
        """Get the total of the offsets to be used to pick up labware in its current location."""
        if move_type == _GripperMoveType.PICK_UP_LABWARE:
            if isinstance(
                location, (ModuleLocation, DeckSlotLocation, AddressableAreaLocation)
            ):
                return self._nominal_gripper_offsets_for_location(location).pickUpOffset
            else:
                # If it's a labware on a labware (most likely an adapter),
                # we calculate the offset as sum of offsets for the direct parent labware
                # and the underlying non-labware parent location.
                direct_parent_offset = self._nominal_gripper_offsets_for_location(
                    location
                )
                ancestor = self._labware.get_parent_location(location.labwareId)
                assert isinstance(
                    ancestor, (DeckSlotLocation, ModuleLocation)
                ), "No gripper offsets for off-deck labware"
                return (
                    direct_parent_offset.pickUpOffset
                    + self._nominal_gripper_offsets_for_location(
                        location=ancestor
                    ).pickUpOffset
                )
        else:
            if isinstance(
                location, (ModuleLocation, DeckSlotLocation, AddressableAreaLocation)
            ):
                return self._nominal_gripper_offsets_for_location(location).dropOffset
            else:
                # If it's a labware on a labware (most likely an adapter),
                # we calculate the offset as sum of offsets for the direct parent labware
                # and the underlying non-labware parent location.
                direct_parent_offset = self._nominal_gripper_offsets_for_location(
                    location
                )
                ancestor = self._labware.get_parent_location(location.labwareId)
                assert isinstance(
                    ancestor, (DeckSlotLocation, ModuleLocation)
                ), "No gripper offsets for off-deck labware"
                return (
                    direct_parent_offset.dropOffset
                    + self._nominal_gripper_offsets_for_location(
                        location=ancestor
                    ).dropOffset
                )

    def check_gripper_labware_tip_collision(
        self,
        gripper_homed_position_z: float,
        labware_id: str,
        current_location: OnDeckLabwareLocation,
    ) -> None:
        """Check for potential collision of tips against labware to be lifted."""
        # TODO(cb, 2024-01-22): Remove the 1 and 8 channel special case once we are doing X axis validation
        pipettes = self._pipettes.get_all()
        for pipette in pipettes:
            if self._pipettes.get_channels(pipette.id) in [1, 8]:
                return

            tip = self._pipettes.get_attached_tip(pipette.id)
            if tip:
                labware_top_z_when_gripped = gripper_homed_position_z + (
                    self.get_labware_highest_z(labware_id=labware_id)
                    - self.get_labware_grip_point(
                        labware_id=labware_id, location=current_location
                    ).z
                )
                # TODO(cb, 2024-01-18): Utilizing the nozzle map and labware X coordinates verify if collisions will occur on the X axis (analysis will use hard coded data to measure from the gripper critical point to the pipette mount)
                if (
                    _PIPETTE_HOMED_POSITION_Z - tip.length
                ) < labware_top_z_when_gripped:
                    raise LabwareMovementNotAllowedError(
                        f"Cannot move labware '{self._labware.get(labware_id).loadName}' when {int(tip.volume)} µL tips are attached."
                    )
        return

    def _nominal_gripper_offsets_for_location(
        self, location: OnDeckLabwareLocation
    ) -> LabwareMovementOffsetData:
        """Provide the default gripper offset data for the given location type."""
        if isinstance(location, (DeckSlotLocation, AddressableAreaLocation)):
            # TODO we might need a separate type of gripper offset for addressable areas but that also might just
            #   be covered by the drop labware offset/location
            offsets = self._labware.get_deck_default_gripper_offsets()
        elif isinstance(location, ModuleLocation):
            offsets = self._modules.get_default_gripper_offsets(location.moduleId)
        else:
            # Labware is on a labware/adapter
            offsets = self._labware_gripper_offsets(location.labwareId)
        return offsets or LabwareMovementOffsetData(
            pickUpOffset=LabwareOffsetVector(x=0, y=0, z=0),
            dropOffset=LabwareOffsetVector(x=0, y=0, z=0),
        )

    def _labware_gripper_offsets(
        self, labware_id: str
    ) -> Optional[LabwareMovementOffsetData]:
        """Provide the most appropriate gripper offset data for the specified labware.

        We check the types of gripper offsets available for the labware ("default" or slot-based)
        and return the most appropriate one for the overall location of the labware.
        Currently, only module adapters (specifically, the H/S universal flat adapter)
        have non-default offsets that are specific to location of the module on deck,
        so, this code only checks for the presence of those known offsets.
        """
        parent_location = self._labware.get_parent_location(labware_id)
        assert isinstance(
            parent_location, (DeckSlotLocation, ModuleLocation)
        ), "No gripper offsets for off-deck labware"

        if isinstance(parent_location, DeckSlotLocation):
            slot_name = parent_location.slotName
        else:
            module_loc = self._modules.get_location(parent_location.moduleId)
            slot_name = module_loc.slotName

        slot_based_offset = self._labware.get_labware_gripper_offsets(
            labware_id=labware_id, slot_name=slot_name.to_ot3_equivalent()
        )

        return slot_based_offset or self._labware.get_labware_gripper_offsets(
            labware_id=labware_id, slot_name=None
        )

    def get_offset_location(self, labware_id: str) -> Optional[LabwareOffsetLocation]:
        """Provide the LabwareOffsetLocation specifying the current position of the labware.

        If the labware is in a location that cannot be specified by a LabwareOffsetLocation
        (for instance, OFF_DECK) then return None.
        """
        parent_location = self._labware.get_location(labware_id)

        if isinstance(parent_location, DeckSlotLocation):
            return LabwareOffsetLocation(
                slotName=parent_location.slotName, moduleModel=None, definitionUri=None
            )
        elif isinstance(parent_location, ModuleLocation):
            module_model = self._modules.get_requested_model(parent_location.moduleId)
            module_location = self._modules.get_location(parent_location.moduleId)
            return LabwareOffsetLocation(
                slotName=module_location.slotName,
                moduleModel=module_model,
                definitionUri=None,
            )
        elif isinstance(parent_location, OnLabwareLocation):
            non_labware_parent_location = self._labware.get_parent_location(labware_id)

            parent_uri = self._labware.get_definition_uri(parent_location.labwareId)
            if isinstance(non_labware_parent_location, DeckSlotLocation):
                return LabwareOffsetLocation(
                    slotName=non_labware_parent_location.slotName,
                    moduleModel=None,
                    definitionUri=parent_uri,
                )
            elif isinstance(non_labware_parent_location, ModuleLocation):
                module_model = self._modules.get_requested_model(
                    non_labware_parent_location.moduleId
                )
                module_location = self._modules.get_location(
                    non_labware_parent_location.moduleId
                )
                return LabwareOffsetLocation(
                    slotName=module_location.slotName,
                    moduleModel=module_model,
                    definitionUri=parent_uri,
                )

        return None
