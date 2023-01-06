"""ProtocolEngine-based Well core implementations."""
from typing import Optional, cast

from opentrons_shared_data.labware.constants import WELL_NAME_PATTERN

from opentrons.protocol_engine import WellLocation, WellOrigin, WellOffset
from opentrons.protocol_engine.clients import SyncClient as EngineClient
from opentrons.protocols.api_support.util import APIVersionError
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
        self._labware_id = labware_id
        self._engine_client = engine_client
        self._definition = engine_client.state.labware.get_well_definition(
            labware_id=labware_id, well_name=name
        )

        name_match = WELL_NAME_PATTERN.match(name)
        self._name = name
        self._row_name = name_match.group(1) if name_match is not None else ""
        self._column_name = name_match.group(2) if name_match is not None else ""

    @property
    def labware_id(self) -> str:
        """Get the ID of the well's parent labware."""
        return self._labware_id

    @property
    def diameter(self) -> Optional[float]:
        """Get the well's diameter, if circular."""
        return self._definition.diameter

    @property
    def length(self) -> Optional[float]:
        """Get the well's length, if rectangular."""
        return self._definition.xDimension

    @property
    def width(self) -> Optional[float]:
        """Get the well's width, if rectangular."""
        return self._definition.yDimension

    @property
    def depth(self) -> float:
        """Get the well's depth."""
        return self._definition.depth

    def has_tip(self) -> bool:
        """Whether the well contains a tip."""
        return self._engine_client.state.tips.has_clean_tip(
            self._labware_id, self._name
        )

    def set_has_tip(self, value: bool) -> None:
        """Set the well as containing or not containing a tip."""
        raise APIVersionError(
            "Manually setting the tip state of a well in a tip rack has been deprecated."
        )

    def get_display_name(self) -> str:
        """Get the well's full display name."""
        parent = self._engine_client.state.labware.get_display_name(self._labware_id)
        return f"{self._name} of {parent}"

    def get_name(self) -> str:
        """Get the name of the well (e.g. "A1")."""
        return self._name

    def get_column_name(self) -> str:
        """Get the column portion of the well name (e.g. "1")."""
        return self._column_name

    def get_row_name(self) -> str:
        """Get the row portion of the well name (e.g. "A")."""
        return self._row_name

    def get_max_volume(self) -> float:
        """Get the well's maximum liquid volume."""
        return self._definition.totalLiquidVolume

    def get_top(self, z_offset: float) -> Point:
        """Get the coordinate of the well's top, with a z-offset."""
        return self._engine_client.state.geometry.get_well_position(
            well_name=self._name,
            labware_id=self._labware_id,
            well_location=WellLocation(
                origin=WellOrigin.TOP, offset=WellOffset(x=0, y=0, z=z_offset)
            ),
        )

    def get_bottom(self, z_offset: float) -> Point:
        """Get the coordinate of the well's bottom, with a z-offset."""
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
        """Get the coordinate of the well's center, with a z-offset."""
        well_height = self._engine_client.state.geometry.get_well_height(
            labware_id=self.labware_id, well_name=self._name
        )
        return self.get_bottom(z_offset=well_height / 2)

    def from_center_cartesian(self, x: float, y: float, z: float) -> Point:
        """Gets point in deck coordinates based on percentage of the radius of each axis."""
        center = self.get_center()
        if self.diameter is not None:
            x_size = y_size = self.diameter
        else:
            # If diameter is None we know these values will be floats
            x_size = cast(float, self.length)
            y_size = cast(float, self.width)

        return Point(
            x=center.x + (x * (x_size / 2.0)),
            y=center.y + (y * (y_size / 2.0)),
            z=center.z + (z * (self.depth / 2.0)),
        )
