"""Geometry state store and getters."""
from dataclasses import dataclass
from typing import Optional
from typing_extensions import final

from opentrons_shared_data.deck.dev_types import DeckDefinitionV2, SlotDefV2
from opentrons.types import Point, DeckSlotName
from opentrons.hardware_control.dev_types import PipetteDict
from opentrons.protocols.geometry.deck import FIXED_TRASH_ID

from .. import errors
from ..types import WellLocation, WellOrigin
from .substore import Substore, CommandReactive
from .labware import LabwareStore, LabwareData


DEFAULT_TIP_DROP_HEIGHT_FACTOR = 0.5

# TODO(mc, 2020-11-12): reconcile this data structure with WellGeometry


@final
@dataclass(frozen=True)
class TipGeometry:
    """Tip geometry data."""

    effective_length: float
    diameter: float
    volume: int


class GeometryState:
    """Geometry getters."""

    _deck_definition: DeckDefinitionV2
    _labware_store: LabwareStore

    def __init__(
        self,
        deck_definition: DeckDefinitionV2,
        labware_store: LabwareStore
    ) -> None:
        """Initialize a GeometryState instance."""
        self._deck_definition = deck_definition
        self._labware_store = labware_store

    def get_deck_definition(self) -> DeckDefinitionV2:
        """Get the current deck definition."""
        return self._deck_definition

    def get_slot_definition(self, slot: DeckSlotName) -> SlotDefV2:
        """Get the current deck definition."""
        deck_def = self.get_deck_definition()

        for slot_def in deck_def["locations"]["orderedSlots"]:
            if slot_def["id"] == str(slot):
                return slot_def

        raise errors.SlotDoesNotExistError(
            f"Slot ID {slot} does not exist in deck {deck_def['otId']}"
        )

    def get_slot_position(self, slot: DeckSlotName) -> Point:
        """Get the position of a deck slot."""
        slot_def = self.get_slot_definition(slot)
        position = slot_def["position"]

        return Point(x=position[0], y=position[1], z=position[2])

    def get_labware_highest_z(self, labware_id: str) -> float:
        """Get the highest Z-point of a labware."""
        labware_data = self._labware_store.state.get_labware_data_by_id(
            labware_id
        )

        return self._get_highest_z_from_labware_data(labware_data)

    def get_all_labware_highest_z(self) -> float:
        """Get the highest Z-point of a labware."""
        return max([
            self._get_highest_z_from_labware_data(lw_data)
            for uid, lw_data in self._labware_store.state.get_all_labware()
        ])

    def get_well_position(
        self,
        labware_id: str,
        well_name: str,
        well_location: Optional[WellLocation] = None,
    ) -> Point:
        """Get the absolute position of a well in a labware."""
        labware_data = self._labware_store.state.get_labware_data_by_id(
            labware_id
        )
        well_def = self._labware_store.state.get_well_definition(
            labware_id,
            well_name
        )
        well_depth = well_def["depth"]
        slot_pos = self.get_slot_position(labware_data.location.slot)
        cal_offset = labware_data.calibration

        if well_location is not None:
            offset = well_location.offset

            if well_location.origin == WellOrigin.TOP:
                offset = (offset[0], offset[1], offset[2] + well_depth)

        else:
            offset = (0, 0, well_depth)

        return Point(
            x=slot_pos[0] + cal_offset[0] + offset[0] + well_def["x"],
            y=slot_pos[1] + cal_offset[1] + offset[1] + well_def["y"],
            z=slot_pos[2] + cal_offset[2] + offset[2] + well_def["z"],
        )

    def _get_highest_z_from_labware_data(self, lw_data: LabwareData) -> float:
        z_dim = lw_data.definition["dimensions"]["zDimension"]
        slot_pos = self.get_slot_position(lw_data.location.slot)

        return z_dim + slot_pos[2] + lw_data.calibration[2]

    # TODO(mc, 2020-11-12): reconcile with existing protocol logic and include
    # data from tip-length calibration once v4.0.0 is in `edge`
    def get_effective_tip_length(
        self,
        labware_id: str,
        pipette_config: PipetteDict
    ) -> float:
        """
        Given a labware and a pipette's config, get the effective tip length.

        Effective tip length is the nominal tip length less the distance the
        tip overlaps with the pipette nozzle.
        """
        labware_uri = self._labware_store.state.get_definition_uri(labware_id)
        nominal_length = self._labware_store.state.get_tip_length(labware_id)
        overlap_config = pipette_config["tip_overlap"]
        default_overlap = overlap_config.get("default", 0)
        overlap = overlap_config.get(labware_uri, default_overlap)

        return nominal_length - overlap

    # TODO(mc, 2020-11-12): reconcile with existing geometry logic
    def get_tip_geometry(
        self,
        labware_id: str,
        well_name: str,
        pipette_config: PipetteDict
    ) -> TipGeometry:
        """
        Given a labware, well, and hardware pipette config, get the tip geometry.

        Tip geometry includes effective tip length, tip diameter, and tip volume,
        which is all data required by the hardware controller for proper tip handling.
        """
        effective_length = self.get_effective_tip_length(labware_id, pipette_config)
        well_def = self._labware_store.state.get_well_definition(labware_id, well_name)

        if well_def["shape"] != "circular":
            raise errors.LabwareIsNotTipRackError(
                f"Well {well_name} in labware {labware_id} is not circular."
            )

        return TipGeometry(
            effective_length=effective_length,
            diameter=well_def["diameter"],
            # TODO(mc, 2020-11-12): WellDefinition type says totalLiquidVolume
            # is a float, but hardware controller expects an int
            volume=int(well_def["totalLiquidVolume"]),
        )

    # TODO(mc, 2020-11-12): support pre-PAPIv2.2/2.3 behavior of dropping the tip
    # 10mm above well bottom
    def get_tip_drop_location(
        self,
        labware_id: str,
        pipette_config: PipetteDict
    ) -> WellLocation:
        """Get tip drop location given labware and hardware pipette."""
        # return to top if labware is fixed trash
        if labware_id == FIXED_TRASH_ID:
            return WellLocation()

        nominal_length = self._labware_store.state.get_tip_length(labware_id)
        offset_factor = pipette_config["return_tip_height"]

        return WellLocation(offset=(0, 0, -nominal_length * offset_factor))


class GeometryStore(Substore[GeometryState], CommandReactive):
    """Geometry state container."""

    _state: GeometryState

    def __init__(
        self,
        deck_definition: DeckDefinitionV2,
        labware_store: LabwareStore
    ) -> None:
        """Initialize a geometry store and its state."""
        self._state = GeometryState(
            deck_definition=deck_definition,
            labware_store=labware_store,
        )
