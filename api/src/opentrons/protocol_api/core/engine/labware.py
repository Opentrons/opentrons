"""ProtocolEngine-based Labware core implementations."""
from typing import List, Dict, Optional

from opentrons.calibration_storage import helpers
from opentrons.protocols.geometry.labware_geometry import LabwareGeometry
from opentrons.protocols.api_support.tip_tracker import TipTracker
from opentrons.protocols.api_support.well_grid import WellGrid
from opentrons.types import Point
from opentrons_shared_data.labware.dev_types import LabwareParameters, LabwareDefinition

from ..labware import AbstractLabware
from .well import WellCore


class LabwareCore(AbstractLabware[WellCore]):
    """Labware API core using a ProtocolEngine.

    Args:
        labware_id: ProtocolEngine ID of the loaded labware.
    """

    def __init__(self, labware_id: str, definition: LabwareDefinition) -> None:
        self._labware_id = labware_id
        self._definition = definition

    @property
    def labware_id(self) -> str:
        """The labware's unique ProtocolEngine ID."""
        return self._labware_id

    @property
    def highest_z(self) -> float:
        raise NotImplementedError("LabwareCore not implemented")

    @property
    def separate_calibration(self) -> bool:
        raise NotImplementedError("LabwareCore not implemented")

    @property
    def load_name(self) -> str:
        raise NotImplementedError("LabwareCore not implemented")

    def get_uri(self) -> str:
        return helpers.uri_from_definition(self._definition)

    def get_display_name(self) -> str:
        raise NotImplementedError("LabwareCore not implemented")

    def get_label(self) -> Optional[str]:
        # TODO(jbl 2022-09-01) implement real get_label
        return "no-op"

    def get_name(self) -> str:
        raise NotImplementedError("LabwareCore not implemented")

    def set_name(self, new_name: str) -> None:
        raise NotImplementedError("LabwareCore not implemented")

    def get_definition(self) -> LabwareDefinition:
        return self._definition

    def get_parameters(self) -> LabwareParameters:
        raise NotImplementedError("LabwareCore not implemented")

    def get_quirks(self) -> List[str]:
        raise NotImplementedError("LabwareCore not implemented")

    def set_calibration(self, delta: Point) -> None:
        # TODO(jbl 2022-09-01) implement set calibration
        pass

    def get_calibrated_offset(self) -> Point:
        raise NotImplementedError("LabwareCore not implemented")

    def is_tiprack(self) -> bool:
        raise NotImplementedError("LabwareCore not implemented")

    def get_tip_length(self) -> float:
        raise NotImplementedError("LabwareCore not implemented")

    def set_tip_length(self, length: float) -> None:
        raise NotImplementedError("LabwareCore not implemented")

    def reset_tips(self) -> None:
        raise NotImplementedError("LabwareCore not implemented")

    def get_tip_tracker(self) -> TipTracker:
        raise NotImplementedError("LabwareCore not implemented")

    def get_well_grid(self) -> WellGrid:
        raise NotImplementedError("LabwareCore not implemented")

    def get_wells(self) -> List[WellCore]:
        raise NotImplementedError("LabwareCore not implemented")

    def get_wells_by_name(self) -> Dict[str, WellCore]:
        raise NotImplementedError("LabwareCore not implemented")

    def get_geometry(self) -> LabwareGeometry:
        raise NotImplementedError("LabwareCore not implemented")
