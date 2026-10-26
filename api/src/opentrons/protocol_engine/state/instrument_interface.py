"""Instrument labware interfacing state getters."""

import enum
from logging import getLogger
from typing import Dict, Optional, Tuple, cast

from opentrons_shared_data.errors.exceptions import (
    InvalidStoredData,
    PipetteLiquidNotFoundError,
)
from opentrons_shared_data.pipette.constants import PIPETTE_X_SPAN
from opentrons_shared_data.pipette.types import ChannelCount

from .. import errors
from ..errors import LabwareMovementNotAllowedError
from ..types import (
    AddressableOffsetVector,
    DropTipWellLocation,
    DropTipWellOrigin,
    LiquidHandlingWellLocation,
    OnDeckLabwareLocation,
    PickUpTipWellLocation,
    TipGeometry,
    WellLocation,
    WellLocationFunction,
    WellLocationType,
    WellOffset,
    WellOrigin,
)
from ..types.liquid_level_detection import LiquidTrackingType, SimulatedProbeResult
from ._well_math import nozzles_per_well, wells_covered_by_pipette_configuration
from .addressable_areas import AddressableAreaView
from .geometry import GeometryView
from .labware import LabwareView
from .liquid_tracking import LiquidTrackingView
from .pipettes import PipetteView
from opentrons.types import (
    MeniscusTrackingTarget,
    MountType,
    Point,
)

_LOG = getLogger(__name__)
SLOT_WIDTH = 128
_PIPETTE_HOMED_POSITION_Z = (
    248.0  # Height of the bottom of the nozzle without the tip attached when homed
)


class _TipDropSection(enum.Enum):
    """Well sections to drop tips in."""

    LEFT = "left"
    RIGHT = "right"


class InstrumentInterfaceView:
    """Instrument-labware interface state getters and validators."""

    def __init__(
        self,
        labware_view: LabwareView,
        pipette_view: PipetteView,
        addressable_area_view: AddressableAreaView,
        geometry_view: GeometryView,
        liquid_tracking_view: LiquidTrackingView,
    ) -> None:
        self._labware = labware_view
        self._pipettes = pipette_view
        self._addressable_areas = addressable_area_view
        self._geometry = geometry_view
        self._liquid_tracking = liquid_tracking_view
        self._last_drop_tip_location_spot: Dict[str, _TipDropSection] = {}

    def validate_probed_height(
        self,
        labware_id: str,
        well_name: str,
        pipette_id: str,
        probed_height: LiquidTrackingType,
    ) -> None:
        """Raise an error if a probed liquid height is not within well bounds."""
        if isinstance(probed_height, SimulatedProbeResult):
            return
        lld_min_height = self._pipettes.get_current_tip_lld_settings(
            pipette_id=pipette_id
        )
        well_def = self._labware.get_well_definition(labware_id, well_name)
        well_depth = well_def.depth
        if probed_height < lld_min_height:
            raise PipetteLiquidNotFoundError(
                f"Liquid Height of {probed_height} mm is lower minimum allowed lld height {lld_min_height} mm."
            )
        if probed_height > well_depth:
            raise PipetteLiquidNotFoundError(
                f"Liquid Height of {probed_height} mm is greater than maximum well height {well_depth} mm."
            )

    def get_well_position(
        self,
        labware_id: str,
        well_name: str,
        well_location: Optional[WellLocationType] = None,
        operation_volume: Optional[float] = None,
        pipette_id: Optional[str] = None,
    ) -> Point:
        """Given relative well location in a labware, get absolute position."""
        labware_pos = self._geometry.get_labware_position(labware_id)
        well_def = self._labware.get_well_definition(labware_id, well_name)
        well_depth = well_def.depth

        offset = WellOffset(x=0, y=0, z=well_depth)
        if well_location is not None:
            offset = well_location.offset  # location of the bottom of the well
            offset_adjustment = self._liquid_tracking.get_well_offset_adjustment(
                labware_id=labware_id,
                well_name=well_name,
                well_location=well_location,
                well_depth=well_depth,
                operation_volume=operation_volume,
                pipette_id=pipette_id,
            )
            if not isinstance(offset_adjustment, SimulatedProbeResult):
                offset = offset.model_copy(update={"z": offset.z + offset_adjustment})
        return Point(
            x=labware_pos.x + offset.x + well_def.x,
            y=labware_pos.y + offset.y + well_def.y,
            z=labware_pos.z + offset.z + well_def.z,
        )

    def _get_relative_liquid_handling_well_location(
        self,
        absolute_point: Point,
        delta: Point,
        meniscus_tracking: Optional[MeniscusTrackingTarget] = None,
    ) -> Tuple[WellLocationType, bool]:
        """Given absolute position, get relative location of a well in a labware."""
        dynamic_liquid_tracking = False
        if meniscus_tracking:
            location = LiquidHandlingWellLocation(
                origin=WellOrigin.MENISCUS,
                offset=WellOffset(
                    x=absolute_point.x, y=absolute_point.y, z=absolute_point.z
                ),
            )
            # TODO(cm): handle operationVolume being a float other than 0
            if meniscus_tracking == MeniscusTrackingTarget.END:
                location.volumeOffset = "operationVolume"
            elif meniscus_tracking == MeniscusTrackingTarget.DYNAMIC:
                dynamic_liquid_tracking = True
        else:
            location = LiquidHandlingWellLocation(
                offset=WellOffset(x=delta.x, y=delta.y, z=delta.z)
            )
        return location, dynamic_liquid_tracking

    def get_relative_well_location(
        self,
        labware_id: str,
        well_name: str,
        absolute_point: Point,
        location_type: WellLocationFunction,
        meniscus_tracking: Optional[MeniscusTrackingTarget] = None,
    ) -> Tuple[WellLocationType, bool]:
        """Given absolute position, get relative location of a well in a labware."""
        well_absolute_point = self.get_well_position(labware_id, well_name)
        delta = absolute_point - well_absolute_point
        match location_type:
            case WellLocationFunction.BASE | WellLocationFunction.DROP_TIP:
                return (
                    WellLocation(offset=WellOffset(x=delta.x, y=delta.y, z=delta.z)),
                    False,
                )
            case WellLocationFunction.PICK_UP_TIP:
                return (
                    PickUpTipWellLocation(
                        offset=WellOffset(x=delta.x, y=delta.y, z=delta.z)
                    ),
                    False,
                )
            case WellLocationFunction.LIQUID_HANDLING:
                return self._get_relative_liquid_handling_well_location(
                    absolute_point=absolute_point,
                    delta=delta,
                    meniscus_tracking=meniscus_tracking,
                )

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
                f"Well {well_name} in labware {self._labware.get_display_name(labware_id)} is not circular."
            )

        return TipGeometry(
            length=effective_length,
            diameter=well_def.diameter,
            # TODO(mc, 2020-11-12): WellDefinition type says totalLiquidVolume
            #  is a float, but hardware controller expects an int
            volume=int(well_def.totalLiquidVolume),
        )

    def get_checked_tip_drop_location(
        self,
        pipette_id: str,
        labware_id: str,
        well_location: DropTipWellLocation,
        api_version_allows_partial_return_tip: bool = True,
        override_default_offset: float | None = None,
    ) -> WellLocation:
        """Get tip drop location given labware and hardware pipette.

        This makes sure that the well location has an appropriate origin & offset
        if one is not already set previously.

        In API levels before 2.28, we did not support dropping tips in a tip rack
        while in a partial configuration. The boolean variable `api_version_allows_partial_return_tip`
        will be set to False if called by a protocol API layer and the API level is both below
        v2.28 and the pipette is partially configured.
        """
        if (
            not api_version_allows_partial_return_tip
            and self._labware.get_definition(labware_id).parameters.isTiprack
        ):
            raise errors.UnexpectedProtocolError(
                "Cannot return tip to a tip rack while the pipette is"
                " configured for partial tip before API version 2.28."
            )
        if well_location.origin != DropTipWellOrigin.DEFAULT:
            return WellLocation(
                origin=WellOrigin(well_location.origin.value),
                offset=well_location.offset,
            )
        if override_default_offset is not None:
            z_offset = override_default_offset
        elif self._labware.get_definition(labware_id).parameters.isTiprack:
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

        labware_slot_column = self._geometry.get_slot_column(
            slot_name=self._geometry.get_ancestor_slot_name(labware_id)
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

        labware_slot_column = self._geometry.get_slot_column(
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
            self._last_drop_tip_location_spot[addressable_area_name] = (
                _TipDropSection.LEFT
            )
        else:
            # Drop tip in RIGHT section
            x_offset = self._get_drop_tip_well_x_offset(
                tip_drop_section=_TipDropSection.RIGHT,
                well_x_dim=area_x_dim,
                pipette_channels=pipette_channels,
                pipette_mount=pipette_mount,
                labware_slot_column=labware_slot_column,
            )
            self._last_drop_tip_location_spot[addressable_area_name] = (
                _TipDropSection.RIGHT
            )

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

    # todo(mm, 2024-11-05): This may be incorrect because it does not take the following
    # offsets into account, which *are* taken into account for the actual gripper movement:
    #
    # * The pickup offset in the definition of the parent of the gripped labware.
    # * The "additional offset" or "user offset", e.g. the `pickUpOffset` and `dropOffset`
    #   params in the `moveLabware` command.
    #
    # For robustness, we should combine this with `get_gripper_labware_movement_waypoints()`.
    #
    # We should also be more explicit about which offsets act to move the gripper paddles
    # relative to the gripped labware, and which offsets act to change how the gripped
    # labware sits atop its parent. Those have different effects on how far the gripped
    # labware juts beyond the paddles while it's in transit.
    def check_gripper_labware_tip_collision(
        self,
        gripper_homed_position_z: float,
        labware_id: str,
        # todo(mm, 2025-07-31): arg unused, investigate or remove.
        current_location: OnDeckLabwareLocation,
    ) -> None:
        """Check for potential collision of tips against labware to be lifted."""
        labware_definition = self._labware.get_definition(labware_id)
        pipettes = self._pipettes.get_all()
        for pipette in pipettes:
            # TODO(cb, 2024-01-22): Remove the 1 and 8 channel special case once we are doing X axis validation
            if self._pipettes.get_channels(pipette.id) in [1, 8]:
                return

            tip = self._pipettes.get_attached_tip(pipette.id)
            if not tip:
                continue

            labware_origin_to_grip_point = self._labware.get_grip_z(labware_definition)
            grip_point_to_labware_origin = -labware_origin_to_grip_point
            height_above_labware_origin = self._labware.get_extents_around_lw_origin(
                labware_definition
            ).max_z
            labware_top_z_when_gripped = (
                gripper_homed_position_z
                + grip_point_to_labware_origin
                + height_above_labware_origin
            )

            # TODO(cb, 2024-01-18): Utilizing the nozzle map and labware X coordinates,
            # verify if collisions will occur on the X axis (analysis will use hard coded data
            # to measure from the gripper critical point to the pipette mount)
            if (_PIPETTE_HOMED_POSITION_Z - tip.length) < labware_top_z_when_gripped:
                raise LabwareMovementNotAllowedError(
                    f"Cannot move labware '{labware_definition.parameters.loadName}' when {int(tip.volume)} µL tips are attached."
                )

    def get_wells_covered_by_pipette_with_active_well(
        self, labware_id: str, target_well_name: str, pipette_id: str
    ) -> list[str]:
        """Get a flat list of wells that are covered by a pipette when moved to a specified well.

        When you move a pipette in a multichannel configuration  to a specific well - the target well -
        the pipette will operate on other wells as well.

        For instance, a pipette with a COLUMN configuration with well A1 of an SBS standard labware target
        will also "cover", under this definition, wells B1-H1. That same pipette, when C5 is the target well, will "cover"
        wells C5-H5.

        This math only works, and may only be applied, if one of the following is true:
        - The pipette is in a SINGLE configuration
        - The pipette is in a non-SINGLE configuration, and the labware is an SBS-format 96 or 384 well plate (and is so
          marked in its definition's parameters.format key, as 96Standard or 384Standard)

        If all of the following do not apply, regardless of the nozzle configuration of the pipette this function will
        return only the labware covered by the primary well.
        """
        pipette_nozzle_map = self._pipettes.get_nozzle_configuration(pipette_id)
        labware_columns = [
            column for column in self._labware.get_definition(labware_id).ordering
        ]
        try:
            return list(
                wells_covered_by_pipette_configuration(
                    pipette_nozzle_map, target_well_name, labware_columns
                )
            )
        except InvalidStoredData:
            return [target_well_name]

    def get_nozzles_per_well(
        self, labware_id: str, target_well_name: str, pipette_id: str
    ) -> int:
        """Get the number of nozzles that will interact with each well."""
        return nozzles_per_well(
            self._pipettes.get_nozzle_configuration(pipette_id),
            target_well_name,
            self._labware.get_definition(labware_id).ordering,
        )
