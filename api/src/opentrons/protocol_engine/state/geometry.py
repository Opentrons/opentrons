"""Geometry state getters."""
from typing import Optional, List, Set, Tuple, Union

from opentrons.types import Point, DeckSlotName

from .. import errors
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
    ModuleOffsetVector,
    LabwareLocation,
    LabwareOffsetVector,
    DeckType,
    CurrentWell,
    TipGeometry,
)
from .config import Config
from .labware import LabwareView
from .modules import ModuleView
from .pipettes import PipetteView


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
    ) -> None:
        """Initialize a GeometryView instance."""
        self._config = config
        self._labware = labware_view
        self._modules = module_view
        self._pipettes = pipette_view

    def get_labware_highest_z(self, labware_id: str) -> float:
        """Get the highest Z-point of a labware."""
        labware_data = self._labware.get(labware_id)

        return self._get_highest_z_from_labware_data(labware_data)

    # TODO(mc, 2022-06-24): rename this method
    def get_all_labware_highest_z(self) -> float:
        """Get the highest Z-point across all labware."""
        highest_labware_z = max(
            (
                self._get_highest_z_from_labware_data(lw_data)
                for lw_data in self._labware.get_all()
                if lw_data.location != OFF_DECK_LOCATION
            ),
            default=0.0,
        )

        highest_module_z = max(
            (
                self._modules.get_overall_height(module.id)
                for module in self._modules.get_all()
            ),
            default=0.0,
        )

        return max(highest_labware_z, highest_module_z)

    def get_min_travel_z(
        self,
        pipette_id: str,
        labware_id: str,
        location: Optional[CurrentWell],
        minimum_z_height: Optional[float],
    ) -> float:
        """Get the minimum allowed travel height of an arc move."""
        if (
            location is not None
            and pipette_id == location.pipette_id
            and labware_id == location.labware_id
        ):
            min_travel_z = self.get_labware_highest_z(labware_id)
        else:
            min_travel_z = self.get_all_labware_highest_z()
        if minimum_z_height:
            min_travel_z = max(min_travel_z, minimum_z_height)
        return min_travel_z

    def get_labware_parent_nominal_position(self, labware_id: str) -> Point:
        """Get the position of the labware's uncalibrated parent slot (deck, module, or another labware)."""
        slot_name = self.get_ancestor_slot_name(labware_id)
        slot_pos = self._labware.get_slot_position(slot_name)
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
        """Gets the offset vector of a labware on the given location."""
        if isinstance(labware_location, DeckSlotLocation):
            return LabwareOffsetVector(x=0, y=0, z=0)
        elif isinstance(labware_location, ModuleLocation):
            module_id = labware_location.moduleId
            deck_type = DeckType(self._labware.get_deck_definition()["otId"])
            module_offset = self._modules.get_nominal_module_offset(
                module_id=module_id, deck_type=deck_type
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

    def _get_calibrated_module_offset(
        self, location: LabwareLocation
    ) -> ModuleOffsetVector:
        """Get a labware location's underlying calibrated module offset, if it is on a module."""
        if isinstance(location, ModuleLocation):
            module_id = location.moduleId
            return self._modules.get_module_calibration_offset(module_id)
        elif isinstance(location, DeckSlotLocation):
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

    def get_tip_drop_location(
        self,
        pipette_id: str,
        labware_id: str,
        well_location: DropTipWellLocation,
    ) -> WellLocation:
        """Get tip drop location given labware and hardware pipette."""
        if well_location.origin != DropTipWellOrigin.DEFAULT:
            return WellLocation(
                origin=WellOrigin(well_location.origin.value),
                offset=well_location.offset,
            )

        # return to top if labware is fixed trash
        if self._labware.get_has_quirk(labware_id=labware_id, quirk="fixedTrash"):
            z_offset = well_location.offset.z
        else:
            z_offset = self._labware.get_tip_drop_z_offset(
                labware_id=labware_id,
                length_scale=self._pipettes.get_return_tip_scale(pipette_id),
                additional_offset=well_location.offset.z,
            )

        return WellLocation(
            origin=WellOrigin.TOP,
            offset=WellOffset(
                x=well_location.offset.x,
                y=well_location.offset.y,
                z=z_offset,
            ),
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
        elif labware.location == OFF_DECK_LOCATION:
            raise errors.LabwareNotOnDeckError(
                f"Labware {labware_id} does not have a slot associated with it"
                f" since it is no longer on the deck."
            )

        return slot_name

    def ensure_location_not_occupied(
        self, location: LabwareLocation
    ) -> LabwareLocation:
        """Ensure that the location does not already have equipment in it."""
        if isinstance(location, (DeckSlotLocation, ModuleLocation)):
            self._labware.raise_if_labware_in_location(location)
            self._modules.raise_if_module_in_location(location)
        return location

    def get_labware_center(
        self,
        labware_id: str,
        location: Union[DeckSlotLocation, ModuleLocation, OnLabwareLocation],
    ) -> Point:
        """Get the center point of the labware as placed on the given location.

        Returns the absolute position of the labware as if it were placed on the
        specified location. Labware offset not included.
        """
        labware_dimensions = self._labware.get_dimensions(labware_id)
        offset = LabwareOffsetVector(x=0, y=0, z=0)
        location_slot: DeckSlotName

        if isinstance(location, ModuleLocation):
            deck_type = DeckType(self._labware.get_deck_definition()["otId"])
            offset = self._modules.get_module_offset(
                module_id=location.moduleId, deck_type=deck_type
            )
            location_slot = self._modules.get_location(location.moduleId).slotName
        elif isinstance(location, OnLabwareLocation):
            location_slot = self.get_ancestor_slot_name(location.labwareId)
            labware_offset = self._get_labware_position_offset(labware_id, location)
            # Get the calibrated offset if the on labware location is on top of a module, otherwise return empty one
            cal_offset = self._get_calibrated_module_offset(location)
            offset = LabwareOffsetVector(
                x=labware_offset.x + cal_offset.x,
                y=labware_offset.y + cal_offset.y,
                z=labware_offset.z + cal_offset.z,
            )
        else:
            location_slot = location.slotName
        slot_center = self._labware.get_slot_center_position(location_slot)
        return Point(
            slot_center.x + offset.x,
            slot_center.y + offset.y,
            slot_center.z + offset.z + labware_dimensions.z / 2,
        )

    def get_extra_waypoints(
        self, labware_id: str, location: Optional[CurrentWell]
    ) -> List[Tuple[float, float]]:
        """Get extra waypoints for movement if thermocycler needs to be dodged."""
        if location is not None and self._modules.should_dodge_thermocycler(
            from_slot=self.get_ancestor_slot_name(location.labware_id),
            to_slot=self.get_ancestor_slot_name(labware_id),
        ):
            middle_slot = DeckSlotName.SLOT_5.to_equivalent_for_robot_type(
                self._config.robot_type
            )
            middle_slot_center = self._labware.get_slot_center_position(
                slot=middle_slot,
            )
            return [(middle_slot_center.x, middle_slot_center.y)]
        return []

    # TODO(mc, 2022-12-09): enforce data integrity (e.g. one module per slot)
    # rather than shunting this work to callers via `allowed_ids`.
    # This has larger implications and is tied up in splitting LPC out of the protocol run
    def get_slot_item(
        self,
        slot_name: DeckSlotName,
        allowed_labware_ids: Set[str],
        allowed_module_ids: Set[str],
    ) -> Union[LoadedLabware, LoadedModule, None]:
        """Get the item present in a deck slot, if any."""
        maybe_labware = self._labware.get_by_slot(
            slot_name=slot_name,
            allowed_ids=allowed_labware_ids,
        )
        maybe_module = self._modules.get_by_slot(
            slot_name=slot_name,
            allowed_ids=allowed_module_ids,
        )

        return maybe_labware or maybe_module or None
