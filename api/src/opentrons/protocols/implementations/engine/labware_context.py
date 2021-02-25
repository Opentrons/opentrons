"""Module containing labware interface that works with Protocol Engine."""
from typing import Dict, List

from opentrons.protocols.geometry.labware_geometry import LabwareGeometry
from opentrons.protocols.implementations.tip_tracker import TipTracker
from opentrons.protocols.implementations.well import WellImplementation
from opentrons.protocols.implementations.well_grid import WellGrid
from opentrons.types import Point
from opentrons_shared_data.labware.dev_types import (
    LabwareDefinition, LabwareParameters
)
from opentrons.protocols.implementations.interfaces.labware\
    import LabwareInterface


class LabwareContext(LabwareInterface):
    """LabwareInterface implementation that works with the Protocol Engine."""

    def get_uri(self) -> str:
        raise NotImplementedError()

    def get_display_name(self) -> str:
        raise NotImplementedError()

    def get_name(self) -> str:
        raise NotImplementedError()

    def set_name(self, new_name: str) -> None:
        raise NotImplementedError()

    def get_definition(self) -> LabwareDefinition:
        raise NotImplementedError()

    def get_parameters(self) -> LabwareParameters:
        raise NotImplementedError()

    def get_quirks(self) -> List[str]:
        raise NotImplementedError()

    def set_calibration(self, delta: Point) -> None:
        raise NotImplementedError()

    def get_calibrated_offset(self) -> Point:
        raise NotImplementedError()

    def is_tiprack(self) -> bool:
        raise NotImplementedError()

    def get_tip_length(self) -> float:
        raise NotImplementedError()

    def set_tip_length(self, length: float):
        raise NotImplementedError()

    def reset_tips(self) -> None:
        raise NotImplementedError()

    def get_tip_tracker(self) -> TipTracker:
        raise NotImplementedError()

    def get_well_grid(self) -> WellGrid:
        raise NotImplementedError()

    def get_wells(self) -> List[WellImplementation]:
        raise NotImplementedError()

    def get_wells_by_name(self) -> Dict[str, WellImplementation]:
        raise NotImplementedError()

    def get_geometry(self) -> LabwareGeometry:
        raise NotImplementedError()

    @property
    def highest_z(self):
        raise NotImplementedError()

    @property
    def separate_calibration(self) -> bool:
        raise NotImplementedError()

    @property
    def load_name(self) -> str:
        raise NotImplementedError()
