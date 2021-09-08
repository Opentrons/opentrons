"""Geometry state getters."""
from dataclasses import dataclass
from typing import Optional


from opentrons.types import Point
from opentrons.hardware_control.dev_types import PipetteDict

from .. import errors
from ..types import LoadedLabware, WellLocation, WellOrigin
from .labware import LabwareView


DEFAULT_TIP_DROP_HEIGHT_FACTOR = 0.5

# TODO(mc, 2020-11-12): reconcile this data structure with WellGeometry


@dataclass(frozen=True)
class TipGeometry:
    """Tip geometry data."""

    effective_length: float
    diameter: float
    volume: int


# TODO(mc, 2021-06-03): continue evaluation of which selectors should go here
# vs which selectors should be in LabwareView
class GeometryView:
    """Geometry computed state getters."""

    _labware: LabwareView

    def __init__(self, labware_view: LabwareView) -> None:
        """Initialize a GeometryView instance."""
        self._labware = labware_view

    def get_labware_highest_z(self, labware_id: str) -> float:
        """Get the highest Z-point of a labware."""
        labware_data = self._labware.get(labware_id)

        return self._get_highest_z_from_labware_data(labware_data)

    def get_all_labware_highest_z(self) -> float:
        """Get the highest Z-point across all labware."""
        return max(
            [
                self._get_highest_z_from_labware_data(lw_data)
                for lw_data in self._labware.get_all()
            ]
        )

    def get_labware_parent_position(self, labware_id: str) -> Point:
        """Get the position of the labware's parent slot (deck or module)."""
        labware_data = self._labware.get(labware_id)
        slot_pos = self._labware.get_slot_position(labware_data.location.slot)

        return slot_pos

    def get_labware_origin_position(self, labware_id: str) -> Point:
        """Get the position of the labware's origin, without calibration."""
        labware_data = self._labware.get(labware_id)
        slot_pos = self._labware.get_slot_position(labware_data.location.slot)
        origin_offset = self._labware.get_definition(labware_id).cornerOffsetFromSlot

        return Point(
            x=slot_pos.x + origin_offset.x,
            y=slot_pos.y + origin_offset.y,
            z=slot_pos.z + origin_offset.z,
        )

    def get_labware_position(self, labware_id: str) -> Point:
        """Get the calibrated origin of the labware."""
        origin_pos = self.get_labware_origin_position(labware_id)
        cal_offset = self._labware.get_calibration_offset(labware_id)

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
        """Get the absolute position of a well in a labware."""
        labware_pos = self.get_labware_position(labware_id)
        well_def = self._labware.get_well_definition(labware_id, well_name)
        well_depth = well_def.depth

        if well_location is not None:
            offset = well_location.offset

            if well_location.origin == WellOrigin.TOP:
                offset = (offset[0], offset[1], offset[2] + well_depth)

        else:
            offset = (0, 0, well_depth)

        return Point(
            x=labware_pos.x + offset[0] + well_def.x,
            y=labware_pos.y + offset[1] + well_def.y,
            z=labware_pos.z + offset[2] + well_def.z,
        )

    def _get_highest_z_from_labware_data(self, lw_data: LoadedLabware) -> float:
        labware_pos = self.get_labware_position(lw_data.id)
        definition = self._labware.get_definition(lw_data.id)
        z_dim = definition.dimensions.zDimension

        return labware_pos.z + z_dim

    # TODO(mc, 2020-11-12): reconcile with existing protocol logic and include
    # data from tip-length calibration once v4.0.0 is in `edge`
    def get_effective_tip_length(
        self,
        labware_id: str,
        pipette_config: PipetteDict,
    ) -> float:
        """Given a labware and a pipette's config, get the effective tip length.

        Effective tip length is the nominal tip length less the distance the
        tip overlaps with the pipette nozzle.
        """
        labware_uri = self._labware.get_definition_uri(labware_id)
        nominal_length = self._labware.get_tip_length(labware_id)
        overlap_config = pipette_config["tip_overlap"]
        default_overlap = overlap_config.get("default", 0)
        overlap = overlap_config.get(labware_uri, default_overlap)

        return nominal_length - overlap

    # TODO(mc, 2020-11-12): reconcile with existing geometry logic
    def get_tip_geometry(
        self,
        labware_id: str,
        well_name: str,
        pipette_config: PipetteDict,
    ) -> TipGeometry:
        """Given a labware, well, and hardware pipette config, get the tip geometry.

        Tip geometry includes effective tip length, tip diameter, and tip volume,
        which is all data required by the hardware controller for proper tip handling.
        """
        effective_length = self.get_effective_tip_length(labware_id, pipette_config)
        well_def = self._labware.get_well_definition(labware_id, well_name)

        if well_def.shape != "circular":
            raise errors.LabwareIsNotTipRackError(
                f"Well {well_name} in labware {labware_id} is not circular."
            )

        return TipGeometry(
            effective_length=effective_length,
            diameter=well_def.diameter,  # type: ignore[arg-type]
            # TODO(mc, 2020-11-12): WellDefinition type says totalLiquidVolume
            #  is a float, but hardware controller expects an int
            volume=int(well_def.totalLiquidVolume),
        )

    # TODO(mc, 2020-11-12): support pre-PAPIv2.2/2.3 behavior of dropping the tip
    # 10mm above well bottom
    def get_tip_drop_location(
        self,
        labware_id: str,
        pipette_config: PipetteDict,
    ) -> WellLocation:
        """Get tip drop location given labware and hardware pipette."""
        # return to top if labware is fixed trash
        is_fixed_trash = self._labware.get_has_quirk(
            labware_id=labware_id,
            quirk="fixedTrash",
        )

        if is_fixed_trash:
            return WellLocation()

        nominal_length = self._labware.get_tip_length(labware_id)
        offset_factor = pipette_config["return_tip_height"]

        return WellLocation(offset=(0, 0, -nominal_length * offset_factor))
