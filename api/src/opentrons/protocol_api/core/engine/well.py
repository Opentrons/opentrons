"""ProtocolEngine-based Well core implementations."""
from opentrons.protocol_engine import WellLocation, WellOrigin, WellOffset
from opentrons.protocol_engine.clients import SyncClient as EngineClient
from opentrons.protocols.geometry.well_geometry import WellGeometry
from opentrons.types import Point

from ..well import AbstractWellCore


class WellCore(AbstractWellCore):
    """Well API core using a ProtocolEngine.

    Args:
        name: The well's name in the labware, e.g. `A1`.
        labware_id: The ProtocolEngine ID of the well's parent labware.
        engine_client: Synchronous ProtocolEngine client.
    """

    def __init__(self, name: str, labware_id: str, engine_client: EngineClient) -> None:
        self._name = name
        self._labware_id = labware_id
        self._engine_client = engine_client
        self._definition = engine_client.state.labware.get_well_definition(
            labware_id=labware_id, well_name=name
        )

    @property
    def labware_id(self) -> str:
        """Get the ID of the well's parent labware."""
        return self._labware_id

    def has_tip(self) -> bool:
        """Whether the well contains a tip."""
        raise NotImplementedError("WellCore.has_tip not implemented")

    def set_has_tip(self, value: bool) -> None:
        """Set the well as containing or not containing a tip."""
        raise NotImplementedError("WellCore.set_has_tip not implemented")

    def get_display_name(self) -> str:
        """Get the well's full display name."""
        parent = self._engine_client.state.labware.get_display_name(self._labware_id)
        return f"{self._name} of {parent}"

    def get_name(self) -> str:
        """Get the name of the well (e.g. "A1")."""
        return self._name

    def get_column_name(self) -> str:
        """Get the column portion of the well name (e.g. "A")."""
        raise NotImplementedError("WellCore.get_column_name not implemented")

    def get_row_name(self) -> str:
        """Get the row portion of the well name (e.g. "1")."""
        raise NotImplementedError("WellCore.get_row_name not implemented")

    def get_max_volume(self) -> float:
        """Get the well's maximum liquid volume."""
        return self._definition.totalLiquidVolume

    def get_top(self, z_offset: float) -> Point:
        """Get the coordinate of the well's top, with an z-offset."""
        return self._engine_client.state.geometry.get_well_position(
            well_name=self._name,
            labware_id=self._labware_id,
            well_location=WellLocation(
                origin=WellOrigin.TOP, offset=WellOffset(x=0, y=0, z=z_offset)
            ),
        )

    def get_bottom(self, z_offset: float) -> Point:
        """Get the coordinate of the well's bottom, with an z-offset."""
        return self._engine_client.state.geometry.get_well_position(
            well_name=self._name,
            labware_id=self._labware_id,
            well_location=WellLocation(
                origin=WellOrigin.BOTTOM, offset=WellOffset(x=0, y=0, z=z_offset)
            ),
        )

    # TODO(mc, 2022-11-01): implement this with a new `WellOrigin.CENTER` value
    # Make this change carefully with respect to the robot-server because
    # `WellOrigin` is a public enum that may be persisted
    def get_center(self) -> Point:
        """Get the coordinate of the well's center, with an z-offset."""
        raise NotImplementedError("WellCore.get_center not implemented")

    def get_geometry(self) -> WellGeometry:
        """Get the well's geometry information interface."""
        raise NotImplementedError("WellCore.get_geometry not implemented")
