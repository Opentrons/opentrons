"""Liquid Tracking state getters."""

from logging import getLogger
from typing import Optional

from opentrons_shared_data.labware.labware_definition import InnerWellGeometry

from .. import errors
from ..errors.exceptions import (
    InvalidLiquidHeightFound,
)
from ..types import (
    LiquidHandlingWellLocation,
    WellLocationType,
    WellOrigin,
)
from ..types.liquid_level_detection import LiquidTrackingType, SimulatedProbeResult
from ._well_math import nozzles_per_well
from .geometry import GeometryView
from .inner_well_math_utils import (
    find_height_inner_well_geometry,
    find_height_user_defined_volumes,
    find_volume_inner_well_geometry,
    find_volume_user_defined_volumes,
)
from .labware import LabwareView
from .pipettes import PipetteView
from .wells import WellView

_LOG = getLogger(__name__)


class LiquidTrackingView:
    """Liquid tracking getter and validation methods."""

    def __init__(
        self,
        labware_view: LabwareView,
        well_view: WellView,
        pipette_view: PipetteView,
        geometry_view: GeometryView,
    ) -> None:
        self._labware = labware_view
        self._wells = well_view
        self._pipettes = pipette_view
        self._geometry = geometry_view

    def get_well_offset_adjustment(
        self,
        labware_id: str,
        well_name: str,
        well_location: WellLocationType,
        pipette_id: Optional[str] = None,
        operation_volume: Optional[float] = None,
    ) -> LiquidTrackingType:
        """Return a z-axis distance that accounts for well handling height and operation volume.

        Distance is with reference to the well bottom.
        """
        initial_handling_height: LiquidTrackingType = 0.0
        if well_location.origin == WellOrigin.MENISCUS:
            initial_handling_height = self.get_meniscus_height(
                labware_id=labware_id, well_name=well_name
            )
            # If we're tracking a MENISCUS origin, and targeting either the beginning
            # position of the liquid or doing dynamic tracking, return the initial height
            if (
                hasattr(well_location, "volumeOffset")
                and not well_location.volumeOffset
            ):
                return initial_handling_height

        volume: Optional[float] = None
        if isinstance(well_location, LiquidHandlingWellLocation):
            if well_location.volumeOffset == "operationVolume":
                volume = operation_volume or 0.0
            else:
                if not isinstance(well_location.volumeOffset, float):
                    raise ValueError("Invalid volume offset.")
                volume = well_location.volumeOffset

        if volume:
            if pipette_id is None:
                raise ValueError(
                    "cannot get liquid handling offset without pipette id."
                )
            liquid_height_after = self.get_well_height_after_liquid_handling(
                labware_id=labware_id,
                well_name=well_name,
                pipette_id=pipette_id,
                initial_height=initial_handling_height,
                volume=volume,
            )
            return liquid_height_after
        return initial_handling_height

    def well_has_tracked_liquid(
        self,
        labware_id: str,
        well_name: str,
    ) -> bool:
        """Returns true if this well has had a liquid loaded or a probe result."""
        last_updated = self._wells.get_last_liquid_update(labware_id, well_name)
        return last_updated is not None

    def get_current_well_volume(
        self,
        labware_id: str,
        well_name: str,
    ) -> LiquidTrackingType:
        """Returns most recently updated volume in specified well."""
        last_updated = self._wells.get_last_liquid_update(labware_id, well_name)
        if last_updated is None:
            raise errors.LiquidHeightUnknownError(
                "Must LiquidProbe or LoadLiquid before specifying WellOrigin.MENISCUS."
            )

        well_liquid = self._wells.get_well_liquid_info(
            labware_id=labware_id, well_name=well_name
        )
        if (
            well_liquid.probed_height is not None
            and well_liquid.probed_height.height is not None
            and well_liquid.probed_height.last_probed == last_updated
        ):
            volume = self.get_well_volume_at_height(
                labware_id=labware_id,
                well_name=well_name,
                height=well_liquid.probed_height.height,
            )
            return volume
        elif (
            well_liquid.loaded_volume is not None
            and well_liquid.loaded_volume.volume is not None
            and well_liquid.loaded_volume.last_loaded == last_updated
        ):
            return well_liquid.loaded_volume.volume
        elif (
            well_liquid.probed_volume is not None
            and well_liquid.probed_volume.volume is not None
            and well_liquid.probed_volume.last_probed == last_updated
        ):
            return well_liquid.probed_volume.volume
        else:
            # This should not happen if there was an update but who knows
            raise errors.LiquidVolumeUnknownError(
                f"Unable to find liquid volume despite an update at {last_updated}."
            )

    def get_meniscus_height(
        self,
        labware_id: str,
        well_name: str,
    ) -> LiquidTrackingType:
        """Returns stored meniscus height in specified well."""
        last_updated = self._wells.get_last_liquid_update(labware_id, well_name)
        if last_updated is None:
            raise errors.LiquidHeightUnknownError(
                "Must LiquidProbe or LoadLiquid before specifying WellOrigin.MENISCUS."
            )

        well_liquid = self._wells.get_well_liquid_info(
            labware_id=labware_id, well_name=well_name
        )
        if (
            well_liquid.probed_height is not None
            and well_liquid.probed_height.height is not None
            and well_liquid.probed_height.last_probed == last_updated
        ):
            return well_liquid.probed_height.height
        elif (
            well_liquid.loaded_volume is not None
            and well_liquid.loaded_volume.volume is not None
            and well_liquid.loaded_volume.last_loaded == last_updated
        ):
            return self.get_well_height_at_volume(
                labware_id=labware_id,
                well_name=well_name,
                volume=well_liquid.loaded_volume.volume,
            )
        elif (
            well_liquid.probed_volume is not None
            and well_liquid.probed_volume.volume is not None
            and well_liquid.probed_volume.last_probed == last_updated
        ):
            return self.get_well_height_at_volume(
                labware_id=labware_id,
                well_name=well_name,
                volume=well_liquid.probed_volume.volume,
            )
        else:
            # This should not happen if there was an update but who knows
            raise errors.LiquidHeightUnknownError(
                f"Unable to find liquid height despite an update at {last_updated}."
            )

    def _get_well_handling_height(
        self,
        labware_id: str,
        well_name: str,
        well_location: WellLocationType,
        well_depth: float,
    ) -> LiquidTrackingType:
        """Return the handling height for a labware well (with reference to the well bottom)."""
        handling_height: LiquidTrackingType = 0.0
        if well_location.origin == WellOrigin.TOP:
            handling_height = float(well_depth)
        elif well_location.origin == WellOrigin.CENTER:
            handling_height = float(well_depth / 2.0)
        elif well_location.origin == WellOrigin.MENISCUS:
            handling_height = self.get_meniscus_height(
                labware_id=labware_id, well_name=well_name
            )
        return handling_height

    def _find_volume_at_well_height(
        self,
        labware_id: str,
        well_name: str,
        target_height: LiquidTrackingType,
    ) -> LiquidTrackingType:
        """Call the correct volume from height function based on well geometry type."""
        well_geometry = self._labware.get_well_geometry(
            labware_id=labware_id, well_name=well_name
        )
        if isinstance(well_geometry, InnerWellGeometry):
            return find_volume_inner_well_geometry(
                target_height=target_height, well_geometry=well_geometry
            )
        else:
            return find_volume_user_defined_volumes(
                target_height=target_height, well_geometry=well_geometry
            )

    def _find_height_at_well_volume(
        self,
        labware_id: str,
        well_name: str,
        target_volume: LiquidTrackingType,
    ) -> LiquidTrackingType:
        """Call the correct height from volume function based on well geometry type."""
        well_geometry = self._labware.get_well_geometry(
            labware_id=labware_id, well_name=well_name
        )
        if isinstance(well_geometry, InnerWellGeometry):
            return find_height_inner_well_geometry(
                target_volume=target_volume, well_geometry=well_geometry
            )
        else:
            return find_height_user_defined_volumes(
                target_volume=target_volume, well_geometry=well_geometry
            )

    def get_well_height_after_liquid_handling(
        self,
        labware_id: str,
        well_name: str,
        pipette_id: str,
        initial_height: LiquidTrackingType,
        volume: float,
    ) -> LiquidTrackingType:
        """Return the height of liquid in a labware well after a given volume has been handled.

        This is given an initial handling height, with reference to the well bottom.
        """
        well_def = self._labware.get_well_definition(labware_id, well_name)
        well_depth = well_def.depth

        try:
            initial_volume = self._find_volume_at_well_height(
                labware_id=labware_id, well_name=well_name, target_height=initial_height
            )
            # TODO(jbl, 2026-10-15) DRY. Should try and refactor this out (or the outlying function)
            nozzles_used = nozzles_per_well(
                self._pipettes.get_nozzle_configuration(pipette_id),
                well_name,
                self._labware.get_definition(labware_id).ordering,
            )
            final_volume = initial_volume + volume * nozzles_used
            # NOTE(cm): if final_volume is outside the bounds of the well, it will get
            # adjusted inside find_height_at_well_volume to accommodate well the height
            # calculation.
            height_inside_well = self._find_height_at_well_volume(
                labware_id=labware_id, well_name=well_name, target_volume=final_volume
            )
            return self._validate_well_position(
                target_height=height_inside_well,
                well_max_height=well_depth,
                pipette_id=pipette_id,
            )
        except InvalidLiquidHeightFound as _exception:
            raise InvalidLiquidHeightFound(
                message=_exception.message
                + f"for well {well_name} of {self._labware.get_display_name(labware_id)} on"
                f" slot {self._geometry.get_ancestor_slot_name(labware_id)}"
            )

    def _validate_well_position(
        self,
        target_height: LiquidTrackingType,  # height in mm inside a well relative to the bottom
        well_max_height: float,
        pipette_id: str,
    ) -> LiquidTrackingType:
        """If well offset would be outside the bounds of a well, silently bring it back to the boundary."""
        if isinstance(target_height, SimulatedProbeResult):
            return target_height
        lld_min_height = self._pipettes.get_current_tip_lld_settings(
            pipette_id=pipette_id
        )
        if target_height < lld_min_height:
            target_height = lld_min_height
        elif target_height > well_max_height:
            target_height = well_max_height
        return target_height

    def get_well_height_at_volume(
        self, labware_id: str, well_name: str, volume: LiquidTrackingType
    ) -> LiquidTrackingType:
        """Convert well volume to height."""
        try:
            return self._find_height_at_well_volume(
                labware_id=labware_id, well_name=well_name, target_volume=volume
            )
        except InvalidLiquidHeightFound as _exception:
            raise InvalidLiquidHeightFound(
                message=_exception.message
                + f"for well {well_name} of {self._labware.get_display_name(labware_id)} on"
                f" slot {self._geometry.get_ancestor_slot_name(labware_id)}"
            )

    def get_well_volume_at_height(
        self,
        labware_id: str,
        well_name: str,
        height: LiquidTrackingType,
    ) -> LiquidTrackingType:
        """Convert well height to volume."""
        try:
            return self._find_volume_at_well_height(
                labware_id=labware_id, well_name=well_name, target_height=height
            )
        except InvalidLiquidHeightFound as _exception:
            raise InvalidLiquidHeightFound(
                message=_exception.message
                + f"for well {well_name} of {self._labware.get_display_name(labware_id)} on"
                f" slot {self._geometry.get_ancestor_slot_name(labware_id)}"
            )
