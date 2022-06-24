"""Geometry state getters."""
from dataclasses import dataclass
from typing import Optional, List

from opentrons.types import Point, DeckSlotName
from opentrons.hardware_control.dev_types import PipetteDict

from .. import errors
from ..types import (
    LoadedLabware,
    WellLocation,
    WellOrigin,
    WellOffset,
    DeckSlotLocation,
    ModuleLocation,
)
from .labware import LabwareView
from .modules import ModuleView


DEFAULT_TIP_DROP_HEIGHT_FACTOR = 0.5


@dataclass(frozen=True)
class TipGeometry:
    """Nominal tip geometry data.

    This data is loaded from definitions and configurations, and does
    not take calibration values into account.

    Props:
        effective_length: The nominal working length (total length minus overlap)
            of a tip, according to a tip rack and pipette's definitions.
        diameter: Nominal tip diameter.
        volume: Nominal volume capacity.
    """

    effective_length: float
    diameter: float
    volume: int


# TODO(mc, 2021-06-03): continue evaluation of which selectors should go here
# vs which selectors should be in LabwareView
class GeometryView:
    """Geometry computed state getters."""

    def __init__(self, labware_view: LabwareView, module_view: ModuleView) -> None:
        """Initialize a GeometryView instance."""
        self._labware = labware_view
        self._modules = module_view

    def get_labware_highest_z(self, labware_id: str) -> float:
        """Get the highest Z-point of a labware."""
        labware_data = self._labware.get(labware_id)

        return self._get_highest_z_from_labware_data(labware_data)

    # TODO(mc, 2022-06-24): rename this method
    def get_all_labware_highest_z(self) -> float:
        """Get the highest Z-point across all labware."""
        return max(
            *(
                self._get_highest_z_from_labware_data(lw_data)
                for lw_data in self._labware.get_all()
            ),
            *(
                self._modules.get_overall_height(module.id)
                for module in self._modules.get_all()
            ),
        )

    def get_labware_parent_position(self, labware_id: str) -> Point:
        """Get the position of the labware's parent slot (deck or module)."""
        labware_data = self._labware.get(labware_id)
        module_id: Optional[str] = None

        if isinstance(labware_data.location, DeckSlotLocation):
            slot_name = labware_data.location.slotName
        else:
            module_id = labware_data.location.moduleId
            slot_name = self._modules.get_location(module_id).slotName

        slot_pos = self._labware.get_slot_position(slot_name)

        if module_id is None:
            return slot_pos
        else:
            module_offset = self._modules.get_module_offset(module_id)
            return Point(
                x=slot_pos.x + module_offset.x,
                y=slot_pos.y + module_offset.y,
                z=slot_pos.z + module_offset.z,
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
        """Get the absolute position of a well in a labware."""
        labware_pos = self.get_labware_position(labware_id)
        well_def = self._labware.get_well_definition(labware_id, well_name)
        well_depth = well_def.depth

        if well_location is not None:
            offset = well_location.offset

            if well_location.origin == WellOrigin.TOP:
                offset = offset.copy(update={"z": offset.z + well_depth})

        else:
            offset = WellOffset(x=0, y=0, z=well_depth)

        return Point(
            x=labware_pos.x + offset.x + well_def.x,
            y=labware_pos.y + offset.y + well_def.y,
            z=labware_pos.z + offset.z + well_def.z,
        )

    def get_well_edges(
        self,
        labware_id: str,
        well_name: str,
        well_location: WellLocation,
    ) -> List[Point]:
        """Get list of absolute positions of four cardinal edges and center of well."""
        well_def = self._labware.get_well_definition(labware_id, well_name)
        if well_def.shape == "rectangular":
            x_size = well_def.xDimension
            y_size = well_def.yDimension
            if x_size is None or y_size is None:
                raise ValueError(
                    f"Rectangular well {well_name} does not have x and y dimensions"
                )
        elif well_def.shape == "circular":
            x_size = y_size = well_def.diameter
            if x_size is None or y_size is None:
                raise ValueError(f"Circular well {well_name} does not have diamater")
        else:
            raise ValueError(f'Shape "{well_def.shape}" is not a supported well shape')

        x_offset = x_size / 2.0
        y_offset = y_size / 2.0
        center = self.get_well_position(labware_id, well_name, well_location)
        return [
            center + Point(x=x_offset, y=0, z=0),  # right
            center + Point(x=-x_offset, y=0, z=0),  # left
            center,  # center
            center + Point(x=0, y=y_offset, z=0),  # up
            center + Point(x=0, y=-y_offset, z=0),  # down
        ]

    def _get_highest_z_from_labware_data(self, lw_data: LoadedLabware) -> float:
        labware_pos = self.get_labware_position(lw_data.id)
        definition = self._labware.get_definition(lw_data.id)
        z_dim = definition.dimensions.zDimension
        height_over_labware: float = 0
        if isinstance(lw_data.location, ModuleLocation):
            module_id = lw_data.location.moduleId
            height_over_labware = self._modules.get_height_over_labware(module_id)
        return labware_pos.z + z_dim + height_over_labware

    def get_nominal_effective_tip_length(
        self,
        labware_id: str,
        pipette_config: PipetteDict,
    ) -> float:
        """Given a labware and a pipette's config, get the effective tip length.

        Effective tip length is the nominal tip length less the distance the
        tip overlaps with the pipette nozzle. This does not take calibrated
        tip lengths into account. For calibrated data,
        see `LabwareDataProvider.get_calibrated_tip_length`.
        """
        labware_uri = self._labware.get_definition_uri(labware_id)
        nominal_length = self._labware.get_tip_length(labware_id)
        overlap_config = pipette_config["tip_overlap"]
        default_overlap = overlap_config.get("default", 0)
        overlap = overlap_config.get(labware_uri, default_overlap)

        return nominal_length - overlap

    def get_nominal_tip_geometry(
        self,
        labware_id: str,
        pipette_config: PipetteDict,
        well_name: Optional[str] = None,
    ) -> TipGeometry:
        """Given a labware, well, and hardware pipette config, get the tip geometry.

        Tip geometry includes effective tip length, tip diameter, and tip volume,
        which is all data required by the hardware controller for proper tip handling.

        This geometry data is based solely on labware and pipette definitions and
        does not take calibrated tip lengths into account.
        """
        effective_length = self.get_nominal_effective_tip_length(
            labware_id=labware_id,
            pipette_config=pipette_config,
        )
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
        pipette_config: PipetteDict,
        labware_id: str,
        well_location: WellLocation,
    ) -> WellLocation:
        """Get tip drop location given labware and hardware pipette."""
        if well_location.origin != WellOrigin.TOP:
            raise errors.WellOriginNotAllowedError(
                'Drop tip location must be relative to "top"'
            )

        # return to top if labware is fixed trash
        if self._labware.get_has_quirk(labware_id=labware_id, quirk="fixedTrash"):
            return well_location

        nominal_length = self._labware.get_tip_length(labware_id)
        offset_factor = pipette_config["return_tip_height"]
        tip_z_offset = nominal_length * offset_factor

        return WellLocation(
            offset=WellOffset(
                x=well_location.offset.x,
                y=well_location.offset.y,
                z=well_location.offset.z - tip_z_offset,
            )
        )

    def get_ancestor_slot_name(self, labware_id: str) -> DeckSlotName:
        """Get the slot name of the labware or the module that the labware is on."""
        labware = self._labware.get(labware_id)
        slot_name: DeckSlotName

        if isinstance(labware.location, DeckSlotLocation):
            slot_name = labware.location.slotName
        else:
            module_id = labware.location.moduleId
            slot_name = self._modules.get_location(module_id).slotName
        return slot_name
