"""Geometry state store and getters."""
from dataclasses import dataclass

from opentrons_shared_data.deck.dev_types import DeckDefinitionV2
from opentrons.types import Point

from .substore import Substore, CommandReactive
from .labware import LabwareStore, LabwareData


@dataclass
class GeometryState:
    """Geometry state and getters."""
    _deck_definition: DeckDefinitionV2
    _labware_store: LabwareStore

    def get_deck_definition(self) -> DeckDefinitionV2:
        return self._deck_definition

    def get_slot_position(self, slot: int) -> Point:
        deck_def = self.get_deck_definition()
        position = deck_def["locations"]["orderedSlots"][slot - 1]["position"]

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

    def get_well_position(self, labware_id: str, well_id: str) -> Point:
        """Get the absolute position of a well in a labware."""
        # TODO(mc, 2020-10-29): implement CSS-style key point + offset option
        # rather than defaulting to well top
        labware_data = self._labware_store.state.get_labware_data_by_id(
            labware_id
        )
        well_def = self._labware_store.state.get_well_definition(
            labware_id,
            well_id
        )
        slot_pos = self.get_slot_position(labware_data.location.slot)
        cal_offset = labware_data.calibration

        return Point(
            x=slot_pos[0] + cal_offset[0] + well_def["x"],
            y=slot_pos[1] + cal_offset[1] + well_def["y"],
            z=slot_pos[2] + cal_offset[2] + well_def["z"] + well_def["depth"],
        )

    def _get_highest_z_from_labware_data(self, lw_data: LabwareData) -> float:
        z_dim = lw_data.definition["dimensions"]["zDimension"]
        slot_pos = self.get_slot_position(lw_data.location.slot)

        return z_dim + slot_pos[2] + lw_data.calibration[2]


class GeometryStore(Substore[GeometryState], CommandReactive):
    """Geometry state store container class."""

    def __init__(
        self,
        deck_definition: DeckDefinitionV2,
        labware_store: LabwareStore
    ) -> None:
        """Initialize a geometry store and its state."""
        self._state = GeometryState(
            _deck_definition=deck_definition,
            _labware_store=labware_store,
        )
