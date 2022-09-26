"""ProtocolEngine-based Labware core implementations."""
from typing import List, Dict, Optional, cast

from opentrons_shared_data.labware.dev_types import (
    LabwareParameters,
    LabwareDefinition as LabwareDefinitionDict,
)

from opentrons.protocol_engine.clients import SyncClient as ProtocolEngineClient
from opentrons.protocols.geometry.labware_geometry import LabwareGeometry
from opentrons.protocols.api_support.tip_tracker import TipTracker
from opentrons.protocols.api_support.well_grid import WellGrid
from opentrons.types import Point

from ..labware import AbstractLabware, LabwareLoadParams
from .well import WellCore


class LabwareCore(AbstractLabware[WellCore]):
    """Labware API core using a ProtocolEngine.

    Args:
        labware_id: ProtocolEngine ID of the loaded labware.
    """

    def __init__(self, labware_id: str, engine_client: ProtocolEngineClient) -> None:
        self._labware_id = labware_id
        self._engine_client = engine_client

        labware_state = engine_client.state.labware
        self._definition = labware_state.get_definition(labware_id)
        self._user_display_name = labware_state.get_display_name(labware_id)

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
        raise NotImplementedError("LabwareCore not implemented")

    def get_load_params(self) -> LabwareLoadParams:
        return LabwareLoadParams(
            namespace=self._definition.namespace,
            load_name=self._definition.parameters.loadName,
            version=self._definition.version,
        )

    def get_display_name(self) -> str:
        """Get a display name for the labware, falling back to the definition."""
        raise NotImplementedError("LabwareCore not implemented")

    def get_user_display_name(self) -> Optional[str]:
        """Get the user-specified display name of the labware, if set."""
        return self._user_display_name

    def get_name(self) -> str:
        raise NotImplementedError("LabwareCore not implemented")

    def set_name(self, new_name: str) -> None:
        raise NotImplementedError("LabwareCore not implemented")

    def get_definition(self) -> LabwareDefinitionDict:
        """Get the labware's definition as a plain dictionary."""
        return cast(LabwareDefinitionDict, self._definition.dict(exclude_none=True))

    def get_parameters(self) -> LabwareParameters:
        raise NotImplementedError("LabwareCore not implemented")

    def get_quirks(self) -> List[str]:
        raise NotImplementedError("LabwareCore not implemented")

    def set_calibration(self, delta: Point) -> None:
        # TODO(jbl 2022-09-01): implement set calibration through the engine
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

    def get_default_magnet_engage_height(
        self, preserve_half_mm: bool = False
    ) -> Optional[float]:
        raise NotImplementedError("LabwareCore not implemented")
